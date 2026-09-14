import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PortalLoginForm } from "@/app/portal/login-form";
import { HumanCheckMisconfiguredNotice } from "@/components/security/human-check-notice";
import { getPortalUser } from "@/lib/portal-auth";
import { getSettings } from "@/lib/settings";
import {
  clientTurnstileSiteKey,
  getResolvedTurnstile,
} from "@/lib/turnstile";

export const metadata: Metadata = {
  title: "Customer portal sign in",
  robots: { index: false, follow: false },
};

export default async function PortalLoginPage() {
  if (await getPortalUser()) redirect("/portal");
  const [settings, turnstile] = await Promise.all([
    getSettings(),
    getResolvedTurnstile(),
  ]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8">
        <Link href="/" className="mb-6 inline-flex">
          <Image src={settings.logoUrl || "/brand/logo.png"} alt={settings.companyName} width={220} height={42} className="h-9 w-auto" />
        </Link>
        <h1 className="text-xl font-bold text-navy-900">Customer portal</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Accounts are created by WirelessCom. Ask your account manager for an invite.
        </p>
        <div className="mt-6">
          {turnstile.isMisconfigured && <HumanCheckMisconfiguredNotice />}
          <PortalLoginForm
            turnstileSiteKey={clientTurnstileSiteKey(turnstile)}
          />
        </div>
      </div>
    </div>
  );
}
