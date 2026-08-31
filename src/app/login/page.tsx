import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CircleCheck } from "lucide-react";

import { LoginForm } from "@/app/login/login-form";
import { LoginFrame } from "@/app/login/login-frame";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff Sign In",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/admin");

  const params = await searchParams;

  return (
    <LoginFrame
      title="Staff sign in"
      description="Access the content management system."
    >
      {params.reset && (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-900">
          <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Your password was updated. Sign in with the new one.
        </div>
      )}
      <LoginForm />
    </LoginFrame>
  );
}
