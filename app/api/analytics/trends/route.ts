import { NextResponse } from "next/server";
import { getTrendSeries } from "@/lib/analytics";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const daysParam = Number(searchParams.get("days"));
  const days = Number.isFinite(daysParam) && daysParam > 0 ? daysParam : 7;

  const data = await getTrendSeries(days);
  return NextResponse.json(data);
}
