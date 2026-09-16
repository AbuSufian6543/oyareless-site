import Link from "next/link";
import { Building2, UserPlus } from "lucide-react";

import {
  InvitePortalUserForm,
  ResendInviteButton,
} from "@/app/admin/portal-users/invite-form";
import {
  Alert,
  Badge,
  Card,
  CardTitle,
  EmptyState,
  PageHeader,
} from "@/components/admin/ui";
import { requireStaffAccess } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { canAccessPortalUsers } from "@/lib/staff-access";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Portal users" };

export default async function PortalUsersPage() {
  await requireStaffAccess(canAccessPortalUsers);
  const now = new Date();
  const [customers, users] = await Promise.all([
    prisma.customer.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.customerUser.findMany({
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true, isActive: true } } },
      take: 100,
    }),
  ]);

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Portal users"
        description="Invite people at a customer company. They choose a password from the email (or a copied link) and can only reach the customer portal — never /admin."
        actions={
          <Link
            href="/admin/collections/customers"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-navy-800 shadow-sm hover:bg-slate-50"
          >
            <Building2 className="size-4" aria-hidden="true" />
            Customers
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
        <Card className="lg:sticky lg:top-6">
          <CardTitle description="If the company is not in the list yet, create it here while you send the invite.">
            Invite a user
          </CardTitle>
          {customers.length === 0 && (
            <div className="mb-4">
              <Alert tone="warning">
                There are no customers yet. Enter the company name below and we
                will create the customer and send the invite together.
              </Alert>
            </div>
          )}
          <InvitePortalUserForm customers={customers} />
        </Card>

        <div>
          {users.length === 0 ? (
            <EmptyState
              icon={<UserPlus className="size-8" aria-hidden="true" />}
              title="No portal users yet"
              description="Send an invite from the form. The invited person appears in this list as soon as the account is created, even if they have not opened the email."
            />
          ) : (
            <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {users.map((user) => {
                const pending = Boolean(user.inviteTokenHash);
                const expired =
                  pending &&
                  user.inviteExpiresAt !== null &&
                  user.inviteExpiresAt.getTime() <= now.getTime();
                return (
                  <li key={user.id} className="px-4 py-4 sm:px-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-navy-900">{user.name}</p>
                        <p className="truncate text-sm text-slate-600">{user.email}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {user.customer.name}
                          {!user.customer.isActive ? " · customer inactive" : ""}
                          {user.lastLoginAt
                            ? ` · last sign-in ${formatDateTime(user.lastLoginAt)}`
                            : " · has not signed in"}
                        </p>
                        {pending && user.inviteExpiresAt && (
                          <p className="mt-1 text-xs text-slate-500">
                            {expired
                              ? `Invite expired ${formatDateTime(user.inviteExpiresAt)}`
                              : `Invite expires ${formatDateTime(user.inviteExpiresAt)}`}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                        <StatusBadge
                          isActive={user.isActive}
                          pending={pending}
                          expired={expired}
                        />
                        {user.isActive && pending && (
                          <ResendInviteButton userId={user.id} />
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  isActive,
  pending,
  expired,
}: {
  isActive: boolean;
  pending: boolean;
  expired: boolean;
}) {
  if (!isActive) return <Badge tone="danger">Disabled</Badge>;
  if (expired) return <Badge tone="warning">Invite expired</Badge>;
  if (pending) return <Badge tone="info">Invite pending</Badge>;
  return <Badge tone="success">Active</Badge>;
}
