"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "wc_cookie_consent";

/**
 * The privacy policy states that cookies and tracking technologies are used,
 * so visitors are given an explicit choice (PIPEDA good practice).
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        const timer = setTimeout(() => setVisible(true), 900);
        return () => clearTimeout(timer);
      }
    } catch {
      // Storage unavailable — do not nag on every page view.
    }
  }, []);

  if (!visible) return null;

  const decide = (choice: "accepted" | "declined") => {
    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Ignore.
    }
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie notice"
      className="animate-fade-up fixed inset-x-3 bottom-3 z-90 mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-4 shadow-lift sm:inset-x-6 sm:bottom-6 sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Cookie
          className="hidden size-8 shrink-0 text-accent-600 sm:block"
          aria-hidden="true"
        />
        <p className="flex-1 text-sm leading-relaxed text-slate-600">
          We use cookies to keep the site secure, remember your preferences, and
          understand how it is used. See our{" "}
          <Link
            href="/privacy-policy"
            className="font-semibold text-brand-600 underline underline-offset-2"
          >
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide("declined")}
            className="rounded-lg border-2 border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => decide("accepted")}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
