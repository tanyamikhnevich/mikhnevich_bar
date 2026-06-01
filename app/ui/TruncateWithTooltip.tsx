"use client";

import { useCallback, useRef } from "react";
import {
  isTextTruncated,
  useWineTableTooltip,
  type TipState,
} from "./WineTableTooltipContext";

type TruncateProps = {
  text: string | null | undefined;
  className?: string;
  tooltip?: string;
  tooltipAlign?: "center" | "left";
};

function positionTip(
  el: HTMLElement,
  text: string,
  tooltipAlign: "center" | "left",
): TipState {
  const rect = el.getBoundingClientRect();
  const maxW = Math.min(320, window.innerWidth - 16);
  let left =
    tooltipAlign === "left"
      ? rect.left
      : rect.left + rect.width / 2 - maxW / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - maxW - 8));
  return { text, left, top: rect.bottom + 4 };
}

export function TruncateWithTooltip({
  text,
  className = "",
  tooltip,
  tooltipAlign = "center",
}: TruncateProps) {
  const value = (text && String(text).trim()) || "—";
  const tipText = (tooltip && tooltip.trim()) || (value !== "—" ? value : "");
  const textRef = useRef<HTMLDivElement>(null);
  const ctx = useWineTableTooltip();

  const hideTip = useCallback(() => {
    ctx?.clearTip();
  }, [ctx]);

  const showTip = useCallback(() => {
    const el = textRef.current;
    if (!ctx || !el || !tipText || !isTextTruncated(el)) {
      hideTip();
      return;
    }
    ctx.showTip(positionTip(el, tipText, tooltipAlign));
  }, [ctx, tipText, tooltipAlign, hideTip]);

  return (
    <div
      className={`w-full min-w-0 max-w-full overflow-hidden ${className}`}
      onMouseEnter={showTip}
      onMouseLeave={hideTip}
    >
      <div ref={textRef} className="truncate select-text">
        {value}
      </div>
    </div>
  );
}

export function CountryTruncate({
  countryLine,
  flag,
  align = "center",
}: {
  countryLine: string;
  flag: string | null;
  align?: "center" | "start";
}) {
  const textRef = useRef<HTMLSpanElement>(null);
  const ctx = useWineTableTooltip();
  const justify = align === "start" ? "justify-start" : "justify-center";

  const hideTip = useCallback(() => {
    ctx?.clearTip();
  }, [ctx]);

  const showTip = useCallback(() => {
    const el = textRef.current;
    if (!ctx || !el || countryLine === "—" || !isTextTruncated(el)) {
      hideTip();
      return;
    }
    ctx.showTip(positionTip(el, countryLine, "left"));
  }, [ctx, countryLine, hideTip]);

  return (
    <div
      className={`flex w-full min-w-0 items-center gap-0.5 overflow-hidden ${justify}`}
      onMouseEnter={showTip}
      onMouseLeave={hideTip}
    >
      {flag ? (
        <span className="shrink-0 text-sm leading-none" aria-hidden>
          {flag}
        </span>
      ) : null}
      <span ref={textRef} className="min-w-0 flex-1 truncate select-text text-[10px] sm:text-[11px]">
        {countryLine}
      </span>
    </div>
  );
}
