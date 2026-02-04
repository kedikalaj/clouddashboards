import { NextResponse } from "next/server";
import { ingestMany } from "@/lib/ingest";

export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    const daysRaw = searchParams.get("days");
    const days = daysRaw ? Number.parseInt(daysRaw, 10) : undefined;
    const parsedDays = Number.isFinite(days) && (days ?? 0) > 0 ? days : undefined;

    const { locations, results, ingested } = await ingestMany(locationId, parsedDays);

    if (!locations.length) {
      return NextResponse.json({ error: "No matching locations" }, { status: 404 });
    }

    return NextResponse.json({ ingested, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
