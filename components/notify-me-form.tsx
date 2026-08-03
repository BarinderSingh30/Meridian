"use client";

import { useState } from "react";
import { notifyMeAction } from "@/lib/actions/notify-actions";

export function NotifyMeForm({ productId }: { productId: string }) {
  const [state, setState] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email");
    if (typeof email !== "string" || !email) return;

    setState("pending");
    const result = await notifyMeAction(productId, email);
    if (result.success) {
      setState("done");
    } else {
      setState("error");
      setError(result.error);
    }
  }

  if (state === "done") {
    return (
      <p className="w-full rounded-[4px] border border-border py-1.5 text-center text-[10px] font-semibold text-teal-dark">
        We&apos;ll email you
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <input
        type="email"
        name="email"
        required
        placeholder="you@email.com"
        className="w-full rounded-[4px] border border-border px-2 py-1.5 text-[10px] text-ink outline-none placeholder:text-muted-2 focus-visible:border-[1.5px] focus-visible:border-teal"
      />
      <button
        type="submit"
        disabled={state === "pending"}
        className="w-full rounded-[4px] border border-border py-1.5 text-center text-[10px] font-semibold text-muted-2 hover:bg-surface-muted disabled:opacity-50"
      >
        {state === "pending" ? "Sending..." : "Notify me"}
      </button>
      {state === "error" && <p className="text-[9px] font-medium text-danger">{error}</p>}
    </form>
  );
}
