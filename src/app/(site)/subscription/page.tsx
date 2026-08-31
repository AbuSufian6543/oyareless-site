import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert, CircleCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Subscription",
  robots: { index: false, follow: false },
};

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const confirmed = status === "confirmed";

  return (
    <section className="py-20 lg:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-card lg:p-10">
          {confirmed ? (
            <CircleCheck
              className="mx-auto size-12 text-accent-600"
              aria-hidden="true"
            />
          ) : (
            <CircleAlert
              className="mx-auto size-12 text-amber-500"
              aria-hidden="true"
            />
          )}

          <h1 className="mt-5 text-2xl font-bold text-navy-900">
            {confirmed ? "Subscription Confirmed" : "Link Not Valid"}
          </h1>

          <p className="mt-3 leading-relaxed text-slate-600">
            {confirmed
              ? "Thank you for confirming. You will now receive service updates and technology news from WirelessCom.Ca Inc."
              : "That confirmation link is invalid or has already been used. You can sign up again from the footer of any page."}
          </p>

          <Link
            href="/"
            className="mt-7 inline-flex rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}
