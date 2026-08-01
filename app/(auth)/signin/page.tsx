import { signIn } from "@/lib/auth";
import { signInWithGoogle, signInAsDemoCustomer, signInAsDemoAdmin } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center gap-6 px-4 py-16">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Sign in to Meridian</h1>
        <p className="text-sm text-muted-foreground">Choose how you'd like to continue.</p>
      </div>

      <form action={signInWithGoogle}>
        <Button type="submit" variant="outline" className="w-full">
          Continue with Google
        </Button>
      </form>

      <form
        action={async (formData: FormData) => {
          "use server";
          await signIn("resend", formData);
        }}
        className="space-y-2"
      >
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button type="submit" className="w-full">
          Email me a sign-in link
        </Button>
      </form>

      <div className="relative text-center text-xs text-muted-foreground">
        <span className="bg-background px-2">or try it instantly as a demo user</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <form action={signInAsDemoCustomer}>
          <Button type="submit" variant="secondary" className="w-full">
            Demo customer
          </Button>
        </form>
        <form action={signInAsDemoAdmin}>
          <Button type="submit" variant="secondary" className="w-full">
            Demo admin
          </Button>
        </form>
      </div>
    </div>
  );
}
