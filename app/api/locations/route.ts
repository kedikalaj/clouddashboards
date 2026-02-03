import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ locations });
}
