"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

import { portalLoginAction, type PortalLoginState } from "@/app/portal/actions";

export function PortalLoginForm() {
  const [state, action] = useActionState(portalLoginAction, {} as PortalLoginState);
  return (
    <form action={action} className="space-y-4">
      <label className="block text-sm font-semibold text-navy-800">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"
        />
      </label>
      <label className="block text-sm font-semibold text-navy-800">
        Password
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"
        />
      </label>
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
    >
      {pending && <LoaderCircle className="size-4 animate-spin" />}
      Sign in
    </button>
  );
}
