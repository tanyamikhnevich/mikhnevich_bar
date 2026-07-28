"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatTableAmount } from "@/lib/wines";
import { DRANK_PERIODS, type DrankPeriodKey } from "@/lib/drankPeriod";
import type { DrankStatsResponse } from "@/lib/drankStatsClient";
import type { WineColor } from "@/lib/wines";
import { WINE_COLOR_ORDER } from "@/lib/wines";

function topColorOf(
  byColor: Record<WineColor, number>,
): { color: WineColor; bottles: number } | null {
  let best: { color: WineColor; bottles: number } | null = null;
  for (const color of WINE_COLOR_ORDER) {
    const n = byColor[color];
    if (n > 0 && (!best || n > best.bottles)) best = { color, bottles: n };
  }
  return best;
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-0.5 truncate text-sm font-semibold text-zinc-900">
        {value}
      </div>
    </div>
  );
}

export function DrankSummaryPanel({
  data,
  loading,
  period,
  onPeriod,
}: {
  data: DrankStatsResponse | null;
  loading: boolean;
  period: DrankPeriodKey;
  onPeriod: (p: DrankPeriodKey) => void;
}) {
  const { t, fmt } = useI18n();
  const stats = data?.stats ?? null;
  const topColor = stats ? topColorOf(stats.byColor) : null;

  return (
    <section className="mb-4 rounded-xl border border-rose-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900">
          {t.drankStats.title}
        </h2>
        <div className="inline-flex flex-wrap gap-0.5 rounded-lg border border-zinc-200 bg-white p-0.5">
          {DRANK_PERIODS.map((p) => {
            const active = p === period;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPeriod(p)}
                aria-pressed={active}
                className={[
                  "min-h-8 rounded-md px-2.5 text-xs font-medium transition-colors sm:min-h-7",
                  active
                    ? "bg-rose-700 text-white"
                    : "text-zinc-600 hover:bg-zinc-100",
                ].join(" ")}
              >
                {t.drankStats.period[p]}
              </button>
            );
          })}
        </div>
      </div>

      {stats && stats.bottles === 0 && !loading ? (
        <p className="mt-3 text-sm text-zinc-500">{t.drankStats.empty}</p>
      ) : (
        <>
          <div
            className={`mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 ${
              loading ? "opacity-50" : ""
            }`}
          >
            <span className="text-2xl font-bold text-rose-800 sm:text-3xl">
              {formatTableAmount(stats?.spentIls ?? 0)} ₪
            </span>
            <span className="text-sm text-zinc-500">
              {t.drankStats.spent}
              {stats
                ? ` · ${fmt(t.table.pieces, { count: stats.bottles })}`
                : ""}
            </span>
          </div>

          {stats ? (
            <div
              className={`mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 ${
                loading ? "opacity-50" : ""
              }`}
            >
              <Tile
                label={t.drankStats.medianPerBottle}
                value={
                  stats.medianPerBottleIls != null
                    ? `${formatTableAmount(stats.medianPerBottleIls)} ₪`
                    : "—"
                }
              />
              <Tile
                label={t.drankStats.medianIsrael}
                value={
                  stats.medianIsraelIls != null
                    ? `${formatTableAmount(stats.medianIsraelIls)} ₪`
                    : "—"
                }
              />
              <Tile
                label={t.drankStats.topCountry}
                value={
                  stats.topCountry
                    ? `${stats.topCountry.country} (${stats.topCountry.bottles})`
                    : "—"
                }
              />
              <Tile
                label={t.drankStats.topColor}
                value={
                  topColor
                    ? `${t.colors[topColor.color]} (${topColor.bottles})`
                    : "—"
                }
              />
              <Tile
                label={t.drankStats.priciest}
                value={
                  stats.mostExpensive
                    ? `${stats.mostExpensive.name} · ${formatTableAmount(
                        stats.mostExpensive.ils,
                      )} ₪`
                    : "—"
                }
              />
              <Tile
                label={t.drankStats.bottles}
                value={String(stats.bottles)}
              />
            </div>
          ) : null}

          {stats && stats.noDateBottles > 0 ? (
            <p className="mt-2 text-xs text-zinc-400">
              {fmt(t.drankStats.noDate, { count: stats.noDateBottles })}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
