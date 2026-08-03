"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Autocomplete } from "@base-ui/react/autocomplete";

type Suggestion = { slug: string; name: string; imageUrl: string | null };

const DEBOUNCE_MS = 200;
const MIN_QUERY_LENGTH = 2;

export function SearchAutocomplete() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = inputValue.trim();
    if (query.length < MIN_QUERY_LENGTH) {
      abortRef.current?.abort();
      return;
    }

    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((res) => (res.ok ? (res.json() as Promise<Suggestion[]>) : []))
        .then((data) => setItems(Array.isArray(data) ? data : []))
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setItems([]);
        });
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, [inputValue]);

  // Derived (not stored in state) so a short query never renders stale results,
  // even if an in-flight fetch for a longer query resolves after the user deletes back down.
  const visibleItems = inputValue.trim().length >= MIN_QUERY_LENGTH ? items : [];

  return (
    <Autocomplete.Root
      items={visibleItems}
      filter={null}
      value={inputValue}
      onValueChange={(value) => setInputValue(value)}
      itemToStringValue={(item: Suggestion) => item.name}
    >
      <form
        action="/search"
        className="relative order-last flex w-full items-stretch overflow-hidden rounded-[5px] bg-surface sm:order-none sm:max-w-[620px] sm:flex-1"
      >
        <label htmlFor="site-search" className="sr-only">
          Search products
        </label>
        <Autocomplete.Input
          id="site-search"
          type="search"
          name="q"
          placeholder="Search products, brands and categories"
          className="w-full border-0 bg-transparent px-3 py-[10px] text-xs text-ink outline-none placeholder:text-muted-2"
        />
        <button
          type="submit"
          className="shrink-0 bg-teal px-[18px] text-xs font-semibold text-white hover:bg-teal-dark"
        >
          Search
        </button>

        <Autocomplete.Portal>
          <Autocomplete.Positioner sideOffset={4} className="z-50">
            <Autocomplete.Popup className="max-h-80 w-(--anchor-width) overflow-auto rounded-[6px] border border-border bg-surface">
              <Autocomplete.List>
                {(item: Suggestion) => (
                  <Autocomplete.Item
                    key={item.slug}
                    value={item}
                    onClick={() => router.push(`/p/${item.slug}`)}
                    className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs data-[highlighted]:bg-surface-muted"
                  >
                    <span className="relative size-8 shrink-0 overflow-hidden rounded-[4px] bg-surface-muted">
                      {item.imageUrl && (
                        <Image src={item.imageUrl} alt="" fill sizes="32px" className="object-cover" />
                      )}
                    </span>
                    <span className="truncate text-ink">{item.name}</span>
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </form>
    </Autocomplete.Root>
  );
}
