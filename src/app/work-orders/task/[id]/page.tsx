import { WorkOrderDocument } from "@/components/workdesk/work-order-document";
import {
  assertTaskAccess,
  handleWorkdeskAuth,
  workdeskStaffOrRedirect,
} from "@/lib/workdesk/access";
import { loadTaskWorkOrder } from "@/lib/workdesk/work-order-load";

export const dynamic = "force-dynamic";

export default async function TaskWorkOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await workdeskStaffOrRedirect();
  const { id } = await params;
  try {
    await assertTaskAccess(user, id);
  } catch (error) {
    handleWorkdeskAuth(error, user.role === "TECHNICIAN" ? "/tech/tasks" : "/admin/tasks");
  }

  const { company, document } = await loadTaskWorkOrder(id, user);

  return <WorkOrderDocument company={company} document={document} />;
}
