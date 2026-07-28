"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatTableAmount } from "@/lib/wines";

export function DrankSelectFooter({
  count,
  sumIls,
  onReset,
  onExit,
}: {
  count: number;
  sumIls: number;
  onReset: () => void;
  onExit: () => void;
}) {
  const { t, fmt } = useI18n();

  return (
    <div className="sticky bottom-0 z-20 mt-4 rounded-xl border border-rose-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-white/80">
      {count === 0 ? (
        <p className="mb-2 text-sm text-zinc-500">{t.drankSelect.hint}</p>
      ) : (
        <p className="mb-2 text-sm text-zinc-800">
          <span className="font-medium">
            {fmt(t.drankSelect.selected, { count })}
          </span>
          {" · "}
          <span className="font-semibold text-rose-800">
            {fmt(t.drankSelect.sum, { value: formatTableAmount(sumIls) })}
          </span>
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onReset}
          disabled={count === 0}
          className="min-h-10 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 active:bg-zinc-50 disabled:opacity-50 sm:min-h-9"
        >
          {t.common.reset}
        </button>
        <button
          type="button"
          onClick={onExit}
          className="min-h-10 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white active:bg-rose-800 sm:min-h-9"
        >
          {t.drankSelect.exit}
        </button>
      </div>
    </div>
  );
}
