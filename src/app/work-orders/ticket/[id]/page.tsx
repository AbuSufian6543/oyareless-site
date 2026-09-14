import { WorkOrderDocument } from "@/components/workdesk/work-order-document";
import {
  assertTicketAccess,
  handleWorkdeskAuth,
  workdeskStaffOrRedirect,
} from "@/lib/workdesk/access";
import { loadTicketWorkOrder } from "@/lib/workdesk/work-order-load";

export const dynamic = "force-dynamic";

export default async function TicketWorkOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await workdeskStaffOrRedirect();
  const { id } = await params;
  try {
    await assertTicketAccess(user, id);
  } catch (error) {
    handleWorkdeskAuth(error, user.role === "TECHNICIAN" ? "/tech/tickets" : "/admin/tickets");
  }

  const { company, document } = await loadTicketWorkOrder(id, user);

  return <WorkOrderDocument company={company} document={document} />;
}
