import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { LoginForm } from "@/app/login/login-form";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff Sign In",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/admin");

  return (
    <div className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-navy-900 px-4 py-12">
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-br from-navy-950 via-navy-900 to-brand-900"
        aria-hidden="true"
      />
      <div className="bg-tech-grid absolute inset-0 -z-10" aria-hidden="true" />

      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex">
            <Image
              src="/brand/logo-inverse.png"
              alt="WirelessCom.Ca Inc."
              width={240}
              height={46}
              className="h-10 w-auto"
              priority
            />
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl lg:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-navy-900">Staff sign in</h1>
            <p className="mt-1.5 text-sm text-slate-600">
              Access the content management system.
            </p>
          </div>

          <LoginForm />

          <p className="mt-6 flex items-start gap-2 border-t border-slate-100 pt-5 text-xs leading-relaxed text-slate-500">
            <ShieldCheck
              className="mt-0.5 size-3.5 shrink-0 text-accent-600"
              aria-hidden="true"
            />
            This is a private system. Sign-in attempts are logged. If you have
            lost access, contact a super administrator.
          </p>
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex w-full items-center justify-center gap-1.5 text-sm font-medium text-navy-300 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to the website
        </Link>
      </div>
    </div>
  );
}
