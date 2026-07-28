"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { appendBrowseParams, type WineBrowseFilters } from "./wineQuery";
import type { DrankStats } from "./drankStats";
import {
  drankPeriodRange,
  type DrankPeriodKey,
} from "./drankPeriod";

export type DrankStatsResponse = {
  stats: DrankStats;
  exchange: { date: string; stale: boolean };
  period: { from: string | null; to: string | null };
};

async function parseErrorMessage(res: Response) {
  try {
    const j = (await res.json()) as { error?: string };
    return j.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

/**
 * Серверная сводка по выпитому: сумма трат, разбивки и т.д.
 * Считается отдельным запросом по всем винам, а не по видимой странице.
 * `enabled=false` (не на вкладке «Выпито») — запрос не выполняется.
 */
export function useDrankStats(
  filters: WineBrowseFilters,
  period: DrankPeriodKey,
  enabled: boolean,
) {
  const [data, setData] = useState<DrankStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const queryKey = useMemo(() => {
    const sp = new URLSearchParams();
    appendBrowseParams(sp, { ...filters, drank: true });
    const { from, to } = drankPeriodRange(period);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    return sp.toString();
  }, [filters, period]);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    const id = ++requestId.current;
    setLoading(true);
    try {
      const res = await fetch(`/api/wines/drank-stats?${queryKey}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(await parseErrorMessage(res));
      const json = (await res.json()) as DrankStatsResponse;
      if (id !== requestId.current) return;
      setData(json);
      setError(null);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [enabled, queryKey]);

  useEffect(() => {
    if (!enabled) return;
    queueMicrotask(() => void refetch());
  }, [enabled, refetch]);

  return { data, loading, error, refetch };
}
