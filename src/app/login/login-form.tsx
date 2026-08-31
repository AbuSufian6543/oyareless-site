"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, LoaderCircle, LogIn, ShieldCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { loginAction, verifyTwoFactorAction, type LoginState } from "@/app/login/actions";

const INITIAL: LoginState = { stage: "credentials" };

export function LoginForm() {
  const [credentialState, submitCredentials] = useActionState(
    loginAction,
    INITIAL,
  );
  const [twoFactorState, submitTwoFactor] = useActionState(
    verifyTwoFactorAction,
    INITIAL,
  );

  // The 2FA step is shown once the password step reports it is required, and
  // falls back to the password form if the challenge expires.
  const showTwoFactor =
    credentialState.stage === "twoFactor" &&
    twoFactorState.stage !== "credentials";

  if (showTwoFactor) {
    return (
      <form action={submitTwoFactor} className="space-y-5">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-50">
            <ShieldCheck className="size-6 text-brand-600" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-navy-900">
            Two-factor verification
          </h2>
          <p className="mt-1.5 text-sm text-slate-600">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>

        <div>
          <label htmlFor="token" className="sr-only">
            Authentication code
          </label>
          <input
            id="token"
            name="token"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            required
            autoFocus
            placeholder="000000"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] text-navy-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {twoFactorState.error && <ErrorNotice message={twoFactorState.error} />}

        <SubmitButton label="Verify and sign in" Icon={ShieldCheck} />
      </form>
    );
  }

  return (
    <form action={submitCredentials} className="space-y-5">
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

      <PasswordField />

      <p className="text-right">
        <Link
          href="/login/forgot"
          className="text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          Forgot password?
        </Link>
      </p>

      {credentialState.error && <ErrorNotice message={credentialState.error} />}

      <SubmitButton label="Sign in" Icon={LogIn} />
    </form>
  );
}

function PasswordField() {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label
        htmlFor="password"
        className="mb-1.5 block text-sm font-semibold text-navy-800"
      >
        Password
      </label>
      <div className="relative">
        <input
          id="password"
          name="password"
          type={visible ? "text" : "password"}
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 pr-11 text-[0.9375rem] text-navy-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-400 transition-colors hover:text-slate-600"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

function SubmitButton({
  label,
  Icon,
}: {
  label: string;
  Icon: typeof LogIn;
}) {
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
        <Icon className="size-4" aria-hidden="true" />
      )}
      {pending ? "Please wait…" : label}
    </button>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800"
      role="alert"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {message}
    </div>
  );
}
