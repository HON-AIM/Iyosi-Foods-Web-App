import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const token = resolvedParams.token as string;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <div className="bg-white p-8 rounded-lg shadow max-w-md w-full text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-red-500 mx-auto mb-4"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h2>
            <p className="text-gray-600 mb-6">No verification token was provided.</p>
            <Link href="/login" className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition">Return to Login</Link>
         </div>
      </div>
    );
  }

  // Hash the raw token to match the stored hash (register API stores SHA-256 hashed tokens)
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  // Find token in db using the hash
  const verificationRecord = await prisma.verificationToken.findUnique({
    where: { token: tokenHash },
  });

  if (!verificationRecord) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
           <div className="bg-white p-8 rounded-lg shadow max-w-md w-full text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-red-500 mx-auto mb-4"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Token not found</h2>
              <p className="text-gray-600 mb-6">This verification link is invalid or has already been used.</p>
              <Link href="/login" className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition">Return to Login</Link>
           </div>
        </div>
      );
  }

  // Check Expiry
  if (new Date() > verificationRecord.expires) {
    // Optional: Delete expired token here
    await prisma.verificationToken.delete({ where: { token: tokenHash } });
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
           <div className="bg-white p-8 rounded-lg shadow max-w-md w-full text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-red-500 mx-auto mb-4"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h2>
              <p className="text-gray-600 mb-6">This verification link has expired. Please register again or request a new link.</p>
              <Link href="/register" className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition">Register</Link>
           </div>
        </div>
      );
  }

  // Valid Token: Update user and delete token
  await prisma.user.update({
    where: { email: verificationRecord.identifier },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({ where: { token: tokenHash } });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <div className="bg-white p-8 rounded-lg shadow max-w-md w-full text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-green-500 mx-auto mb-4"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-6">Your email address has been successfully verified. You can now access your account.</p>
            <Link href="/login" className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition">Go to Login</Link>
         </div>
    </div>
  );
}
