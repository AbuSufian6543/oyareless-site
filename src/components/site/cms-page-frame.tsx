import { PageThemeShell } from "@/components/site/page-theme-shell";
import { applyVisitorPageTheme } from "@/lib/page-theme.server";

export async function CmsPageFrame({
  slug,
  enabled,
  children,
}: {
  slug: string;
  enabled: boolean;
  children: React.ReactNode;
}) {
  const light = await applyVisitorPageTheme({ slug, enabled });
  return (
    <PageThemeShell slug={slug} enabled={enabled} light={light}>
      {children}
    </PageThemeShell>
  );
}
