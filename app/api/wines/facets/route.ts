import { NextResponse } from "next/server";
import {
  fetchCountryFacetOptions,
  fetchRegionFacetOptions,
} from "../../../../lib/wineFacets";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const drank = url.searchParams.get("drank") === "true";
  const country = (url.searchParams.get("country") ?? "").trim();

  const [countries, regions] = await Promise.all([
    fetchCountryFacetOptions(drank),
    country ? fetchRegionFacetOptions(drank, country) : Promise.resolve([]),
  ]);

  return NextResponse.json({ countries, regions });
}
