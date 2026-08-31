import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginFrame } from "@/app/login/login-frame";
import { ResetPasswordForm } from "@/app/login/reset/reset-form";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/admin");

  const { token } = await searchParams;
  if (!token) {
    return (
      <LoginFrame
        title="Link missing"
        description="This password reset address is incomplete. Request a new link."
      >
        <Link
          href="/login/forgot"
          className="inline-flex font-semibold text-brand-600 hover:text-brand-700"
        >
          Request a reset link
        </Link>
      </LoginFrame>
    );
  }

  return (
    <LoginFrame
      title="Choose a new password"
      description="This link can only be used once and expires after one hour."
    >
      <ResetPasswordForm token={token} />
    </LoginFrame>
  );
}
