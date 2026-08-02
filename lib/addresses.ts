import { prisma } from "@/lib/db";

export function getAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export type AddressListItem = Awaited<ReturnType<typeof getAddresses>>[number];
