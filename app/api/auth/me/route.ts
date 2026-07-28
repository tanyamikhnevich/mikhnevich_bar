import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/dal";

/** Текущий пользователь (email) — для отображения в шапке. */
export async function GET() {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  return NextResponse.json({ email: auth.session.email });
}
