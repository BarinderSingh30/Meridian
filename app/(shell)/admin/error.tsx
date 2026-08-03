"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Admin action failed</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Something went wrong loading this admin page. Try again, or navigate away.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
