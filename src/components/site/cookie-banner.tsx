"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";

import { Button } from "@/components/ui/button";

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
      className="animate-fade-up surface-card fixed inset-x-3 bottom-3 z-90 mx-auto max-w-3xl p-4 shadow-lift sm:inset-x-6 sm:bottom-6 sm:p-5"
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => decide("declined")}
          >
            Decline
          </Button>
          <Button type="button" size="sm" onClick={() => decide("accepted")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
