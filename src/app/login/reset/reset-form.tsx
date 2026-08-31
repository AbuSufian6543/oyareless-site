"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { KeyRound, LoaderCircle, TriangleAlert } from "lucide-react";

import {
  completePasswordResetAction,
  type ResetCompleteState,
} from "@/app/login/reset-actions";

const INITIAL: ResetCompleteState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(completePasswordResetAction, INITIAL);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-semibold text-navy-800"
        >
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          autoFocus
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-[0.9375rem] text-navy-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <p className="mt-1.5 text-xs text-slate-500">
          At least 12 characters, with upper and lower case, a number and a
          symbol.
        </p>
      </div>

      <div>
        <label
          htmlFor="confirm"
          className="mb-1.5 block text-sm font-semibold text-navy-800"
        >
          Confirm password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-[0.9375rem] text-navy-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {state.error && (
        <div
          className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800"
          role="alert"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.error}
        </div>
      )}

      <SubmitButton />

      <p className="text-center text-sm">
        <Link
          href="/login/forgot"
          className="font-semibold text-brand-600 hover:text-brand-700"
        >
          Request a new link
        </Link>
      </p>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md disabled:opacity-60"
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <KeyRound className="size-4" aria-hidden="true" />
      )}
      {pending ? "Please wait…" : "Save new password"}
    </button>
  );
}
