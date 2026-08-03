import { createAddressAction, updateAddressAction } from "@/lib/actions/address-actions";
import type { AddressListItem } from "@/lib/addresses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddressForm({
  editing,
  cancelHref,
  title,
}: {
  editing?: AddressListItem;
  cancelHref?: string;
  title?: string;
}) {
  return (
    <div className="max-w-lg">
      {title && <h2 className="text-lg font-semibold">{title}</h2>}
      <form action={editing ? updateAddressAction : createAddressAction} className={title ? "mt-4 space-y-4" : "space-y-4"}>
        {editing && <input type="hidden" name="addressId" value={editing.id} />}

        <Field label="Full name" name="fullName" defaultValue={editing?.fullName} required />
        <Field label="Address line 1" name="line1" defaultValue={editing?.line1} required />
        <Field label="Address line 2 (optional)" name="line2" defaultValue={editing?.line2 ?? ""} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="City" name="city" defaultValue={editing?.city} required />
          <Field label="State" name="state" defaultValue={editing?.state ?? ""} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Postal code" name="postalCode" defaultValue={editing?.postalCode} required />
          <Field label="Country" name="country" defaultValue={editing?.country ?? "IN"} required />
        </div>
        <Field label="Phone (optional)" name="phone" defaultValue={editing?.phone ?? ""} type="tel" />

        <div className="flex gap-3 pt-2">
          <Button type="submit">{editing ? "Save changes" : "Add address"}</Button>
          {cancelHref && (
            <a href={cancelHref}>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </a>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-xs">
      <span className="mb-1 block font-medium text-ink-3">{label}</span>
      <Input type={type} name={name} defaultValue={defaultValue} required={required} />
    </label>
  );
}
