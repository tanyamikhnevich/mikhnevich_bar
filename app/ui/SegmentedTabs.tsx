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
    <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-zinc-900 text-white"
                : "text-zinc-700 hover:bg-zinc-100",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

