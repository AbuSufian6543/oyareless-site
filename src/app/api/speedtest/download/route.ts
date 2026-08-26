export const dynamic = "force-dynamic";

const CHUNK_SIZE = 64 * 1024;
const MAX_MB = 25;

/**
 * Streams incompressible random bytes so gzip on the reverse proxy cannot
 * inflate the apparent throughput.
 */
export async function GET(request: Request) {
  const requested = Number.parseInt(
    new URL(request.url).searchParams.get("mb") ?? "8",
    10,
  );
  const megabytes = Math.min(
    Math.max(Number.isFinite(requested) ? requested : 8, 1),
    MAX_MB,
  );
  const totalBytes = megabytes * 1024 * 1024;

  // One random chunk is generated and reused; regenerating per chunk would
  // make the server CPU the bottleneck instead of the network.
  const chunk = new Uint8Array(CHUNK_SIZE);
  crypto.getRandomValues(chunk);

  let sent = 0;
  const stream = new ReadableStream({
    pull(controller) {
      if (sent >= totalBytes) {
        controller.close();
        return;
      }
      const size = Math.min(CHUNK_SIZE, totalBytes - sent);
      controller.enqueue(size === CHUNK_SIZE ? chunk : chunk.subarray(0, size));
      sent += size;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(totalBytes),
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Encoding": "identity",
      "Timing-Allow-Origin": "*",
    },
  });
}
