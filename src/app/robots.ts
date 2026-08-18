import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXTAUTH_URL || "https://iyosi-foods-web-app.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/shop", "/shop/product/", "/about", "/contact", "/products"],
        disallow: ["/dashboard", "/admin", "/api", "/checkout", "/verify"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
