import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireRole("ADMIN").catch(() => null);
  if (!user) {
    return NextResponse.json({ message: "Not authorised." }, { status: 401 });
  }

  const confirmedOnly =
    new URL(request.url).searchParams.get("confirmed") !== "0";

  const subscribers = await prisma.subscriber.findMany({
    where: confirmedOnly ? { status: "CONFIRMED" } : {},
    orderBy: { createdAt: "desc" },
  });

  const csv = toCsv(
    ["Email", "Name", "Status", "Subscribed", "Confirmed"],
    subscribers.map((row) => [
      row.email,
      row.name,
      row.status,
      row.createdAt,
      row.confirmedAt,
    ]),
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(`wirelesscom-subscribers-${stamp}.csv`, csv);
}
