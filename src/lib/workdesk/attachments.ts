import "server-only";

import { storeUpload, UploadError, type StoredUpload } from "@/lib/uploads";

const MAX_FILES = 5;

export async function saveWorkdeskUploads(
  formData: FormData,
  field = "attachments",
): Promise<StoredUpload[]> {
  const files = formData
    .getAll(field)
    .filter((value): value is File => value instanceof File && value.size > 0)
    .slice(0, MAX_FILES);

  const saved: StoredUpload[] = [];
  for (const file of files) {
    try {
      saved.push(await storeUpload(file, "private"));
    } catch (error) {
      if (error instanceof UploadError) continue;
      throw error;
    }
  }
  return saved;
}

export function uploadErrorMessage(error: unknown): string {
  if (error instanceof UploadError) return error.message;
  return "That file could not be uploaded.";
}

export function diskPathFromUploadUrl(url: string): string | null {
  if (!url.startsWith("/uploads/")) return null;
  const relative = url.slice("/uploads/".length);
  if (!relative || relative.includes("..")) return null;
  return relative;
}
