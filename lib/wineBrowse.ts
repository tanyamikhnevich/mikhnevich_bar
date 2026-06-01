"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Wine } from "./wines";
import {
  appendBrowseParams,
  type WineBrowseFilters,
  type WineColor,
  WINE_COLOR_ORDER,
  WINE_TABLE_PAGE_SIZE,
} from "./wineQuery";

export type WineTotals = {
  collection: number;
  drank: number;
  bottles: number;
  value: number;
};

export type WineBrowseFacets = {
  countries: string[];
  regions: string[];
};

export type WineBrowseSection = {
  items: Wine[];
  total: number;
  limit: number;
};

export type WineBrowseByColorResponse = {
  totals: WineTotals;
  facets: WineBrowseFacets;
  filters: { countryKeys: string[]; regionKey: string };
  sections: Record<WineColor, WineBrowseSection>;
};

export type WineBrowseFlatResponse = {
  totals: WineTotals;
  facets: WineBrowseFacets;
  filters?: { countryKeys: string[]; regionKey: string };
  items: Wine[];
  total: number;
  limit: number;
  offset: number;
};

function normalizeWine(raw: Wine): Wine {
  return { ...raw, quantity: raw.quantity > 0 ? raw.quantity : 1 };
}

async function parseErrorMessage(res: Response) {
  try {
    const j = (await res.json()) as { error?: string };
    return j.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

export type UseWineBrowseByColorParams = WineBrowseFilters & {
  limits: Partial<Record<WineColor, number>>;
};

function detectLoadMoreColor(
  prev: Partial<Record<WineColor, number>>,
  next: Partial<Record<WineColor, number>>,
): WineColor | null {
  for (const c of WINE_COLOR_ORDER) {
    const oldL = prev[c] ?? WINE_TABLE_PAGE_SIZE;
    const newL = next[c] ?? WINE_TABLE_PAGE_SIZE;
    if (newL > oldL) return c;
  }
  return null;
}

export function useWineBrowseByColor(params: UseWineBrowseByColorParams) {
  const [data, setData] = useState<WineBrowseByColorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingMoreColor, setLoadingMoreColor] = useState<WineColor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const hasDataRef = useRef(false);
  const prevBaseKeyRef = useRef<string | null>(null);
  const prevLimitsRef = useRef<Partial<Record<WineColor, number>>>({});

  const baseKey = useMemo(() => {
    const sp = new URLSearchParams();
    appendBrowseParams(sp, params);
    return sp.toString();
  }, [params]);

  const queryKey = useMemo(() => {
    const sp = new URLSearchParams(baseKey);
    for (const c of WINE_COLOR_ORDER) {
      const limit = params.limits[c];
      if (limit != null) sp.set(`${c}Limit`, String(limit));
    }
    return sp.toString();
  }, [baseKey, params.limits]);

  const refetch = useCallback(async () => {
    const id = ++requestId.current;
    const prevBase = prevBaseKeyRef.current;
    const prevLimits = prevLimitsRef.current;
    const baseChanged = prevBase != null && prevBase !== baseKey;
    const moreColor =
      !baseChanged && hasDataRef.current
        ? detectLoadMoreColor(prevLimits, params.limits)
        : null;

    if (moreColor) {
      setLoadingMoreColor(moreColor);
    } else if (hasDataRef.current) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch(`/api/wines/browse?${queryKey}`, { cache: "no-store" });
      if (!res.ok) throw new Error(await parseErrorMessage(res));
      const json = (await res.json()) as WineBrowseByColorResponse;
      if (id !== requestId.current) return;
      setData({
        ...json,
        sections: Object.fromEntries(
          WINE_COLOR_ORDER.map((c) => [
            c,
            {
              ...json.sections[c],
              items: json.sections[c].items.map(normalizeWine),
            },
          ]),
        ) as Record<WineColor, WineBrowseSection>,
      });
      hasDataRef.current = true;
      prevBaseKeyRef.current = baseKey;
      prevLimitsRef.current = { ...params.limits };
      setError(null);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setIsRefreshing(false);
        setLoadingMoreColor(null);
      }
    }
  }, [baseKey, queryKey, params.limits]);

  useEffect(() => {
    queueMicrotask(() => void refetch());
  }, [refetch]);

  return { data, loading, isRefreshing, loadingMoreColor, error, refetch };
}

export type UseWineBrowseFlatParams = WineBrowseFilters & {
  limit: number;
  offset: number;
};

export function useWineBrowseFlat(params: UseWineBrowseFlatParams) {
  const [data, setData] = useState<WineBrowseFlatResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const queryKey = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("flat", "1");
    appendBrowseParams(sp, params);
    sp.set("limit", String(params.limit));
    sp.set("offset", String(params.offset));
    return sp.toString();
  }, [params]);

  const refetch = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const res = await fetch(`/api/wines/browse?${queryKey}`, { cache: "no-store" });
      if (!res.ok) throw new Error(await parseErrorMessage(res));
      const json = (await res.json()) as WineBrowseFlatResponse;
      if (id !== requestId.current) return;
      setData({
        ...json,
        items: json.items.map(normalizeWine),
      });
      setError(null);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [queryKey]);

  useEffect(() => {
    queueMicrotask(() => void refetch());
  }, [refetch]);

  return { data, loading, error, refetch };
}
