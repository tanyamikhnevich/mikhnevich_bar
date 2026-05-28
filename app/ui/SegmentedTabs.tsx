"use client";

type Option<T extends string> = {
  value: T;
  label: string;
};

export function SegmentedTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
}) {
  return (
    <div className="grid w-full grid-cols-2 gap-1 rounded-xl border border-zinc-200 bg-white p-1 sm:inline-flex sm:w-auto sm:grid-cols-none">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              "min-h-11 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors sm:min-h-0 sm:rounded-md sm:py-2",
              active
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-700 active:bg-zinc-100 sm:hover:bg-zinc-100",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

