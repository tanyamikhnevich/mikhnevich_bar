import { prisma } from "./prisma";
import type { IlsRates } from "./winePriceIls";
import { FALLBACK_ILS_RATES } from "./winePriceIls";

/**
 * Живые курсы валют к шекелю. Источник — Frankfurter (данные ЕЦБ, бесплатно, без ключа),
 * кэшируются в таблице ExchangeRate и обновляются не чаще раза в REFRESH_MS.
 * Если провайдер недоступен — используем последнее известное значение из БД,
 * а если и его нет — приблизительный фолбэк.
 */

export type IlsRateInfo = {
  date: string; // дата курса от провайдера, YYYY-MM-DD ("" — если только фолбэк)
  ils: IlsRates; // код валюты -> сколько ₪ за 1 единицу
  stale: boolean; // true — не удалось обновить, значения устаревшие/фолбэк
};

const REFRESH_MS = 12 * 60 * 60 * 1000; // не чаще раза в 12 часов
const PROVIDER_URL =
  "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=ILS,USD,GBP";

async function fetchFromProvider(): Promise<{
  date: string;
  ils: IlsRates;
} | null> {
  try {
    const res = await fetch(PROVIDER_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      date?: string;
      rates?: Record<string, number>;
    };
    const eur = json.rates ?? {};
    const ilsPerEur = eur.ILS;
    if (!ilsPerEur || !Number.isFinite(ilsPerEur)) return null;

    // Провайдер отдаёт курсы вида «1 EUR = eur[X] X».
    // Значит 1 X = (ilsPerEur / eur[X]) ₪. Для самого EUR: 1 EUR = ilsPerEur ₪.
    const ils: IlsRates = { ILS: 1, EUR: ilsPerEur };
    for (const code of ["USD", "GBP"]) {
      const perEur = eur[code];
      if (perEur && Number.isFinite(perEur)) ils[code] = ilsPerEur / perEur;
    }
    // Рубля в наборе ЕЦБ нет — берём из фолбэка, чтобы конвертация не падала.
    ils.RUB = FALLBACK_ILS_RATES.RUB;

    return { date: json.date ?? "", ils };
  } catch {
    return null;
  }
}

export async function getIlsRates(): Promise<IlsRateInfo> {
  const latest = await prisma.exchangeRate.findFirst({
    orderBy: { fetchedAt: "desc" },
  });

  const fresh =
    latest != null && Date.now() - latest.fetchedAt.getTime() < REFRESH_MS;
  if (latest && fresh) {
    return { date: latest.date, ils: latest.ils as IlsRates, stale: false };
  }

  const fetched = await fetchFromProvider();
  if (fetched) {
    try {
      await prisma.exchangeRate.create({
        data: { date: fetched.date, ils: fetched.ils },
      });
    } catch {
      // гонки записи не критичны — читаем latest при следующем запросе
    }
    return { date: fetched.date, ils: fetched.ils, stale: false };
  }

  // Обновиться не удалось — отдаём последнее известное или фолбэк.
  if (latest) {
    return { date: latest.date, ils: latest.ils as IlsRates, stale: true };
  }
  return { date: "", ils: FALLBACK_ILS_RATES, stale: true };
}
