type Props = {
  label?: string;
  className?: string;
};

export function LoadingSpinner({ label, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-sm text-zinc-600 ${className}`}
      role="status"
    >
      <span
        className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-zinc-200 border-t-rose-600"
        aria-hidden
      />
      {label ? <span>{label}</span> : null}
    </span>
  );
}

export function TableLoadingPanel({ label = "Загрузка…" }: { label?: string }) {
  return (
    <div className="flex min-h-[10rem] items-center justify-center rounded-xl border border-zinc-200 bg-white py-12">
      <LoadingSpinner label={label} />
    </div>
  );
}
