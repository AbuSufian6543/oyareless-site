export const dynamic = "force-dynamic";

/**
 * Used by the Docker healthcheck and by deploy.sh to wait for the app to come
 * up. The body only says this process answered. It does not probe Postgres, so
 * a database blip cannot stall the check or advertise backing-service status.
 */
export async function GET() {
  return Response.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
