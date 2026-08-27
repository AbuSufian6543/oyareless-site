import { CircleCheck, Info } from "lucide-react";

import { saveSettingsAction } from "@/app/admin/settings/actions";
import {
  ColorField,
  ImageUrlField,
} from "@/components/admin/branding-fields";
import {
  Alert,
  Card,
  CardTitle,
  PageHeader,
  TextAreaField,
  TextField,
} from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-guard";
import { DEFAULT_SETTINGS, getSettings } from "@/lib/settings";

export const metadata = { title: "Branding & theme" };

export default async function BrandingPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdminRole("ADMIN");

  const params = await searchParams;
  const settings = await getSettings();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Branding & theme"
        description="Logo, favicon, social card, brand colors, and site-wide embed codes. Changes apply immediately — no redeploy needed."
      />

      {params.saved && (
        <div className="mb-5">
          <Alert tone="success">
            <span className="flex items-center gap-2">
              <CircleCheck className="size-4" aria-hidden="true" />
              Branding saved.
            </span>
          </Alert>
        </div>
      )}

      <form action={saveSettingsAction} className="space-y-5">
        <input type="hidden" name="returnTo" value="/admin/branding" />

        <Card>
          <CardTitle description="Upload replacements through Browse, or paste any URL. The inverse logo is the one shown on dark backgrounds such as the footer.">
            Logo & icons
          </CardTitle>
          <div className="space-y-5">
            <ImageUrlField
              label="Primary logo"
              name="logoUrl"
              defaultValue={settings.logoUrl}
              hint="shown in the header"
            />
            <ImageUrlField
              label="Inverse logo"
              name="logoInverseUrl"
              defaultValue={settings.logoInverseUrl}
              hint="for dark sections"
              previewOnDark
            />
            <ImageUrlField
              label="Favicon"
              name="faviconUrl"
              defaultValue={settings.faviconUrl}
              hint="SVG recommended"
            />
            <ImageUrlField
              label="Social share image"
              name="ogImageUrl"
              defaultValue={settings.ogImageUrl}
              hint="1200 × 630 px"
            />
          </div>
        </Card>

        <Card>
          <CardTitle description="These two colors generate the full light-to-dark ranges used across the site.">
            Brand colors
          </CardTitle>
          <div className="grid gap-5 sm:grid-cols-2">
            <ColorField
              label="Primary (links, buttons)"
              name="themePrimary"
              defaultValue={settings.themePrimary}
              fallback={DEFAULT_SETTINGS.themePrimary}
            />
            <ColorField
              label="Accent (highlights)"
              name="themeAccent"
              defaultValue={settings.themeAccent}
              fallback={DEFAULT_SETTINGS.themeAccent}
            />
          </div>
          <div className="mt-4">
            <Alert tone="info">
              <span className="flex items-start gap-2">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  Pick colors with enough contrast against white and against
                  navy. Very light accents can fail accessibility checks on
                  white backgrounds.
                </span>
              </span>
            </Alert>
          </div>
        </Card>

        <Card>
          <CardTitle description="Background used behind the home page hero.">
            Home page hero
          </CardTitle>
          <div className="space-y-5">
            <ImageUrlField
              label="Hero background image"
              name="homeHeroImageUrl"
              defaultValue={settings.homeHeroImageUrl}
              previewOnDark
            />
            <TextField
              label="Overlay strength"
              name="homeHeroOverlay"
              defaultValue={settings.homeHeroOverlay}
              hint="0 = image only, 1 = solid navy"
              inputMode="decimal"
            />
          </div>
        </Card>

        <Card>
          <CardTitle description="Runs on every public page. Never runs inside the admin.">
            Embedded code
          </CardTitle>
          <div className="space-y-4">
            <TextAreaField
              label="Head scripts"
              name="headEmbedCode"
              rows={5}
              defaultValue={settings.headEmbedCode}
              className="font-mono"
              hint="script tags only"
            />
            <TextAreaField
              label="End-of-body scripts"
              name="bodyEndEmbedCode"
              rows={5}
              defaultValue={settings.bodyEndEmbedCode}
              className="font-mono"
              hint="chat widgets, pixels"
            />
            <Alert tone="warning">
              To embed a dashboard, camera feed or map <em>inside a page</em>,
              use the Embed block in the page editor instead. These two boxes
              are for scripts that must load on every page.
            </Alert>
          </div>
        </Card>

        <Card>
          <CardTitle description="Ownership tokens from Google Search Console and Bing Webmaster Tools.">
            Search engine verification
          </CardTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Google verification"
              name="verificationGoogle"
              defaultValue={settings.verificationGoogle}
              placeholder="abc123..."
            />
            <TextField
              label="Bing verification"
              name="verificationBing"
              defaultValue={settings.verificationBing}
              placeholder="ABC123..."
            />
          </div>
        </Card>

        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Save branding
        </button>
      </form>
    </div>
  );
}
