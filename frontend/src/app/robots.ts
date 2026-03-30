import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify",
          "/verify-email",
          "/settings",
          "/wallet",
          "/connect",
          "/birthday-profile",
          "/events/mine",
          "/events/*/applications",
        ],
      },
    ],
    sitemap: "https://celnoia.com/sitemap.xml",
  };
}
