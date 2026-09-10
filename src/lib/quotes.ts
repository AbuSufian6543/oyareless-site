import "server-only";

import { prisma } from "@/lib/prisma";

export {
  parseQuoteServiceAreas,
  QUOTE_SERVICE_AREAS,
  QUOTE_STATUS_VALUES,
  QUOTE_STATUSES,
  quoteRespondedAt,
  quoteStatusLabel,
  quoteStatusTone,
  serviceAreaFieldId,
} from "@/lib/quote-options";

/** Next Q-0001 style reference that does not collide with deleted rows. */
export async function allocateQuoteReference(): Promise<string> {
  const total = await prisma.quoteRequest.count();
  for (let n = total + 1; n < total + 200; n += 1) {
    const reference = `Q-${String(n).padStart(4, "0")}`;
    const clash = await prisma.quoteRequest.findUnique({
      where: { reference },
      select: { id: true },
    });
    if (!clash) return reference;
  }
  return `Q-${Date.now().toString(36).toUpperCase()}`;
}
