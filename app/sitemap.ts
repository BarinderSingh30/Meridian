import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

const STATIC_ROUTES = ["", "/about", "/contact", "/faq", "/shipping-returns", "/terms", "/privacy"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_APP_URL;

  const [categories, products] = await Promise.all([
    prisma.category.findMany({ select: { slug: true } }),
    prisma.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
  ]);

  return [
    ...STATIC_ROUTES.map((route) => ({ url: `${base}${route}` })),
    ...categories.map((c) => ({ url: `${base}/c/${c.slug}` })),
    ...products.map((p) => ({ url: `${base}/p/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
