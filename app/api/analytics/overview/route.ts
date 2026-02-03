import { NextResponse } from "next/server";
import { getOverviewMetrics } from "@/lib/analytics";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hoursParam = Number(searchParams.get("hours"));
  const hours = Number.isFinite(hoursParam) && hoursParam > 0 ? hoursParam : 24;

  const data = await getOverviewMetrics(hours);
  return NextResponse.json(data);
}
