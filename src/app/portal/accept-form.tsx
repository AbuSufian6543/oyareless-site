"use client";

import { useActionState } from "react";

import { acceptInviteAction, type PortalLoginState } from "@/app/portal/actions";

export function AcceptForm({ token }: { token: string }) {
  const [state, action] = useActionState(acceptInviteAction, {} as PortalLoginState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <label className="block text-sm font-semibold text-navy-800">
        New password
        <input
          name="password"
          type="password"
          required
          minLength={12}
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"
        />
      </label>
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button type="submit" className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">
        Activate account
      </button>
    </form>
  );
}
