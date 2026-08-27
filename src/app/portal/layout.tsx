import Link from "next/link";
import { redirect } from "next/navigation";

import { portalLogoutAction } from "@/app/portal/actions";
import { getPortalUser } from "@/lib/portal-auth";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login and invite pages render their own chrome.
  return children;
}

export async function PortalShell({ children }: { children: React.ReactNode }) {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="container-page flex h-14 items-center justify-between gap-4">
          <nav className="flex items-center gap-4 text-sm font-semibold text-navy-800">
            <Link href="/portal">Overview</Link>
            <Link href="/portal/tickets">Tickets</Link>
            <Link href="/portal/documents">Documents</Link>
            <Link href="/portal/quotes">Quotes</Link>
          </nav>
          <form action={portalLogoutAction}>
            <button type="submit" className="text-sm text-slate-600 hover:text-navy-900">
              Sign out {user.name}
            </button>
          </form>
        </div>
      </header>
      <main className="container-page py-8">{children}</main>
    </div>
  );
}
