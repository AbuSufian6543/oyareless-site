"use client";

import { useEffect, useRef, useState } from "react";

import { TurnstileField } from "@/components/security/turnstile-field";
import { TURNSTILE_FORM_FIELD } from "@/lib/turnstile-constants";

/**
 * Turnstile widget plus a hidden field so native server-action forms submit
 * the token. Remounts after a failed attempt because tokens are single-use.
 */
export function HumanCheckField({
  siteKey,
  action,
  resetSignal,
}: {
  siteKey: string;
  action: string;
  resetSignal?: unknown;
}) {
  const [token, setToken] = useState("");
  const [widgetKey, setWidgetKey] = useState(0);
  const skipFirst = useRef(true);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    setToken("");
    setWidgetKey((value) => value + 1);
  }, [resetSignal]);

  if (!siteKey) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-navy-800">Human check</p>
      <TurnstileField
        key={widgetKey}
        siteKey={siteKey}
        action={action}
        onToken={setToken}
      />
      <input type="hidden" name={TURNSTILE_FORM_FIELD} value={token} />
    </div>
  );
}
