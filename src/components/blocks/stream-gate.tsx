"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle, Lock } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Password prompt for restricted streams. The stream source is only fetched
 * server-side after the cookie is issued, so it never reaches this component.
 */
export function StreamGate({
  slug,
  title,
  description,
  className,
}: {
  slug: string;
  title: string;
  description?: string | null;
  className?: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    try {
      const response = await fetch(
        `/api/streams/${encodeURIComponent(slug)}/unlock`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ password }),
        },
      );

      if (response.ok) {
        setPassword("");
        router.refresh();
        return;
      }

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      setState("error");
      setMessage(data.message ?? "Incorrect password.");
    } catch {
      setState("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <div
      className={cn(
        "flex aspect-video flex-col items-center justify-center rounded-xl border border-navy-700 bg-navy-900 p-6 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-navy-800">
        <Lock className="size-5 text-accent-400" aria-hidden="true" />
      </span>

      <h3 className="mt-4 font-bold text-white">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-navy-300">
        {description ||
          "This stream is password-protected. Enter the access password to watch."}
      </p>

      <form onSubmit={onSubmit} className="mt-5 w-full max-w-xs space-y-2.5">
        <label htmlFor={`stream-pass-${slug}`} className="sr-only">
          Stream password
        </label>
        <input
          id={`stream-pass-${slug}`}
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Access password"
          autoComplete="off"
          className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3.5 py-2.5 text-center text-sm text-white placeholder:text-navy-400 focus:border-accent-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-bold text-navy-950 transition-colors hover:bg-accent-400 disabled:opacity-60"
        >
          {state === "loading" && (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          )}
          View stream
        </button>
        {state === "error" && (
          <p className="text-xs text-red-300" role="alert">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
