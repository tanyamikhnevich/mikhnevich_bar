import type { ReactNode } from "react";

type Props = {
  emoji: string;
  title: string;
  subtitle: ReactNode;
  actions?: ReactNode;
};

export function AppHeader({ emoji, title, subtitle, actions }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/90 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto w-full max-w-[82rem] px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span aria-hidden className="text-xl leading-none sm:text-lg">
                {emoji}
              </span>
              <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">
                {title}
              </h1>
            </div>
            <div className="mt-1 text-sm leading-snug text-zinc-600">{subtitle}</div>
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
