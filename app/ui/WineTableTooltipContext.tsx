"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type TipState = {
  text: string;
  left: number;
  top: number;
};

const TOOLTIP_CLASS =
  "pointer-events-none fixed z-[9999] w-max max-w-[min(20rem,calc(100vw-1.5rem))] whitespace-pre-wrap rounded border border-zinc-300/90 bg-zinc-100 px-2 py-1 text-left text-[10px] font-normal leading-snug text-zinc-800 shadow-lg sm:text-[11px]";

type Ctx = {
  showTip: (tip: TipState) => void;
  clearTip: () => void;
};

const WineTableTooltipContext = createContext<Ctx | null>(null);

function TooltipPortal({ tip }: { tip: TipState | null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !tip) return null;

  return createPortal(
    <div
      role="tooltip"
      className={TOOLTIP_CLASS}
      style={{ left: tip.left, top: tip.top }}
    >
      {tip.text}
    </div>,
    document.body,
  );
}

export function WineTableTooltipProvider({ children }: { children: ReactNode }) {
  const [activeTip, setActiveTip] = useState<TipState | null>(null);

  const showTip = useCallback((tip: TipState) => {
    setActiveTip(tip);
  }, []);

  const clearTip = useCallback(() => {
    setActiveTip(null);
  }, []);

  useEffect(() => {
    if (!activeTip) return;
    const hide = () => clearTip();
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [activeTip, clearTip]);

  const value = useMemo(() => ({ showTip, clearTip }), [showTip, clearTip]);

  return (
    <WineTableTooltipContext.Provider value={value}>
      {children}
      <TooltipPortal tip={activeTip} />
    </WineTableTooltipContext.Provider>
  );
}

export function useWineTableTooltip() {
  return useContext(WineTableTooltipContext);
}

export function isTextTruncated(el: HTMLElement): boolean {
  return el.scrollWidth > el.clientWidth + 1 || el.scrollWidth > el.offsetWidth + 1;
}

/** Скрыть тултип при уходе курсора со строки (не между ячейками одной строки). */
export function handleWineRowMouseLeave(
  e: React.MouseEvent<HTMLTableRowElement>,
  clearTip: () => void,
) {
  const next = e.relatedTarget;
  if (next instanceof Node && e.currentTarget.contains(next)) return;
  clearTip();
}

export function useWineRowMouseLeaveHandler() {
  const ctx = useContext(WineTableTooltipContext);
  return useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>) => {
      if (!ctx) return;
      handleWineRowMouseLeave(e, ctx.clearTip);
    },
    [ctx],
  );
}

export function useWineTableMouseLeaveHandler() {
  const ctx = useContext(WineTableTooltipContext);
  return useCallback(
    (e: React.MouseEvent<HTMLTableElement>) => {
      const next = e.relatedTarget;
      if (next instanceof Node && e.currentTarget.contains(next)) return;
      ctx?.clearTip();
    },
    [ctx],
  );
}
