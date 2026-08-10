import type { MetadataRoute } from "next";
import { SITE_URL } from "@/src/config/seo";

const publicRoutes = [
  { path: "/", changeFrequency: "daily" as const, priority: 1 },
  { path: "/about", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/contact", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/is", changeFrequency: "yearly" as const, priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map(route => ({
    url: new URL(route.path, SITE_URL).toString(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
