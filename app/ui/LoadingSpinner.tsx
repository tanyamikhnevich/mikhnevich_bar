"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";

type Props = {
  label?: string;
  className?: string;
};

export function LoadingSpinner({ label, className = "" }: Props) {
  const { t } = useI18n();
  const text = label ?? t.common.loading;
  return (
    <span
      className={`inline-flex items-center gap-2 text-sm text-zinc-600 ${className}`}
      role="status"
    >
      <span
        className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-zinc-200 border-t-rose-600"
        aria-hidden
      />
      {text ? <span>{text}</span> : null}
    </span>
  );
}

export function TableLoadingPanel({
  label,
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-[calc(100dvh-14rem)] items-center justify-center rounded-xl border border-zinc-200 bg-white py-12 ${className}`}
    >
      <LoadingSpinner label={label} />
    </div>
  );
}
