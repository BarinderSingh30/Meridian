export function highlightMatches(text: string, query?: string): React.ReactNode {
  if (!query || query.trim().length < 2) return text;

  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  if (parts.length === 1) return text;

  return parts.map((part, i) =>
    part.toLowerCase() === query.trim().toLowerCase() ? (
      <mark key={i} className="rounded-[2px] bg-teal-tint text-teal-dark">
        {part}
      </mark>
    ) : (
      part
    )
  );
}
