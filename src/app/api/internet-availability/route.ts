import { NextResponse } from "next/server";
import { z } from "zod";

import { LOCATION_TYPES, PROVINCES, STREET_DIRECTIONS, STREET_TYPES } from "@/lib/internet-availability/catalog";
import { lookupAvailability } from "@/lib/internet-availability/lookup";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const locationSchema = z.object({
  type: z.enum(LOCATION_TYPES),
  value: z.string().trim().min(1).max(40),
});

const addressSchema = z.object({
  mode: z.literal("address"),
  streetNumber: z.string().trim().min(1).max(10),
  streetNumberSuffix: z.string().trim().max(6).optional().default(""),
  streetName: z.string().trim().min(1).max(40),
  streetType: z.union([z.literal(""), z.enum(STREET_TYPES)]).optional().default(""),
  streetDirection: z.union([z.literal(""), z.enum(STREET_DIRECTIONS)]).optional().default(""),
  city: z.string().trim().min(1).max(60),
  province: z.enum(PROVINCES.map((item) => item.value) as ["ON", "QC"]),
  postalCode: z
    .string()
    .trim()
    .max(7)
    .optional()
    .default("")
    .transform((value) => value.replace(/\s+/g, "").toUpperCase())
    .refine((value) => value === "" || /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(value), {
      message: "Postal code must look like K1P5N5.",
    }),
  locations: z.array(locationSchema).max(4).optional().default([]),
  vpmsSysId: z.string().trim().max(40).optional().default(""),
  streetSysId: z.string().trim().max(40).optional().default(""),
  paging: z.record(z.string(), z.unknown()).optional().nullable(),
  website_url: z.string().max(0).optional().or(z.literal("")),
});

const qidSchema = z.object({
  mode: z.literal("qid"),
  qualificationId: z.string().regex(/^\d{9}$/),
  province: z.enum(["ON", "QC"]),
  rateBand: z.string().trim().max(8).optional().default(""),
  website_url: z.string().max(0).optional().or(z.literal("")),
});

const schema = z.discriminatedUnion("mode", [addressSchema, qidSchema]);

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = rateLimit(`availability:${ip}`, 12, 600);
  if (!limit.allowed) {
    return NextResponse.json(
      { message: "Too many availability checks. Please wait a few minutes or call 1-800-705-3189." },
      { status: 429 },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message;
    return NextResponse.json(
      { message: issue && issue !== "Invalid input" ? issue : "Check the required address fields and try again." },
      { status: 400 },
    );
  }

  if (parsed.data.website_url) {
    return NextResponse.json({ message: "Check the required address fields and try again." }, { status: 400 });
  }

  try {
    const view = await lookupAvailability(parsed.data);
    return NextResponse.json(view);
  } catch {
    return NextResponse.json(
      {
        message:
          "The availability check is temporarily unavailable. Call 1-800-705-3189 and we will look up the address.",
      },
      { status: 503 },
    );
  }
}
