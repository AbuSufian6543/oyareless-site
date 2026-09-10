import { UPLOAD_ACCEPT } from "@/lib/upload-accept";

export function AttachmentField({
  name = "attachments",
  label = "Attachments",
  hint = "JPG, PNG, WebP, GIF, SVG or PDF. Up to 5 files.",
}: {
  name?: string;
  label?: string;
  hint?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-navy-800">{label}</span>
      <input
        type="file"
        name={name}
        accept={UPLOAD_ACCEPT}
        multiple
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-navy-800"
      />
      <span className="mt-1 block text-xs text-slate-500">{hint}</span>
    </label>
  );
}
