import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";

/**
 * Proxy (в Next.js 16 так теперь называется бывший Middleware).
 * Оптимистичная проверка: пускает на страницы только с валидной сессией.
 * Публичные страницы — /login и /docs (Swagger-документация API).
 * Гостевая карта (/guest) теперь приватная: её видит лишь владелец после входа.
 * API-роуты сюда не попадают (исключены в matcher) — они проверяют доступ сами.
 */

const PUBLIC_PATHS = ["/login", "/docs"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  // Уже вошёл, но открыл /login — отправляем на главную.
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Не вошёл и страница не публичная — на страницу входа.
  if (!session && !isPublic(pathname)) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  // Не запускаем proxy на API, статике Next и файлах с расширением.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
