import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Used by the Docker healthcheck and by deploy.sh to wait for the app to come
 * up. Reports database reachability but still answers 200 so a brief database
 * blip does not cause the container to be killed and restarted in a loop.
 */
export async function GET() {
  let database = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "unreachable";
  }

  return Response.json(
    { status: "ok", database, timestamp: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
