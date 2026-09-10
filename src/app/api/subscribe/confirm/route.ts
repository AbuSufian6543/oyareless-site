import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { publicUrl } from "@/lib/public-url";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(publicUrl("/subscription?status=invalid"));
  }

  const subscriber = await prisma.subscriber
    .findFirst({ where: { confirmToken: token } })
    .catch(() => null);

  if (!subscriber) {
    return NextResponse.redirect(publicUrl("/subscription?status=invalid"));
  }

  await prisma.subscriber
    .update({
      where: { id: subscriber.id },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        confirmToken: null,
      },
    })
    .catch(() => undefined);

  return NextResponse.redirect(publicUrl("/subscription?status=confirmed"));
}
