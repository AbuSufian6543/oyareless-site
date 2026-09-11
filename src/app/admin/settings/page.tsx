import { CircleCheck, Mails, TriangleAlert } from "lucide-react";

import {
  saveSettingsAction,
  testSmtpAction,
} from "@/app/admin/settings/actions";
import { NotifyEmailListField } from "@/components/admin/notify-email-list-field";
import {
  Alert,
  Card,
  CardTitle,
  CheckboxField,
  PageHeader,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-guard";
import { getMailSettings, getResolvedMail } from "@/lib/mail-settings";
import { getSettings } from "@/lib/settings";
import { DISPLAY_TIMEZONES, normalizeTimeZone } from "@/lib/timezone";

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
        description="Company details, outbound email, the inboxes that receive quote requests, and the clock used on audit logs and the rest of the site."
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
                  Email is configured through{" "}
                  <strong>
                    {resolved.host}:{resolved.port}
                  </strong>
                  . Contact and support copies go to{" "}
                  <strong>{resolved.notifyEmails.join(", ")}</strong>
                  . Quote requests go to{" "}
                  <strong>{resolved.quoteNotifyEmails.join(", ")}</strong>
                  {resolved.hasQuoteNotifyList
                    ? "."
                    : " (the office inboxes, until you add quote-specific addresses below)."}
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

        <Card className="overflow-hidden">
          <div className="-mx-5 -mt-5 mb-5 border-b border-brand-100 bg-gradient-to-r from-brand-50 to-white px-5 py-4 lg:-mx-6 lg:-mt-6 lg:px-6">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm ring-1 ring-brand-100">
                <Mails className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-navy-900">Quote request notifications</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  When someone submits a quote on the website, each address
                  below gets a copy. The visitor still receives their own
                  confirmation.
                </p>
              </div>
            </div>
          </div>
          <NotifyEmailListField
            name="quoteNotifyEmails"
            label="Quote notification emails"
            defaultValue={mail.quoteNotifyEmails}
            placeholder="quotes@wirelesscom.ca"
            emptyHint="No quote-specific inboxes yet. Until you add some, new quote requests are sent to the office addresses:"
            fallbackEmails={resolved.notifyEmails}
          />
        </Card>

        <Card>
          <CardTitle description="Used for password resets, quote notifications, and other mail the site sends. The password is stored encrypted and is never shown again.">
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
          </div>
          <div className="mt-4">
            <CheckboxField
              label="Use SSL on connect"
              name="smtpSecure"
              defaultChecked={mail.smtpSecure}
              description="Turn this on for port 465. Leave it off for port 587 (STARTTLS), which most Office 365 and Google Workspace accounts use."
            />
          </div>
          <div className="mt-5 border-t border-slate-100 pt-5">
            <NotifyEmailListField
              name="notifyEmails"
              label="Office email addresses"
              defaultValue={mail.notifyEmails}
              placeholder="service@wirelesscom.ca"
              description="Contact forms, support requests, and other staff mail. Quote requests use the list above when it is filled in."
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
          <CardTitle description="Audit log, tickets, tasks, emails, and the public site all show this clock. Stored times stay in UTC.">
            Date and time
          </CardTitle>
          <SelectField
            label="Display timezone"
            name="displayTimeZone"
            defaultValue={normalizeTimeZone(settings.displayTimeZone)}
            options={[...DISPLAY_TIMEZONES]}
            hint="Toronto (Eastern Time) is the office default."
          />
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
