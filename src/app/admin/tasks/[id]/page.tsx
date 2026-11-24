import { notFound } from "next/navigation";

import { loadAdminTask } from "@/app/admin/tasks/load-task";
import { TaskDetailView } from "@/components/workdesk/task-detail-view";
import { safeTaskReturn, taskNeighbors } from "@/lib/workdesk/task-neighbors";

export default async function AdminTaskPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notify?: string; from?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const data = await loadAdminTask(id);
  if (!data) notFound();
  const backHref = safeTaskReturn(query.from);
  const neighbors = await taskNeighbors(data.user.id, backHref, data.task.id);
  return (
    <TaskDetailView
      {...data}
      notify={query.notify}
      backHref={backHref}
      previous={neighbors.previous}
      next={neighbors.next}
    />
  );
}
