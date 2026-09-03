import { CircleCheck, TriangleAlert } from "lucide-react";

import {
  saveSettingsAction,
  testSmtpAction,
} from "@/app/admin/settings/actions";
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
import { getMailSettings, getResolvedMail } from "@/lib/mail-settings";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Site settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; tested?: string; mailerror?: string }>;
}) {
  await requireAdminRole("ADMIN");

  const params = await searchParams;
  const [settings, mail, resolved] = await Promise.all([
    getSettings(),
    getMailSettings(),
    getResolvedMail(),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Site settings"
        description="Company details, outbound email, and the office inboxes that receive quotes and support requests."
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

      {params.tested && (
        <div className="mb-5">
          <Alert tone="success">
            <span className="flex items-center gap-2">
              <CircleCheck className="size-4" aria-hidden="true" />
              Test email sent to your staff address. Check that inbox.
            </span>
          </Alert>
        </div>
      )}

      {params.mailerror && (
        <div className="mb-5">
          <Alert tone="warning">
            <span className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              The SMTP server could not be reached. Check the host, port,
              username and password, then save and try again.
            </span>
          </Alert>
        </div>
      )}

      <div className="mb-6">
        <Alert tone={resolved.isConfigured ? "success" : "warning"}>
          <span className="flex items-start gap-2">
            {resolved.isConfigured ? (
              <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            ) : (
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            )}
            <span>
              {resolved.isConfigured ? (
                <>
                  Email is configured. Quote requests, support forms and
                  password-reset messages go through{" "}
                  <strong>
                    {resolved.host}:{resolved.port}
                  </strong>
                  . Office copies are sent to{" "}
                  <strong>{resolved.notifyEmails.join(", ")}</strong>.
                </>
              ) : (
                <>
                  SMTP is not configured yet, so the site saves form submissions
                  but cannot send mail. Fill in the Email section below — no
                  server restart is required.
                </>
              )}
            </span>
          </span>
        </Alert>
      </div>

      <form action={saveSettingsAction} className="space-y-5">
        <input type="hidden" name="returnTo" value="/admin/settings" />
        {/* Tells the action which checkboxes this form owns, so unchecking is
            distinguishable from "not rendered on this screen". */}
        <input type="hidden" name="present:announcementEnabled" value="1" />
        <input type="hidden" name="present:cookieBannerEnabled" value="1" />
        <input type="hidden" name="present:showLiveChatCta" value="1" />

        <Card>
          <CardTitle description="Used for password resets, quote requests, and other mail the site sends. The password is stored encrypted and is never shown again.">
            Email (SMTP)
          </CardTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="SMTP server"
              name="smtpHost"
              defaultValue={mail.smtpHost}
              placeholder="smtp.office365.com"
              autoComplete="off"
              className="sm:col-span-2"
            />
            <TextField
              label="Port"
              name="smtpPort"
              type="number"
              inputMode="numeric"
              defaultValue={mail.smtpPort}
              placeholder="587"
            />
            <TextField
              label="Username"
              name="smtpUser"
              defaultValue={mail.smtpUser}
              placeholder="service@wirelesscom.ca"
              autoComplete="off"
            />
            <TextField
              label="Password"
              name="smtpPassword"
              type="password"
              autoComplete="new-password"
              placeholder={
                mail.smtpPassword ? "Leave blank to keep the current password" : ""
              }
              hint={
                mail.smtpPassword
                  ? "A password is already saved."
                  : "Required if the server asks for authentication."
              }
              className="sm:col-span-2"
            />
            <TextField
              label="From address"
              name="smtpFrom"
              defaultValue={mail.smtpFrom}
              placeholder="WirelessCom.Ca Inc. <no-reply@wirelesscom.ca>"
              className="sm:col-span-2"
              hint="What visitors see in the From field."
            />
            <TextAreaField
              label="Office email addresses"
              name="notifyEmails"
              rows={3}
              defaultValue={mail.notifyEmails}
              placeholder={"service@wirelesscom.ca\nquotes@wirelesscom.ca"}
              className="sm:col-span-2"
              hint="One address per line. Quote requests and support forms are delivered here."
            />
          </div>
          <div className="mt-4">
            <CheckboxField
              label="Use SSL on connect"
              name="smtpSecure"
              defaultChecked={mail.smtpSecure}
              description="Turn this on for port 465. Leave it off for port 587 (STARTTLS), which most Office 365 and Google Workspace accounts use."
            />
          </div>
        </Card>

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
              label="Show the Tawk.to live chat widget"
              name="showLiveChatCta"
              defaultChecked={settings.showLiveChatCta}
              description="Chat bubble on public pages only. It does not load in admin, login, or the client portal."
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

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Save settings
          </button>
        </div>
      </form>

      {resolved.isConfigured && (
        <form action={testSmtpAction} className="mt-4">
          <button
            type="submit"
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-navy-800 transition-colors hover:border-brand-400 hover:text-brand-700"
          >
            Send a test email to me
          </button>
          <p className="mt-2 text-xs text-slate-500">
            Uses the saved SMTP settings. Save first if you just changed them.
          </p>
        </form>
      )}
    </div>
  );
}
