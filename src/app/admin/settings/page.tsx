import { CircleCheck, TriangleAlert } from "lucide-react";

import { saveSettingsAction } from "@/app/admin/settings/actions";
import {
  Alert,
  Card,
  CardTitle,
  CheckboxField,
  PageHeader,
  TextAreaField,
  TextField,
} from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-guard";
import { env } from "@/lib/env";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Site settings" };

export default async function SettingsPage({
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
        title="Site settings"
        description="Company details used across the header, footer, contact blocks and structured data."
      />

      {params.saved && (
        <div className="mb-5">
          <Alert tone="success">
            <span className="flex items-center gap-2">
              <CircleCheck className="size-4" aria-hidden="true" />
              Settings saved.
            </span>
          </Alert>
        </div>
      )}

      <div className="mb-6">
        <Alert tone={env.smtp.isConfigured ? "success" : "warning"}>
          <span className="flex items-start gap-2">
            {env.smtp.isConfigured ? (
              <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            ) : (
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            )}
            <span>
              {env.smtp.isConfigured ? (
                <>
                  Email is configured. Notifications go to{" "}
                  <strong>{env.smtp.to}</strong> via{" "}
                  <strong>
                    {env.smtp.host}:{env.smtp.port}
                  </strong>
                  .
                </>
              ) : (
                <>
                  SMTP is not configured yet, so form submissions are saved to
                  the inbox but no email is sent. Add <code>SMTP_HOST</code>,{" "}
                  <code>SMTP_USER</code> and <code>SMTP_PASSWORD</code> to the
                  server’s <code>.env</code> file and restart.
                </>
              )}
            </span>
          </span>
        </Alert>
      </div>

      <form action={saveSettingsAction} className="space-y-5">
        <Card>
          <CardTitle>Company</CardTitle>
          <div className="space-y-4">
            <TextField
              label="Company name"
              name="companyName"
              defaultValue={settings.companyName}
            />
            <TextField
              label="Tagline"
              name="tagline"
              defaultValue={settings.tagline}
            />
            <TextAreaField
              label="Description"
              name="description"
              rows={3}
              defaultValue={settings.description}
              hint="Used as the default meta description and in structured data."
            />
            <TextField
              label="Footer note"
              name="footerNote"
              defaultValue={settings.footerNote}
            />
          </div>
        </Card>

        <Card>
          <CardTitle>Contact</CardTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Toll-free phone"
              name="phone"
              defaultValue={settings.phone}
            />
            <TextField
              label="Local phone"
              name="localPhone"
              defaultValue={settings.localPhone}
            />
            <TextField
              label="General email"
              name="email"
              type="email"
              defaultValue={settings.email}
            />
            <TextField
              label="Support email"
              name="supportEmail"
              type="email"
              defaultValue={settings.supportEmail}
            />
            <TextField
              label="Address line 1"
              name="addressLine1"
              defaultValue={settings.addressLine1}
            />
            <TextField
              label="Address line 2"
              name="addressLine2"
              defaultValue={settings.addressLine2}
            />
            <TextField label="City" name="city" defaultValue={settings.city} />
            <TextField
              label="Province"
              name="province"
              defaultValue={settings.province}
            />
            <TextField
              label="Postal code"
              name="postalCode"
              defaultValue={settings.postalCode}
            />
            <TextField
              label="Country"
              name="country"
              defaultValue={settings.country}
            />
          </div>

          <div className="mt-4 space-y-4">
            <TextField
              label="Business hours"
              name="businessHours"
              defaultValue={settings.businessHours}
            />
            <TextField
              label="Emergency note"
              name="emergencyNote"
              defaultValue={settings.emergencyNote}
            />
            <TextField
              label="Map embed URL"
              name="mapEmbedUrl"
              defaultValue={settings.mapEmbedUrl}
              hint="Any embeddable map URL."
            />
          </div>
        </Card>

        <Card>
          <CardTitle description="Shown as a thin bar above the header.">
            Announcement bar
          </CardTitle>
          <div className="space-y-4">
            <CheckboxField
              label="Show the announcement bar"
              name="announcementEnabled"
              defaultChecked={settings.announcementEnabled}
            />
            <TextField
              label="Message"
              name="announcementText"
              defaultValue={settings.announcementText}
              placeholder="Holiday hours: closed December 25 and 26."
            />
            <TextField
              label="Link"
              name="announcementLink"
              defaultValue={settings.announcementLink}
              hint="Optional. Makes the message clickable."
            />
          </div>
        </Card>

        <Card>
          <CardTitle>Social profiles</CardTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="LinkedIn"
              name="socialLinkedIn"
              defaultValue={settings.socialLinkedIn}
            />
            <TextField
              label="Facebook"
              name="socialFacebook"
              defaultValue={settings.socialFacebook}
            />
            <TextField
              label="X / Twitter"
              name="socialX"
              defaultValue={settings.socialX}
            />
            <TextField
              label="YouTube"
              name="socialYouTube"
              defaultValue={settings.socialYouTube}
            />
          </div>
        </Card>

        <Card>
          <CardTitle description="Keep this minimal — anything added here runs on every public page.">
            Privacy & analytics
          </CardTitle>
          <div className="space-y-4">
            <CheckboxField
              label="Show the cookie consent banner"
              name="cookieBannerEnabled"
              defaultChecked={settings.cookieBannerEnabled}
              description="Recommended for PIPEDA compliance when analytics are enabled."
            />
            <CheckboxField
              label="Show the live chat call-to-action"
              name="showLiveChatCta"
              defaultChecked={settings.showLiveChatCta}
            />
            <TextAreaField
              label="Analytics snippet"
              name="analyticsSnippet"
              rows={5}
              defaultValue={settings.analyticsSnippet}
              hint="Paste the script tag from Plausible, Fathom or Google Analytics."
              className="font-mono"
            />
          </div>
        </Card>

        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Save settings
        </button>
      </form>
    </div>
  );
}
