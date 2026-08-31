import {
  KeyRound,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserPlus,
} from "lucide-react";

import {
  createUserAction,
  deleteUserAction,
  disableTwoFactorAction,
  resetUserPasswordAction,
  updateUserAction,
} from "@/app/admin/users/actions";
import {
  Alert,
  Badge,
  Card,
  CardTitle,
  CheckboxField,
  PageHeader,
  SelectField,
  TextField,
} from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Users & access" };

const ROLE_OPTIONS = [
  { value: "SUPERADMIN", label: "Super Admin — full control, manages users" },
  { value: "ADMIN", label: "Admin — all content plus site configuration" },
  { value: "EDITOR", label: "Editor — creates and publishes content" },
  { value: "VIEWER", label: "Viewer — read-only reports" },
];

const ROLE_TONES = {
  SUPERADMIN: "danger",
  ADMIN: "info",
  EDITOR: "success",
  VIEWER: "neutral",
} as const;

const MESSAGES: Record<string, { tone: "success" | "danger"; text: string }> = {
  created: { tone: "success", text: "The account was created." },
  saved: { tone: "success", text: "The account was updated." },
  reset: {
    tone: "success",
    text: "The password was reset and all their sessions were signed out.",
  },
  deleted: { tone: "success", text: "The account was deleted." },
  tworeset: {
    tone: "success",
    text: "Two-factor authentication was reset. They will be prompted to set it up again.",
  },
  invalid: { tone: "danger", text: "Please check the name, email and role." },
  duplicate: { tone: "danger", text: "An account with that email already exists." },
  weak: {
    tone: "danger",
    text: "Passwords need at least 12 characters with upper and lower case, a number and a symbol.",
  },
  lastadmin: {
    tone: "danger",
    text: "This is the last active super admin — promote someone else first.",
  },
  self: { tone: "danger", text: "You cannot delete your own account." },
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  const [actor, users] = await Promise.all([
    requireAdminRole("SUPERADMIN"),
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        twoFactorEnabled: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
      },
    }),
  ]);

  const messageKey =
    params.error ??
    ["created", "saved", "reset", "deleted", "tworeset"].find(
      (key) => params[key],
    );
  const message = messageKey ? MESSAGES[messageKey] : null;

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Users & access"
        description="Staff accounts, roles and two-factor authentication. Only super admins can see this page."
      />

      {message && (
        <div className="mb-5">
          <Alert tone={message.tone}>{message.text}</Alert>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user.id}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-navy-900">
                    {user.name}
                    {user.id === actor.id && (
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-600">{user.email}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {user.lastLoginAt
                      ? `Last signed in ${formatDateTime(user.lastLoginAt)}`
                      : "Has never signed in"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone={ROLE_TONES[user.role]}>
                    {user.role.toLowerCase()}
                  </Badge>
                  {!user.isActive && <Badge tone="neutral">Disabled</Badge>}
                  {user.twoFactorEnabled ? (
                    <Badge tone="success">
                      <ShieldCheck className="size-3" aria-hidden="true" />
                      2FA on
                    </Badge>
                  ) : (
                    <Badge tone="warning">
                      <ShieldOff className="size-3" aria-hidden="true" />
                      No 2FA
                    </Badge>
                  )}
                </div>
              </div>

              <details>
                <summary className="cursor-pointer text-sm font-semibold text-brand-600 hover:text-brand-700">
                  Manage this account
                </summary>

                <div className="mt-4 space-y-5 border-l-2 border-slate-100 pl-4">
                  <form action={updateUserAction} className="space-y-3">
                    <input type="hidden" name="id" value={user.id} />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <TextField
                        label="Name"
                        name="name"
                        defaultValue={user.name}
                      />
                      <TextField
                        label="Phone"
                        name="phone"
                        defaultValue={user.phone ?? ""}
                      />
                      <SelectField
                        label="Role"
                        name="role"
                        defaultValue={user.role}
                        options={ROLE_OPTIONS}
                        className="sm:col-span-2"
                      />
                    </div>

                    <CheckboxField
                      label="Account is active"
                      name="isActive"
                      defaultChecked={user.isActive}
                      description="Disabling immediately signs the account out everywhere."
                    />
                    <CheckboxField
                      label="Require a password change at next sign-in"
                      name="mustChangePassword"
                      defaultChecked={user.mustChangePassword}
                    />

                    <button
                      type="submit"
                      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                    >
                      Save changes
                    </button>
                  </form>

                  <form
                    action={resetUserPasswordAction}
                    className="space-y-3 border-t border-slate-100 pt-4"
                  >
                    <input type="hidden" name="id" value={user.id} />
                    <TextField
                      label="Set a new password"
                      name="password"
                      type="text"
                      autoComplete="off"
                      hint="At least 12 characters, mixed case, a number and a symbol."
                    />
                    <CheckboxField
                      label="Require them to change it at next sign-in"
                      name="mustChangePassword"
                      defaultChecked
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-navy-800 transition-colors hover:bg-slate-50"
                    >
                      <KeyRound className="size-4" aria-hidden="true" />
                      Reset password
                    </button>
                  </form>

                  {user.twoFactorEnabled && (
                    <form
                      action={disableTwoFactorAction}
                      className="border-t border-slate-100 pt-4"
                    >
                      <input type="hidden" name="id" value={user.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100"
                      >
                        <ShieldOff className="size-4" aria-hidden="true" />
                        Reset two-factor authentication
                      </button>
                      <p className="mt-1.5 text-xs text-slate-500">
                        Use this when someone loses their authenticator device.
                      </p>
                    </form>
                  )}

                  {user.id !== actor.id && (
                    <form
                      action={deleteUserAction}
                      className="border-t border-slate-100 pt-4"
                    >
                      <input type="hidden" name="id" value={user.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        Delete this account
                      </button>
                    </form>
                  )}
                </div>
              </details>
            </Card>
          ))}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardTitle description="Super admins can create other super admins.">
              Add a staff account
            </CardTitle>

            <form action={createUserAction} className="space-y-4">
              <TextField label="Full name" name="name" required />
              <TextField label="Email" name="email" type="email" required />
              <TextField label="Phone" name="phone" />
              <SelectField
                label="Role"
                name="role"
                defaultValue="EDITOR"
                options={ROLE_OPTIONS}
              />
              <TextField
                label="Temporary password"
                name="password"
                type="text"
                required
                autoComplete="off"
                hint="12+ characters, mixed case, a number and a symbol."
              />
              <CheckboxField
                label="Require a password change at first sign-in"
                name="mustChangePassword"
                defaultChecked
              />
              <CheckboxField
                label="Email them the sign-in details"
                name="sendInvite"
                defaultChecked
                description="Requires Email (SMTP) under Site Settings."
              />

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                <UserPlus className="size-4" aria-hidden="true" />
                Create account
              </button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
