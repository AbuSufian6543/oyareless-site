import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ForgotPasswordForm } from "@/app/login/forgot/forgot-form";
import { LoginFrame } from "@/app/login/login-frame";
import { HumanCheckMisconfiguredNotice } from "@/components/security/human-check-notice";
import { getCurrentUser } from "@/lib/auth";
import { destinationAfterLogin } from "@/lib/safe-return";
import {
  clientTurnstileSiteKey,
  getResolvedTurnstile,
} from "@/lib/turnstile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reset staff password",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage() {
  const [user, turnstile] = await Promise.all([
    getCurrentUser(),
    getResolvedTurnstile(),
  ]);
  if (user) redirect(destinationAfterLogin(user));

  return (
    <LoginFrame
      title="Reset your password"
      description="Enter your staff email. If we have an account for it, we will send a reset link."
    >
      {turnstile.isMisconfigured && <HumanCheckMisconfiguredNotice />}
      <ForgotPasswordForm
        turnstileSiteKey={clientTurnstileSiteKey(turnstile)}
      />
    </LoginFrame>
  );
}
