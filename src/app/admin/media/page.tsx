import { MediaManager } from "@/components/admin/media-manager";
import { PageHeader } from "@/components/admin/ui";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Media library" };

export default async function AdminMediaPage() {
  const user = await getCurrentUser();

  const assets = await prisma.mediaAsset
    .findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
      select: {
        id: true,
        url: true,
        filename: true,
        originalName: true,
        altText: true,
        mimeType: true,
        sizeBytes: true,
        width: true,
        height: true,
        folder: true,
        createdAt: true,
      },
    })
    .catch(() => []);

  return (
    <div>
      <PageHeader
        title="Media library"
        description="Every photograph and logo on the site is listed here, including the ones that shipped with the product. Upload a new file, or open one and use Replace to swap it everywhere it appears."
      />
      <MediaManager
        canDelete={hasRole(user, "ADMIN")}
        initialItems={assets.map((asset) => ({
          ...asset,
          createdAt: asset.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
