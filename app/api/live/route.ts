import { NextResponse } from "next/server";
import { getLiveWindow } from "@/lib/analytics";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const hoursParam = Number(searchParams.get("hours"));
    const hours = Number.isFinite(hoursParam) && hoursParam > 0 ? hoursParam : 6;

    const data = await getLiveWindow(hours);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
