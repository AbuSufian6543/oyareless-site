import { notFound } from "next/navigation";

import { loadAdminTask } from "@/app/admin/tasks/load-task";
import { TaskDetailView } from "@/components/workdesk/task-detail-view";

export default async function AdminTaskPage({
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
  return <TaskDetailView {...data} notify={query.notify} />;
}
