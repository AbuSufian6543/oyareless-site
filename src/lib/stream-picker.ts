/** Options shown in the page-builder stream picker. Never includes hashes. */
export type StreamPickerOption = {
  slug: string;
  title: string;
  isPublic: boolean;
  hasPassword: boolean;
};

export function toStreamPickerOptions(
  streams: Array<{
    slug: string;
    title: string;
    isPublic: boolean;
    accessPasswordHash: string | null;
  }>,
): StreamPickerOption[] {
  return streams.map((stream) => ({
    slug: stream.slug,
    title: stream.title,
    isPublic: stream.isPublic,
    hasPassword: Boolean(stream.accessPasswordHash),
  }));
}
