import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { signOutAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const session = await auth();
  const user = session!.user;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Settings</h1>

      <div className="mt-6 max-w-md space-y-4 rounded-lg border border-border p-5 text-sm">
        <div>
          <p className="text-muted-foreground">Name</p>
          <p className="mt-0.5">{user.name ?? "Not set"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Email</p>
          <p className="mt-0.5">{user.email}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Account type</p>
          <p className="mt-0.5">{user.role === "ADMIN" ? "Administrator" : "Customer"}</p>
        </div>
      </div>

      <form action={signOutAction} className="mt-6">
        <Button type="submit" variant="secondary">
          Sign out
        </Button>
      </form>
    </div>
  );
}
