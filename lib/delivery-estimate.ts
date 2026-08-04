export type DeliveryEstimate = { zone: string; minDays: number; maxDays: number };

// 2-digit PIN-code prefix -> metro zone name. No courier API (YAGNI) - a
// small static table is enough to make the estimate feel real per-PIN
// rather than a single constant string for every input.
const METRO_ZONES: Record<string, string> = {
  "11": "Delhi NCR",
  "40": "Mumbai",
  "41": "Pune",
  "56": "Bengaluru",
  "60": "Chennai",
  "50": "Hyderabad",
  "70": "Kolkata",
  "38": "Ahmedabad",
};

export function estimateDelivery(pincode: string): DeliveryEstimate | null {
  if (!/^\d{6}$/.test(pincode)) return null;

  const prefix = pincode.slice(0, 2);
  const zone = METRO_ZONES[prefix];
  return zone ? { zone, minDays: 2, maxDays: 3 } : { zone: "Rest of India", minDays: 4, maxDays: 6 };
}
