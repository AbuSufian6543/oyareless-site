import { after } from "next/server";

import { env } from "@/lib/env";
import { refreshStaleProbes } from "@/lib/probes";

export const dynamic = "force-dynamic";

/**
 * Background drain for status checks. Call from crontab with
 * Authorization: Bearer $CRON_SECRET. Does not run as part of page render.
 */
export async function GET(request: Request) {
  const secret = env.cronSecret;
  if (!secret) {
    return new Response("Not found", { status: 404 });
  }
  const header = request.headers.get("authorization") ?? "";
  if (header !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  after(() => {
    void refreshStaleProbes({ limit: 48, concurrency: 6 }).catch(() => undefined);
  });

  return Response.json({ ok: true, queued: true });
}
