/**
 * Compact National Flag of Canada + wordmark for the public footer.
 *
 * Construction follows the published description: proportion 2:1, a white
 * square the height of the flag, and the stylized 11-point maple leaf.
 * Digital red is FIP red (#FF0000). Leaf geometry is the public-domain
 * Wikimedia construction used for Flag of Canada.svg.
 */
export function ProudlyCanadian() {
  return (
    <p className="inline-flex items-center gap-2.5 text-[0.8125rem] font-semibold tracking-wide text-white">
      <CanadianFlagMark />
      Proudly Canadian
    </p>
  );
}

function CanadianFlagMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 9600 4800"
      className="h-6 w-12 shrink-0 overflow-visible rounded-[1px] shadow-[0_0_0_1px_rgb(255_255_255/0.28)]"
      aria-hidden="true"
      focusable="false"
      shapeRendering="geometricPrecision"
    >
      <path
        fill="#FF0000"
        d="m0 0h2400l99 99h4602l99-99h2400v4800h-2400l-99-99h-4602l-99 99H0z"
      />
      <path
        fill="#FFFFFF"
        fillRule="evenodd"
        d="m2400 0h4800v4800h-4800zm2490 4430-45-863a95 95 0 0 1 111-98l859 151-116-320a65 65 0 0 1 20-73l941-762-212-99a65 65 0 0 1-34-79l186-572-542 115a65 65 0 0 1-73-38l-105-247-423 454a65 65 0 0 1-111-57l204-1052-327 189a65 65 0 0 1-91-27l-332-652-332 652a65 65 0 0 1-91 27l-327-189 204 1052a65 65 0 0 1-111 57l-423-454-105 247a65 65 0 0 1-73 38l-542-115 186 572a65 65 0 0 1-34 79l-212 99 941 762a65 65 0 0 1 20 73l-116 320 859-151a95 95 0 0 1 111 98l-45 863z"
      />
    </svg>
  );
}
