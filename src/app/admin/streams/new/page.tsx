import { createStreamAction } from "@/app/admin/streams/actions";
import { StreamForm } from "@/components/admin/stream-form";
import { Alert, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Add stream" };

export default async function NewStreamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Add a live stream"
        description="Cameras, live events and any embeddable player."
        breadcrumb={{ href: "/admin/streams", label: "Live streams" }}
      />

      {params.error && (
        <div className="mb-5">
          <Alert tone="danger">
            Please check the highlighted fields — a title and source are
            required.
          </Alert>
        </div>
      )}

      <StreamForm
        action={createStreamAction}
        submitLabel="Create stream"
        values={{
          title: "",
          slug: "",
          description: "",
          type: "HLS",
          source: "",
          posterUrl: "",
          location: "",
          status: "DRAFT",
          aspectRatio: "16/9",
          order: 0,
          isLive: true,
          featured: false,
          isPublic: true,
          autoplay: true,
          muted: true,
          showControls: true,
          hasPassword: false,
        }}
      />
    </div>
  );
}
