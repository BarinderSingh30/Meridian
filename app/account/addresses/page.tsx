import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getAddresses } from "@/lib/addresses";
import { deleteAddressAction, setDefaultAddressAction } from "@/lib/actions/address-actions";
import { AddressForm } from "@/components/address-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Addresses",
};

type SearchParamsType = Promise<{ edit?: string }>;

export default async function AddressesPage({ searchParams }: { searchParams: SearchParamsType }) {
  const session = await auth();
  const [addresses, sp] = await Promise.all([getAddresses(session!.user.id), searchParams]);
  const editing = sp.edit ? addresses.find((a) => a.id === sp.edit) : undefined;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Addresses</h1>

        {addresses.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">You haven&apos;t saved any addresses yet.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {addresses.map((address) => (
              <li key={address.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-sm">
                    <p className="font-medium">
                      {address.fullName}
                      {address.isDefault && (
                        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                          Default
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                      <br />
                      {address.city}
                      {address.state ? `, ${address.state}` : ""} {address.postalCode}
                      <br />
                      {address.country}
                      {address.phone ? ` · ${address.phone}` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <a href={`/account/addresses?edit=${address.id}`} className="text-sm underline underline-offset-4">
                      Edit
                    </a>
                    {!address.isDefault && (
                      <form action={setDefaultAddressAction}>
                        <input type="hidden" name="addressId" value={address.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Set default
                        </Button>
                      </form>
                    )}
                    <form action={deleteAddressAction}>
                      <input type="hidden" name="addressId" value={address.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Delete
                      </Button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddressForm
        key={editing?.id ?? "new"}
        editing={editing}
        title={editing ? "Edit address" : "Add a new address"}
        cancelHref={editing ? "/account/addresses" : undefined}
      />
    </div>
  );
}
