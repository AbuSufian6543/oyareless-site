import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireRole("EDITOR").catch(() => null);
  if (!user) {
    return NextResponse.json({ message: "Not authorised." }, { status: 401 });
  }

  const submissions = await prisma.formSubmission.findMany({
    orderBy: { createdAt: "desc" },
    include: { assignedTo: { select: { name: true } } },
  });

  const csv = toCsv(
    [
      "Received",
      "Type",
      "Status",
      "Name",
      "Email",
      "Phone",
      "Company",
      "Subject",
      "Message",
      "Source page",
      "Assigned to",
      "Internal notes",
    ],
    submissions.map((row) => [
      row.createdAt,
      row.type,
      row.status,
      row.name,
      row.email,
      row.phone,
      row.company,
      row.subject,
      row.message.replace(/\r?\n/g, " "),
      row.sourcePage,
      row.assignedTo?.name,
      row.internalNotes?.replace(/\r?\n/g, " "),
    ]),
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(`wirelesscom-submissions-${stamp}.csv`, csv);
}
