"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * The webhook that flips an order from PENDING to PAID may not have landed
 * yet when the browser arrives on the success page (arriving here is not
 * proof of payment). Poll by re-fetching the server-rendered page every 2s
 * until the order's status changes.
 */
export function PendingOrderPoller() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 2000);
    return () => clearInterval(interval);
  }, [router]);

  return null;
}
