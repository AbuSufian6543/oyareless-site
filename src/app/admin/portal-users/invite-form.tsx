"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Copy, LoaderCircle, Mail, Send } from "lucide-react";

import {
  invitePortalUserAction,
  resendPortalInviteAction,
  type InvitePortalUserState,
} from "@/app/admin/portal-users/actions";
import { Alert, SelectField, TextField } from "@/components/admin/ui";

const NEW_CUSTOMER_VALUE = "__new__";
const INITIAL: InvitePortalUserState = {};

export type InviteCustomerOption = {
  id: string;
  name: string;
};

export function InvitePortalUserForm({
  customers,
}: {
  customers: InviteCustomerOption[];
}) {
  const [state, action] = useActionState(invitePortalUserAction, INITIAL);
  const [customerId, setCustomerId] = useState(
    customers.length === 0 ? NEW_CUSTOMER_VALUE : "",
  );
  const creatingNew = customerId === NEW_CUSTOMER_VALUE;

  return (
    <form action={action} className="space-y-4">
      <TextField label="Person's name" name="name" required autoComplete="name" />
      <TextField
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="email"
      />

      {customers.length === 0 ? (
        <>
          <input type="hidden" name="customerId" value={NEW_CUSTOMER_VALUE} />
          <TextField
            label="Customer (company)"
            name="newCustomerName"
            required
            hint="This customer is created at the same time as the invite."
            autoComplete="organization"
          />
        </>
      ) : (
        <>
          <SelectField
            label="Customer"
            name="customerId"
            required
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            hint="Portal access belongs to a customer company, not a staff account."
            options={[
              { value: "", label: "Choose a customer…" },
              ...customers.map((customer) => ({
                value: customer.id,
                label: customer.name,
              })),
              { value: NEW_CUSTOMER_VALUE, label: "Create a new customer…" },
            ]}
          />
          {creatingNew && (
            <TextField
              label="New customer name"
              name="newCustomerName"
              required
              autoComplete="organization"
            />
          )}
        </>
      )}

      <InviteResult state={state} />

      <InviteSubmit label="Send invite" pendingLabel="Sending invite…" />
    </form>
  );
}

export function ResendInviteButton({ userId }: { userId: string }) {
  const [state, action] = useActionState(resendPortalInviteAction, INITIAL);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={userId} />
      <InviteSubmit
        label="Resend invite"
        pendingLabel="Sending…"
        compact
      />
      <InviteResult state={state} compact />
    </form>
  );
}

function InviteSubmit({
  label,
  pendingLabel,
  compact = false,
}: {
  label: string;
  pendingLabel: string;
  compact?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        compact
          ? "inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-navy-800 hover:bg-slate-50 disabled:opacity-60"
          : "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
      }
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : compact ? (
        <Mail className="size-3.5" aria-hidden="true" />
      ) : (
        <Send className="size-4" aria-hidden="true" />
      )}
      {pending ? pendingLabel : label}
    </button>
  );
}

function InviteResult({
  state,
  compact = false,
}: {
  state: InvitePortalUserState;
  compact?: boolean;
}) {
  if (state.error) {
    return (
      <Alert tone="danger">
        {state.error}
      </Alert>
    );
  }
  if (!state.ok || !state.message) return null;

  return (
    <div className="space-y-2">
      <Alert tone={state.emailed ? "success" : "warning"}>{state.message}</Alert>
      {state.inviteUrl && (
        <CopyInviteLink url={state.inviteUrl} compact={compact} />
      )}
    </div>
  );
}

function CopyInviteLink({ url, compact }: { url: string; compact: boolean }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        readOnly
        value={url}
        aria-label="Invite link"
        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-navy-900"
      />
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(url).catch(() => undefined);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        }}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-navy-800 hover:bg-slate-50"
      >
        <Copy className="size-3.5" aria-hidden="true" />
        {copied ? "Copied" : compact ? "Copy" : "Copy invite link"}
      </button>
    </div>
  );
}
