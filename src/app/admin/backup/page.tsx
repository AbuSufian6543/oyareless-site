import { Alert, Card, CardTitle, PageHeader } from "@/components/admin/ui";
import { BackupPanel } from "@/components/admin/backup-panel";
import { requireAdminRole } from "@/lib/admin-guard";
import { listBackupSnapshots } from "@/lib/site-backup";
import { SITE_BACKUP_CONFIRM } from "@/lib/site-backup-format";

export const metadata = { title: "Backup" };
export const dynamic = "force-dynamic";

export default async function BackupPage() {
  await requireAdminRole("SUPERADMIN");
  const snapshots = await listBackupSnapshots();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Backup"
        description="Download a snapshot of the live database and uploaded files, or put one back. This is the site’s content, not the program itself."
      />

      <Alert tone="warning">
        Restore replaces the current database and uploads with the snapshot.
        Anything saved after that file was made is gone. Type {SITE_BACKUP_CONFIRM}{" "}
        and your password to continue. If the site will not start at all, restore
        from the server with <span className="font-mono">./backup.sh --restore</span>{" "}
        instead of this page.
      </Alert>

      <Card className="mt-5">
        <CardTitle description="Includes pages, users, tickets, applications, media, résumés, and workdesk files. Does not include .env, TLS certificates, or the application code.">
          Snapshot
        </CardTitle>
        <BackupPanel
          snapshots={snapshots.map((item) => ({
            name: item.name,
            bytes: item.bytes,
            createdAt: item.createdAt.toISOString(),
          }))}
        />
      </Card>
    </div>
  );
}
