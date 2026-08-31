import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ForgotPasswordForm } from "@/app/login/forgot/forgot-form";
import { LoginFrame } from "@/app/login/login-frame";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reset staff password",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect("/admin");

  return (
    <LoginFrame
      title="Reset your password"
      description="Enter your staff email. If we have an account for it, we will send a reset link."
    >
      <ForgotPasswordForm />
    </LoginFrame>
  );
}
