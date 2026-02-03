import { NextResponse } from "next/server";
import { getLiveWindow } from "@/lib/analytics";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hoursParam = Number(searchParams.get("hours"));
  const hours = Number.isFinite(hoursParam) && hoursParam > 0 ? hoursParam : 6;

  const data = await getLiveWindow(hours);
  return NextResponse.json(data);
}
