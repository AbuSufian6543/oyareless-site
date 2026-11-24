import type { SessionUser } from "@/lib/auth";
import { NavCountBridge } from "@/components/admin/nav-counts";
import { loadNavCounts } from "@/lib/workdesk/dashboard-load";

export async function NavCountsLoader({ user }: { user: SessionUser }) {
  const counts = await loadNavCounts(user);
  return <NavCountBridge counts={counts} />;
}
