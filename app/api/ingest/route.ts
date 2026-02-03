import { NextResponse } from "next/server";
import { ingestMany } from "@/lib/ingest";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("locationId");
  const days = searchParams.get("days");
  const { locations, results, ingested } = await ingestMany(locationId, days ? parseInt(days) : undefined);

  if (!locations.length) {
    return NextResponse.json({ error: "No matching locations" }, { status: 404 });
  }

  return NextResponse.json({ ingested, results });
}
