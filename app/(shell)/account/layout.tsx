import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AccountNav } from "@/components/account-nav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
        <aside>
          <AccountNav
            name={session.user.name ?? session.user.email ?? "Account"}
            email={session.user.email ?? ""}
          />
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
