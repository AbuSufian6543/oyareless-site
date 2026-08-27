import { redirect } from "next/navigation";
import QRCode from "qrcode";
import {
  Copy,
  KeyRound,
  ShieldCheck,
  ShieldOff,
  Smartphone,
} from "lucide-react";

import {
  beginTwoFactorSetupAction,
  changePasswordAction,
  confirmTwoFactorAction,
  disableOwnTwoFactorAction,
  updateProfileAction,
} from "@/app/admin/account/actions";
import {
  Alert,
  Badge,
  Card,
  CardTitle,
  PageHeader,
  TextField,
} from "@/components/admin/ui";
import { getCurrentUser, totpUri } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "My account" };

const MESSAGES: Record<string, { tone: "success" | "danger"; text: string }> = {
  saved: { tone: "success", text: "Your profile was updated." },
  twooff: {
    tone: "success",
    text: "Two-factor authentication has been turned off.",
  },
  wrongpassword: { tone: "danger", text: "That password is not correct." },
  mismatch: { tone: "danger", text: "The two new passwords do not match." },
  weak: {
    tone: "danger",
    text: "Use at least 12 characters with upper and lower case, a number and a symbol.",
  },
  badcode: {
    tone: "danger",
    text: "That code was not accepted. Check your device clock and try the next code.",
  },
  nosetup: {
    tone: "danger",
    text: "Start the setup again to get a fresh QR code.",
  },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
    twooff?: string;
    error?: string;
    setup?: string;
    codes?: string;
  }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, phone: true, twoFactorEnabled: true },
  });
  if (!record) redirect("/login");

  const messageKey =
    params.error ?? (params.saved ? "saved" : params.twooff ? "twooff" : null);
  const message = messageKey ? MESSAGES[messageKey] : null;

  const recoveryCodes = params.codes ? params.codes.split(",") : null;
  const setupSecret = params.setup ?? null;
  const qrDataUrl = setupSecret
    ? await QRCode.toDataURL(totpUri(setupSecret, record.email), {
        width: 220,
        margin: 1,
      })
    : null;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="My account"
        description="Your profile, password and two-factor authentication."
      />

      {message && (
        <div className="mb-5">
          <Alert tone={message.tone}>{message.text}</Alert>
        </div>
      )}

      {recoveryCodes && (
        <Card className="mb-5 border-accent-300 bg-accent-50/50">
          <CardTitle description="Store these somewhere safe. Each code works once if you lose your authenticator app. They will not be shown again.">
            Two-factor is on — save your recovery codes
          </CardTitle>
          <ul className="grid gap-2 font-mono text-sm sm:grid-cols-2">
            {recoveryCodes.map((code) => (
              <li
                key={code}
                className="rounded border border-accent-200 bg-white px-3 py-2 tracking-widest text-navy-900"
              >
                {code}
              </li>
            ))}
          </ul>
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-600">
            <Copy className="size-3.5" aria-hidden="true" />
            Print this page or copy the codes into your password manager.
          </p>
        </Card>
      )}

      <div className="space-y-5">
        <Card>
          <CardTitle>Profile</CardTitle>
          <form action={updateProfileAction} className="space-y-4">
            <TextField label="Name" name="name" defaultValue={record.name} />
            <TextField
              label="Email"
              name="email"
              defaultValue={record.email}
              disabled
              hint="A super admin can change your sign-in address."
            />
            <TextField
              label="Phone"
              name="phone"
              defaultValue={record.phone ?? ""}
            />
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Save profile
            </button>
          </form>
        </Card>

        <Card>
          <CardTitle description="Changing your password signs you out of every device, including this one.">
            Password
          </CardTitle>
          <form action={changePasswordAction} className="space-y-4">
            <TextField
              label="Current password"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
            />
            <TextField
              label="New password"
              name="newPassword"
              type="password"
              required
              autoComplete="new-password"
              hint="12+ characters, mixed case, a number and a symbol."
            />
            <TextField
              label="Confirm new password"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <KeyRound className="size-4" aria-hidden="true" />
              Change password
            </button>
          </form>
        </Card>

        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-navy-900">
                Two-factor authentication
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                A six-digit code from your phone in addition to your password.
              </p>
            </div>
            {record.twoFactorEnabled ? (
              <Badge tone="success">
                <ShieldCheck className="size-3" aria-hidden="true" />
                Enabled
              </Badge>
            ) : (
              <Badge tone="warning">
                <ShieldOff className="size-3" aria-hidden="true" />
                Not enabled
              </Badge>
            )}
          </div>

          {qrDataUrl ? (
            <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/70 p-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="QR code for setting up two-factor authentication"
                  className="mx-auto rounded-lg border border-slate-200 bg-white p-2 sm:mx-0"
                  width={220}
                  height={220}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold text-navy-800">
                    <Smartphone className="size-4" aria-hidden="true" />
                    Scan with your authenticator app
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Use Google Authenticator, Microsoft Authenticator, 1Password
                    or Authy. If you cannot scan, enter this key manually:
                  </p>
                  <code className="mt-2 block break-all rounded border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-navy-900">
                    {setupSecret}
                  </code>
                </div>
              </div>

              <form
                action={confirmTwoFactorAction}
                className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-end"
              >
                <div className="flex-1">
                  <TextField
                    label="Enter the six-digit code"
                    name="token"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    maxLength={6}
                    placeholder="000000"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Turn on two-factor
                </button>
              </form>
            </div>
          ) : record.twoFactorEnabled ? (
            <form action={disableOwnTwoFactorAction} className="space-y-4">
              <TextField
                label="Confirm your password to turn it off"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
              >
                <ShieldOff className="size-4" aria-hidden="true" />
                Turn off two-factor
              </button>
            </form>
          ) : (
            <form action={beginTwoFactorSetupAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                <ShieldCheck className="size-4" aria-hidden="true" />
                Set up two-factor authentication
              </button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
