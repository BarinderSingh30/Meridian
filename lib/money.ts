export function formatMoney(cents: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(cents / 100);
}
