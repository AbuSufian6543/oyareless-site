import { Paperclip } from "lucide-react";

import { formatBytes } from "@/lib/utils";

export function AttachmentList({
  files,
}: {
  files: Array<{ id: string; filename: string; url: string; sizeBytes: number; mimeType: string }>;
}) {
  if (files.length === 0) return null;

  return (
    <ul className="mt-3 space-y-1.5">
      {files.map((file) => (
        <li key={file.id}>
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
          >
            <Paperclip className="size-3.5" aria-hidden="true" />
            {file.filename}
            <span className="text-xs font-normal text-slate-500">
              ({formatBytes(file.sizeBytes)})
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
