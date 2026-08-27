import { CircleCheck, Info, ShieldAlert } from "lucide-react";

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
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Remote support" };

export default async function RemoteSupportSettingsPage({
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
        title="Remote support"
        description="Configures the /remote-support page: which RustDesk servers clients connect through, and where they download the client from."
      />

      {params.saved && (
        <div className="mb-5">
          <Alert tone="success">
            <span className="flex items-center gap-2">
              <CircleCheck className="size-4" aria-hidden="true" />
              Remote support settings saved.
            </span>
          </Alert>
        </div>
      )}

      <form action={saveSettingsAction} className="space-y-5">
        <input type="hidden" name="returnTo" value="/admin/remote-support" />
        <input type="hidden" name="present:remoteSupportEnabled" value="1" />

        <Card>
          <CardTitle description="Turning this off hides the Remote Support page and its links across the site.">
            Availability
          </CardTitle>
          <CheckboxField
            label="Offer remote support to visitors"
            name="remoteSupportEnabled"
            defaultChecked={settings.remoteSupportEnabled}
            description="The page explains the process and offers the client downloads. A session only ever starts when the customer reads out their ID and one-time password."
          />
        </Card>

        <Card>
          <CardTitle description="Self-hosted RustDesk servers. Leave blank to let clients use RustDesk's public infrastructure instead.">
            RustDesk servers
          </CardTitle>
          <div className="space-y-4">
            <TextField
              label="ID server"
              name="rustdeskIdServer"
              defaultValue={settings.rustdeskIdServer}
              placeholder="rustdesk.wirelesscom.ca"
              hint="hbbs host, port 21115–21116"
            />
            <TextField
              label="Relay server"
              name="rustdeskRelayServer"
              defaultValue={settings.rustdeskRelayServer}
              placeholder="rustdesk.wirelesscom.ca"
              hint="hbbr host, port 21117"
            />
            <TextField
              label="API server"
              name="rustdeskApiServer"
              defaultValue={settings.rustdeskApiServer}
              placeholder="https://rustdesk.wirelesscom.ca"
              hint="optional"
            />
            <TextAreaField
              label="Server public key"
              name="rustdeskPublicKey"
              rows={3}
              defaultValue={settings.rustdeskPublicKey}
              className="font-mono text-xs"
              hint="the key clients verify the relay with"
            />

            <Alert tone="warning">
              <span className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  Only the <strong>public</strong> key belongs here — it is shown
                  to visitors so their client can verify your relay. The private
                  key stays on the RustDesk server and must never be pasted into
                  this form.
                </span>
              </span>
            </Alert>
          </div>
        </Card>

        <Card>
          <CardTitle description="Where the Download button points for each platform. The page detects the visitor's operating system and offers the right one first.">
            Client downloads
          </CardTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Windows"
              name="rustdeskDownloadWindows"
              defaultValue={settings.rustdeskDownloadWindows}
              placeholder="https://…/rustdesk.exe"
            />
            <TextField
              label="macOS"
              name="rustdeskDownloadMacOS"
              defaultValue={settings.rustdeskDownloadMacOS}
              placeholder="https://…/rustdesk.dmg"
            />
            <TextField
              label="Linux"
              name="rustdeskDownloadLinux"
              defaultValue={settings.rustdeskDownloadLinux}
              placeholder="https://…/rustdesk.deb"
            />
            <TextField
              label="Android"
              name="rustdeskDownloadAndroid"
              defaultValue={settings.rustdeskDownloadAndroid}
              placeholder="https://…/rustdesk.apk"
            />
          </div>
          <div className="mt-4">
            <Alert tone="info">
              <span className="flex items-start gap-2">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  Hosting your own signed copy of the client is preferable to
                  linking a third-party mirror: the visitor stays on a domain
                  they already trust, and you control which version they get.
                </span>
              </span>
            </Alert>
          </div>
        </Card>

        <Card>
          <CardTitle description="Shown to the visitor above the Support ID walkthrough.">
            Instructions
          </CardTitle>
          <TextAreaField
            label="What to tell the customer"
            name="remoteSupportInstructions"
            rows={5}
            defaultValue={settings.remoteSupportInstructions}
          />
        </Card>

        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Save remote support settings
        </button>
      </form>
    </div>
  );
}
