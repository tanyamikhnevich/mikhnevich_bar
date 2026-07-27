import { NextResponse } from "next/server";
import {
  fetchCountryFacetOptions,
  fetchRegionFacetOptions,
} from "../../../../lib/wineFacets";
import { requireApiSession } from "../../../../lib/auth/dal";

export async function GET(req: Request) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  const userId = auth.session.userId;
  const url = new URL(req.url);
  const drank = url.searchParams.get("drank") === "true";
  const country = (url.searchParams.get("country") ?? "").trim();

  const [countries, regions] = await Promise.all([
    fetchCountryFacetOptions(userId, drank),
    country
      ? fetchRegionFacetOptions(userId, drank, country)
      : Promise.resolve([]),
  ]);

  return NextResponse.json({ countries, regions });
}
