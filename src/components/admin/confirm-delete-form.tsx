"use client";

import type { ReactNode } from "react";

export function ConfirmDeleteForm({
  action,
  id,
  message,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  message: string;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      {children}
    </form>
  );
}
