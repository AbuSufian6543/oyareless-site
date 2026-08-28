"use client";

import { useState } from "react";
import { Check, LoaderCircle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { message?: string };

      if (response.ok) {
        setState("done");
        setMessage(data.message ?? "Please check your inbox to confirm.");
        setEmail("");
      } else {
        setState("error");
        setMessage(data.message ?? "Something went wrong. Please try again.");
      }
    } catch {
      setState("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (state === "done") {
    return (
      <div className="flex items-start gap-2.5 rounded-lg bg-accent-500/15 p-3.5 text-sm text-accent-100">
        <Check className="mt-0.5 size-4 shrink-0 text-accent-400" aria-hidden="true" />
        <p>{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2.5">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <div className="flex gap-2">
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
          className="field-dark min-w-0 flex-1"
        />
        <Button
          type="submit"
          variant="accent"
          size="sm"
          disabled={state === "loading"}
          className="shrink-0"
        >
          {state === "loading" ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
          Join
        </Button>
      </div>
      {state === "error" && (
        <p className="text-xs text-red-300" role="alert">
          {message}
        </p>
      )}
      <p className="text-xs text-navy-400">
        Service updates and technology news. Unsubscribe any time.
      </p>
    </form>
  );
}
