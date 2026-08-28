import { MapleLeafIcon } from "@/components/ui/social-icons";

/**
 * Compact Canadian flag + wordmark for the public footer. The maple is
 * decorative; the text is the accessible name.
 */
export function ProudlyCanadian() {
  return (
    <p className="inline-flex items-center gap-2 text-[0.8125rem] font-semibold tracking-wide text-white">
      <span
        className="flex h-4 w-7 shrink-0 overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgb(255_255_255/0.12)]"
        aria-hidden="true"
      >
        <span className="w-[27%] bg-[#FF0000]" />
        <span className="flex flex-1 items-center justify-center bg-white">
          <MapleLeafIcon className="size-2.5 text-[#FF0000]" />
        </span>
        <span className="w-[27%] bg-[#FF0000]" />
      </span>
      Proudly Canadian
    </p>
  );
}
