import type { Locale } from "../config";
import { en, type Dictionary } from "./en";
import { ru } from "./ru";
import { he } from "./he";

export type { Dictionary } from "./en";

export const DICTIONARIES: Record<Locale, Dictionary> = { en, ru, he };

export function getDictionaryFor(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
