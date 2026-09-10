import { revalidatePath } from "next/cache";

export function revalidateWorkdesk(input: {
  ticketId?: string;
  taskId?: string;
}): void {
  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
  revalidatePath("/tech");
  revalidatePath("/tech/notifications");

  if (input.ticketId) {
    revalidatePath("/admin/tickets");
    revalidatePath(`/admin/tickets/${input.ticketId}`);
    revalidatePath("/tech/tickets");
    revalidatePath(`/tech/tickets/${input.ticketId}`);
    revalidatePath("/portal/tickets");
    revalidatePath(`/portal/tickets/${input.ticketId}`);
  }

  if (input.taskId) {
    revalidatePath("/admin/tasks");
    revalidatePath(`/admin/tasks/${input.taskId}`);
    revalidatePath("/tech/tasks");
    revalidatePath(`/tech/tasks/${input.taskId}`);
  }
}
