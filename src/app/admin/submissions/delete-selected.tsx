"use client";

import { Trash2 } from "lucide-react";

export function DeleteSelectedButton({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <button
      type="submit"
      formAction={action}
      className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
      onClick={(event) => {
        const form = event.currentTarget.form;
        const selected = form
          ? form.querySelectorAll('input[name="ids"]:checked').length
          : 0;
        if (selected === 0) {
          event.preventDefault();
          window.alert("Select at least one message first.");
          return;
        }
        const label = selected === 1 ? "this inbox message" : `${selected} inbox messages`;
        if (
          !window.confirm(
            `Delete ${label}? This cannot be undone. Tasks opened from them stay on the workdesk.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <Trash2 className="size-3.5" aria-hidden="true" />
      Delete
    </button>
  );
}
