import { createPostAction } from "@/app/admin/posts/actions";
import {
  Alert,
  Card,
  CardTitle,
  PageHeader,
  TextAreaField,
  TextField,
} from "@/components/admin/ui";

export const metadata = { title: "New article" };

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="New article"
        description="Start with a headline — you can build out the body next."
        breadcrumb={{ href: "/admin/posts", label: "News & blog" }}
      />

      {params.error && (
        <div className="mb-5">
          <Alert tone="danger">Please give the article a headline.</Alert>
        </div>
      )}

      <form action={createPostAction}>
        <Card className="mb-5">
          <CardTitle>Article details</CardTitle>
          <div className="space-y-4">
            <TextField
              label="Headline"
              name="title"
              required
              autoFocus
              placeholder="Five ways to harden your office network"
            />
            <TextField
              label="URL address"
              name="slug"
              hint="Leave blank to generate from the headline."
            />
            <TextAreaField
              label="Summary"
              name="excerpt"
              rows={3}
              hint="One or two sentences for the listing page."
            />
          </div>
        </Card>

        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Create article
        </button>
      </form>
    </div>
  );
}
