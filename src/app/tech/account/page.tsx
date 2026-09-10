import { redirect } from "next/navigation";

import {
  changePasswordAction,
  updateProfileAction,
} from "@/app/admin/account/actions";
import { Alert, Card, CardTitle, PageHeader, TextField } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { technicianOrRedirect } from "@/lib/workdesk/access";

export const metadata = { title: "My account" };

const MESSAGES: Record<string, { tone: "success" | "danger"; text: string }> = {
  saved: { tone: "success", text: "Your profile was updated." },
  wrongpassword: { tone: "danger", text: "That password is not correct." },
  mismatch: { tone: "danger", text: "The two new passwords do not match." },
  weak: {
    tone: "danger",
    text: "Use at least 12 characters with upper and lower case, a number and a symbol.",
  },
};

export default async function TechAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; change?: string }>;
}) {
  const user = await technicianOrRedirect();
  const params = await searchParams;
  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, phone: true },
  });
  if (!record) redirect("/login");

  const messageKey = params.error ?? (params.saved ? "saved" : null);
  const message = messageKey ? MESSAGES[messageKey] : null;

  return (
    <div className="max-w-xl">
      <PageHeader title="My account" description="Update your name, phone, and password." />
      {params.change && (
        <div className="mb-5">
          <Alert tone="warning">Please choose a new password before continuing.</Alert>
        </div>
      )}
      {message && (
        <div className="mb-5">
          <Alert tone={message.tone}>{message.text}</Alert>
        </div>
      )}
      <div className="space-y-5">
        <Card>
          <CardTitle>Profile</CardTitle>
          <form action={updateProfileAction} className="space-y-4">
            <TextField label="Name" name="name" defaultValue={record.name} />
            <TextField label="Email" name="email" defaultValue={record.email} disabled />
            <TextField label="Phone" name="phone" defaultValue={record.phone ?? ""} />
            <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Save profile
            </button>
          </form>
        </Card>
        <Card>
          <CardTitle>Password</CardTitle>
          <form action={changePasswordAction} className="space-y-4">
            <TextField label="Current password" name="currentPassword" type="password" required />
            <TextField label="New password" name="newPassword" type="password" required />
            <TextField label="Confirm new password" name="confirmPassword" type="password" required />
            <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Change password
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
