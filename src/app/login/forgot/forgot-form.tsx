"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { LoaderCircle, Mail, TriangleAlert } from "lucide-react";

import {
  requestPasswordResetAction,
  type ResetRequestState,
} from "@/app/login/reset-actions";

const INITIAL: ResetRequestState = {};

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordResetAction, INITIAL);

  if (state.sent) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-900">
          If that address has a staff account, we have sent a reset link. Check
          the inbox and junk folder.
        </p>
        <Link
          href="/login"
          className="inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-semibold text-navy-800"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          placeholder="you@wirelesscom.ca"
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
          href="/login"
          className="font-semibold text-brand-600 hover:text-brand-700"
        >
          Back to sign in
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
        <Mail className="size-4" aria-hidden="true" />
      )}
      {pending ? "Please wait…" : "Send reset link"}
    </button>
  );
}
