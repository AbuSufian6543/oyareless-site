"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

const LOWER = "abcdefghijkmnopqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{}";

function scorePassword(value: string): { score: number; label: string; hints: string[] } {
  const hints: string[] = [];
  let score = 0;
  if (value.length >= 12) score += 2;
  else if (value.length >= 8) score += 1;
  else hints.push("Use at least 12 characters.");
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  else hints.push("Mix upper and lower case.");
  if (/\d/.test(value)) score += 1;
  else hints.push("Add a number.");
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  else hints.push("Add a symbol.");
  if (/(.)\1{2,}/.test(value) || /password|welcome|qwerty|12345/i.test(value)) {
    score = Math.max(0, score - 2);
    hints.push("Avoid repeated characters and common words.");
  }
  const label =
    score >= 5 ? "Strong" : score >= 3 ? "Reasonable" : score >= 1 ? "Weak" : "Very weak";
  return { score: Math.min(score, 5), label, hints };
}

function randomPassword(length: number, symbols: boolean): string {
  const alphabet = LOWER + UPPER + DIGITS + (symbols ? SYMBOLS : "");
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function PasswordTools() {
  const [value, setValue] = useState("");
  const [generated, setGenerated] = useState("");
  const [hash, setHash] = useState("");
  const strength = useMemo(() => scorePassword(value), [value]);

  async function hashValue() {
    const encoded = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    const hex = Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    setHash(hex);
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-500">
        Everything here runs in your browser. The password is never sent to our
        server.
      </p>
      <div>
        <label htmlFor="pw" className="mb-1.5 block text-sm font-semibold text-navy-800">
          Password to check
        </label>
        <input
          id="pw"
          type="text"
          autoComplete="off"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="field font-mono"
        />
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className={
              strength.score >= 5
                ? "h-full bg-emerald-500"
                : strength.score >= 3
                  ? "h-full bg-amber-500"
                  : "h-full bg-red-500"
            }
            style={{ width: `${(strength.score / 5) * 100}%` }}
          />
        </div>
        <p className="mt-1.5 text-sm font-semibold text-navy-800">{strength.label}</p>
        {strength.hints.length > 0 && (
          <ul className="mt-1 list-disc pl-5 text-xs text-slate-600">
            {strength.hints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => setGenerated(randomPassword(20, true))}
        >
          Generate a 20-character password
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void hashValue()}
        >
          SHA-256 hash (stays local)
        </Button>
      </div>
      {generated && (
        <p className="break-all rounded-lg bg-slate-50 p-3 font-mono text-sm">{generated}</p>
      )}
      {hash && (
        <p className="break-all rounded-lg bg-slate-50 p-3 font-mono text-xs">
          SHA-256: {hash}
        </p>
      )}
    </div>
  );
}
