import "dotenv/config";
import { prisma } from "@/lib/db";
import { calculateShippingCents } from "@/lib/shipping";
import { CATEGORIES, PRODUCTS, REVIEWS, REVIEWERS, type SeedCategory } from "./seed-data";

const SAMPLE_ORDER_COUNT = 8;

async function upsertCategoryTree(nodes: SeedCategory[], parentId: string | null, position0: number) {
  let position = position0;
  for (const node of nodes) {
    const category = await prisma.category.upsert({
      where: { slug: node.slug },
      update: { name: node.name, imageUrl: node.imageUrl, parentId, position },
      create: { name: node.name, slug: node.slug, imageUrl: node.imageUrl, parentId, position },
    });
    position += 1;
    if (node.children?.length) {
      await upsertCategoryTree(node.children, category.id, 0);
    }
  }
}

async function upsertProducts() {
  const bySlug = new Map<string, string>(); // categorySlug -> categoryId
  const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
  for (const c of categories) bySlug.set(c.slug, c.id);

  for (const p of PRODUCTS) {
    const categoryId = bySlug.get(p.categorySlug);
    if (!categoryId) {
      throw new Error(`Product "${p.slug}" references unknown category "${p.categorySlug}"`);
    }
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        brand: p.brand,
        sku: p.sku,
        priceCents: p.priceCents,
        compareAtPriceCents: p.compareAtPriceCents,
        stockQuantity: p.stockQuantity,
        specs: p.specs,
        categoryId,
      },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        brand: p.brand,
        sku: p.sku,
        priceCents: p.priceCents,
        compareAtPriceCents: p.compareAtPriceCents,
        stockQuantity: p.stockQuantity,
        specs: p.specs,
        categoryId,
      },
    });
    // Images are cheap to fully replace on every seed run rather than diffed/upserted.
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: p.images.map((url, i) => ({ productId: product.id, url, position: i })),
    });
  }
}

async function upsertUsers() {
  const demoCustomerEmail = requireEnv("DEMO_CUSTOMER_EMAIL");
  const demoAdminEmail = requireEnv("DEMO_ADMIN_EMAIL");

  const demoCustomer = await prisma.user.upsert({
    where: { email: demoCustomerEmail },
    update: {},
    create: { email: demoCustomerEmail, name: "Demo Customer", role: "CUSTOMER" },
  });
  const demoAdmin = await prisma.user.upsert({
    where: { email: demoAdminEmail },
    update: { role: "ADMIN" },
    create: { email: demoAdminEmail, name: "Demo Admin", role: "ADMIN" },
  });

  const reviewers = [];
  for (const r of REVIEWERS) {
    reviewers.push(
      await prisma.user.upsert({
        where: { email: r.email },
        update: { name: r.name },
        create: { email: r.email, name: r.name, role: "CUSTOMER" },
      })
    );
  }

  return { demoCustomer, demoAdmin, reviewers };
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

async function createSampleOrders(orderOwners: { id: string; email: string }[]) {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE", stockQuantity: { gt: 0 } },
    select: { id: true, name: true, slug: true, priceCents: true },
  });
  if (products.length === 0) throw new Error("No in-stock products to build sample orders from");

  for (let i = 0; i < SAMPLE_ORDER_COUNT; i++) {
    const owner = orderOwners[i % orderOwners.length];
    const orderNumber = `ORD-SEED-${String(i + 1).padStart(2, "0")}`;
    const itemCount = 1 + (i % 3); // 1-3 items
    const items = Array.from({ length: itemCount }, (_, j) => products[(i * 3 + j) % products.length]);

    const subtotalCents = items.reduce((sum, p) => sum + p.priceCents, 0);
    const shippingCents = calculateShippingCents(subtotalCents);
    const totalCents = subtotalCents + shippingCents;

    const existing = await prisma.order.findUnique({ where: { orderNumber } });
    if (existing) continue; // idempotent: don't recreate sample orders that already exist

    await prisma.order.create({
      data: {
        orderNumber,
        userId: owner.id,
        email: owner.email,
        status: "PAID",
        subtotalCents,
        shippingCents,
        taxCents: 0,
        discountCents: 0,
        totalCents,
        shipName: "Demo Recipient",
        shipLine1: "123 Market Street",
        shipCity: "San Francisco",
        shipState: "CA",
        shipPostalCode: "94103",
        shipCountry: "US",
        paidAt: new Date(),
        items: {
          create: items.map((p) => ({
            productId: p.id,
            productName: p.name,
            productSlug: p.slug,
            unitPriceCents: p.priceCents,
            quantity: 1,
            lineTotalCents: p.priceCents,
          })),
        },
      },
    });
  }
}

async function upsertReviews(
  reviewers: { id: string; email: string }[],
  demoCustomer: { id: string; email: string }
) {
  const allReviewers = [demoCustomer, ...reviewers];
  const products = await prisma.product.findMany({ select: { id: true, slug: true } });
  const bySlug = new Map(products.map((p) => [p.slug, p.id]));

  // Precompute which (userId, productId) pairs are "verified" via the sample orders.
  const paidItems = await prisma.orderItem.findMany({
    where: { order: { status: { in: ["PAID", "FULFILLED"] } } },
    select: { productId: true, order: { select: { userId: true } } },
  });
  const verifiedPairs = new Set(
    paidItems
      .filter((i) => i.order.userId && i.productId)
      .map((i) => `${i.order.userId}:${i.productId}`)
  );

  const touchedProductIds = new Set<string>();

  for (let i = 0; i < REVIEWS.length; i++) {
    const r = REVIEWS[i];
    const productId = bySlug.get(r.productSlug);
    if (!productId) {
      throw new Error(`Review references unknown product slug "${r.productSlug}"`);
    }
    const reviewer = allReviewers[i % allReviewers.length];
    const isVerifiedPurchase = verifiedPairs.has(`${reviewer.id}:${productId}`);

    await prisma.review.upsert({
      where: { userId_productId: { userId: reviewer.id, productId } },
      update: { rating: r.rating, title: r.title, body: r.body ?? "", isVerifiedPurchase },
      create: {
        userId: reviewer.id,
        productId,
        rating: r.rating,
        title: r.title,
        body: r.body ?? "",
        isVerifiedPurchase,
      },
    });
    touchedProductIds.add(productId);
  }

  for (const productId of touchedProductIds) {
    const agg = await prisma.review.aggregate({
      where: { productId, status: "PUBLISHED" },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.product.update({
      where: { id: productId },
      data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count },
    });
  }
}

async function main() {
  console.log("Seeding categories...");
  await upsertCategoryTree(CATEGORIES, null, 0);

  console.log("Seeding products + images...");
  await upsertProducts();

  console.log("Seeding users (demo + reviewers)...");
  const { demoCustomer, demoAdmin, reviewers } = await upsertUsers();

  console.log("Seeding sample paid orders...");
  await createSampleOrders([demoCustomer, ...reviewers]);

  console.log("Seeding reviews...");
  await upsertReviews(reviewers, demoCustomer);

  const [categoryCount, productCount, userCount, orderCount, reviewCount] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.user.count(),
    prisma.order.count(),
    prisma.review.count(),
  ]);
  console.log({ categoryCount, productCount, userCount, orderCount, reviewCount, demoAdmin: demoAdmin.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
