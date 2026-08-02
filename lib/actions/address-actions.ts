"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function readAddressFields(formData: FormData) {
  return {
    fullName: String(formData.get("fullName") ?? "").trim(),
    line1: String(formData.get("line1") ?? "").trim(),
    line2: String(formData.get("line2") ?? "").trim() || null,
    city: String(formData.get("city") ?? "").trim(),
    state: String(formData.get("state") ?? "").trim() || null,
    postalCode: String(formData.get("postalCode") ?? "").trim(),
    country: String(formData.get("country") ?? "IN").trim() || "IN",
    phone: String(formData.get("phone") ?? "").trim() || null,
  };
}

export async function createAddressAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const fields = readAddressFields(formData);
  if (!fields.fullName || !fields.line1 || !fields.city || !fields.postalCode) return;

  const existingCount = await prisma.address.count({ where: { userId: session.user.id } });

  await prisma.address.create({
    data: { ...fields, userId: session.user.id, isDefault: existingCount === 0 },
  });

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}

export async function updateAddressAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const addressId = String(formData.get("addressId") ?? "");
  if (!addressId) return;

  const fields = readAddressFields(formData);
  if (!fields.fullName || !fields.line1 || !fields.city || !fields.postalCode) return;

  await prisma.address.updateMany({
    where: { id: addressId, userId: session.user.id },
    data: fields,
  });

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}

export async function deleteAddressAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const addressId = String(formData.get("addressId") ?? "");
  if (!addressId) return;

  await prisma.$transaction(async (tx) => {
    const address = await tx.address.findFirst({ where: { id: addressId, userId: session.user.id } });
    if (!address) return;

    await tx.address.delete({ where: { id: addressId } });

    if (address.isDefault) {
      const next = await tx.address.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "asc" },
      });
      if (next) {
        await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }
  });

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}

export async function setDefaultAddressAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const addressId = String(formData.get("addressId") ?? "");
  if (!addressId) return;

  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } }),
    prisma.address.updateMany({ where: { id: addressId, userId: session.user.id }, data: { isDefault: true } }),
  ]);

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}
