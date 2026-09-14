"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

type Props = {
  siteKey: string;
  onToken: (token: string) => void;
  theme?: "light" | "dark" | "auto";
};

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      theme?: string;
      appearance?: string;
      size?: string;
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

function getTurnstile(): TurnstileApi | undefined {
  return (window as unknown as { turnstile?: TurnstileApi }).turnstile;
}

export function TurnstileField({ siteKey, onToken, theme = "light" }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  function renderWidget() {
    const api = getTurnstile();
    const host = hostRef.current;
    if (!api || !host || widgetId.current) return;
    widgetId.current = api.render(host, {
      sitekey: siteKey,
      theme,
      appearance: "always",
      size: "flexible",
      callback: (token) => onTokenRef.current(token),
      "expired-callback": () => onTokenRef.current(""),
      "error-callback": () => onTokenRef.current(""),
    });
  }

  useEffect(() => {
    renderWidget();
    return () => {
      const api = getTurnstile();
      if (api && widgetId.current) {
        try {
          api.remove(widgetId.current);
        } catch {
          // Widget already gone.
        }
      }
      widgetId.current = null;
    };
    // siteKey is the only identity of the widget.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderWidget}
      />
      <div ref={hostRef} className="min-h-[65px]" />
    </>
  );
}
