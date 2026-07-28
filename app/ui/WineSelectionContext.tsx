"use client";

import { createContext, useContext, type ReactNode } from "react";

export type WineSelection = {
  /** Режим выбора включён — строки кликабельны для подсчёта суммы. */
  active: boolean;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
};

const DEFAULT: WineSelection = {
  active: false,
  isSelected: () => false,
  toggle: () => {},
};

const WineSelectionContext = createContext<WineSelection>(DEFAULT);

export function WineSelectionProvider({
  value,
  children,
}: {
  value: WineSelection;
  children: ReactNode;
}) {
  return (
    <WineSelectionContext.Provider value={value}>
      {children}
    </WineSelectionContext.Provider>
  );
}

/** Состояние выбора вин. Вне провайдера — режим выключен (active=false). */
export function useWineSelection(): WineSelection {
  return useContext(WineSelectionContext);
}
