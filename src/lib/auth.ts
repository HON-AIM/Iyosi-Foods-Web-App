import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { CredentialsSignin } from "@auth/core/errors";

class InvalidCredentialsError extends CredentialsSignin {
  constructor() { super(); this.code = "InvalidCredentials"; }
}
class TooManyAttemptsError extends CredentialsSignin {
  constructor() { super(); this.code = "TooManyAttempts"; }
}
class EmailNotVerifiedError extends CredentialsSignin {
  constructor() { super(); this.code = "EmailNotVerified"; }
}
class AccountDisabledError extends CredentialsSignin {
  constructor() { super(); this.code = "AccountDisabled"; }
}

const CredentialsSchema = z.object({
  email: z
    .string()
    .email()
    .trim()
    .toLowerCase(),
  password: z.string().min(1),
  rememberMe: z.coerce.boolean().optional(),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    ...authConfig.providers,
    CredentialsProvider({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const validation = CredentialsSchema.safeParse(credentials);

        if (!validation.success) {
          throw new InvalidCredentialsError();
        }

        const { email, password, rememberMe } = validation.data;

        const ip =
          req?.headers?.get("x-forwarded-for") ||
          req?.headers?.get("x-real-ip") ||
          "unknown";

        try {
          const user = await prisma.user.findUnique({
            where: { email },
            include: {
              loginAttempts: {
                where: {
                  createdAt: {
                    gte: new Date(Date.now() - 15 * 60 * 1000),
                  },
                },
              },
            },
          });

          if (user?.loginAttempts && user.loginAttempts.length >= 5) {
            console.warn("[SECURITY] Account locked due to failed attempts:", {
              email,
              attempts: user.loginAttempts.length,
              ip,
            });
            throw new TooManyAttemptsError();
          }

          if (!user || !user.password) {
            throw new InvalidCredentialsError();
          }

          if (!user.emailVerified) {
            console.warn("[SECURITY] Login attempt with unverified email:", {
              email,
              ip,
            });
            await prisma.loginAttempt.create({
              data: {
                userId: user.id,
                ipAddress: ip,
                userAgent: req?.headers?.get("user-agent"),
                success: false,
              },
            });
            throw new EmailNotVerifiedError();
          }

          if (!user.isActive) {
            console.warn("[SECURITY] Login attempt on disabled account:", {
              email,
              ip,
            });
            await prisma.loginAttempt.create({
              data: {
                userId: user.id,
                ipAddress: ip,
                userAgent: req?.headers?.get("user-agent"),
                success: false,
              },
            });
            throw new AccountDisabledError();
          }

          if (!(await bcrypt.compare(password, user.password))) {
            await prisma.loginAttempt.create({
              data: {
                userId: user.id,
                ipAddress: ip,
                userAgent: req?.headers?.get("user-agent"),
                success: false,
              },
            });

            console.warn("[SECURITY] Failed login attempt:", {
              email,
              ip,
            });

            throw new InvalidCredentialsError();
          }

          await prisma.loginAttempt.deleteMany({
            where: {
              userId: user.id,
              success: false,
              createdAt: {
                gte: new Date(Date.now() - 15 * 60 * 1000),
              },
            },
          });

          await prisma.loginAttempt.create({
            data: {
              userId: user.id,
              ipAddress: ip,
              userAgent: req?.headers?.get("user-agent"),
              success: true,
            },
          });

          await prisma.user.update({
            where: { id: user.id },
            data: {
              lastLogin: new Date(),
            },
          });

          console.info("[AUDIT] Successful login:", {
            userId: user.id,
            email: user.email,
            ip,
            rememberMe,
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          };
        } catch (error) {
          if (error instanceof CredentialsSignin) throw error;
          const errorMessage =
            error instanceof Error ? error.message : "AuthenticationError";
          throw new InvalidCredentialsError();
        }
      },
    }),
  ],
});
