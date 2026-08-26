import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Minimal response so the measurement reflects round-trip latency only. */
export async function GET() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Timing-Allow-Origin": "*",
    },
  });
}
