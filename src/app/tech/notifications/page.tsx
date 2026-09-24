import {
  clearWorkdeskNotificationAction,
  clearWorkdeskNotificationsAction,
  markWorkdeskNotificationsReadAction,
} from "@/app/admin/notifications/actions";
import { PageHeader } from "@/components/admin/ui";
import { NotificationInbox } from "@/components/workdesk/notification-inbox";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { technicianOrRedirect, workdeskHref } from "@/lib/workdesk/access";

export const metadata = { title: "Notifications" };

export default async function TechNotificationsPage() {
  const user = await technicianOrRedirect();
  const items = await prisma.workdeskNotification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Assignments and updates on your work. Clearing a notification only removes it from your list."
      />
      <NotificationInbox
        items={items.map((item) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          when: formatDateTime(item.createdAt),
          href: workdeskHref(user.role, item),
          unread: item.readAt == null,
        }))}
        markAllRead={markWorkdeskNotificationsReadAction}
        clearOne={clearWorkdeskNotificationAction}
        clearAll={clearWorkdeskNotificationsAction}
      />
    </div>
  );
}
