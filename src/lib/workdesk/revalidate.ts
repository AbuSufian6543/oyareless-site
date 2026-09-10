import { revalidatePath } from "next/cache";

import { setFlash, type FlashKind } from "@/lib/flash";

export async function revalidateWorkdesk(input: {
  ticketId?: string;
  taskId?: string;
  flash?: FlashKind | false;
}): Promise<void> {
  if (input.flash !== false) {
    await setFlash(input.flash ?? "saved");
  }
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
