import { invitePortalUserAction } from "@/app/admin/tickets/actions";
import { PageHeader } from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Portal users" };

export default async function PortalUsersPage() {
  await requireAdminRole("ADMIN");
  const [customers, users] = await Promise.all([
    prisma.customer.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.customerUser.findMany({
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } } },
      take: 100,
    }),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Portal users"
        description="Accounts are admin-created. The customer receives an invite email and chooses a password. They cannot reach /admin."
      />
      <form action={invitePortalUserAction} className="mb-8 space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-navy-900">Invite a user</h2>
        <input name="name" required placeholder="Name" className="w-full rounded-lg border px-3 py-2 text-sm" />
        <input name="email" type="email" required placeholder="Email" className="w-full rounded-lg border px-3 py-2 text-sm" />
        <select name="customerId" required className="w-full rounded-lg border px-3 py-2 text-sm">
          <option value="">Customer…</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
          Send invite
        </button>
      </form>
      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white text-sm">
        {users.map((user) => (
          <li key={user.id} className="px-4 py-3">
            <span className="font-semibold">{user.name}</span> · {user.email}
            <span className="ml-2 text-slate-500">{user.customer.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
