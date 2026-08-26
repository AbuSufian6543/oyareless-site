import { MediaManager } from "@/components/admin/media-manager";
import { PageHeader } from "@/components/admin/ui";
import { getCurrentUser, hasRole } from "@/lib/auth";

export const metadata = { title: "Media library" };

export default async function AdminMediaPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <PageHeader
        title="Media library"
        description="Images and documents available to every page, post and section."
      />
      <MediaManager canDelete={hasRole(user, "ADMIN")} />
    </div>
  );
}
