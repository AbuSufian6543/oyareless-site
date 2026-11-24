import { notFound } from "next/navigation";

import { loadAdminTask } from "@/app/admin/tasks/load-task";
import { TaskDetailView } from "@/components/workdesk/task-detail-view";
import { TaskDrawer } from "@/components/workdesk/task-drawer";

export default async function TaskDrawerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notify?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const data = await loadAdminTask(id);
  if (!data) notFound();

  return (
    <TaskDrawer title={`${data.task.reference}: ${data.task.title}`} fullHref={`/admin/tasks/${id}`}>
      <TaskDetailView {...data} notify={query.notify} layout="stack" />
    </TaskDrawer>
  );
}
