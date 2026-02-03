import { NextResponse } from "next/server";
import { getComparison } from "@/lib/analytics";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const daysParam = Number(searchParams.get("days"));
  const days = Number.isFinite(daysParam) && daysParam > 0 ? daysParam : 3;

  const data = await getComparison(days);
  return NextResponse.json(data);
}
