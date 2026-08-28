import Link from "next/link";

import {
  FOOTER_PRODUCTS,
  vendorLogoUrl,
  type FooterProduct,
} from "@/lib/vendor-logos";
import { cn } from "@/lib/utils";

/**
 * Full-width product wall for the public footer. Every shipped vendor mark
 * is shown. Copy stays honest: only Hytera is an authorized dealership.
 */
export function FooterProducts() {
  return (
    <section
      aria-labelledby="footer-products-heading"
      className="mt-12 border-t border-navy-800 pt-10"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-accent-400">What we put in the rack</p>
          <h3
            id="footer-products-heading"
            className="mt-1.5 text-lg font-bold tracking-tight text-white"
          >
            Products we use
          </h3>
        </div>
        <Link
          href="/brands"
          className="text-sm font-semibold text-accent-300 transition-colors hover:text-white"
        >
          Full catalogue
        </Link>
      </div>

      <ul className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10">
        {FOOTER_PRODUCTS.map((product) => (
          <li key={product.slug}>
            <ProductTile product={product} />
          </li>
        ))}
      </ul>

      <p className="mt-4 max-w-3xl text-[0.6875rem] leading-relaxed text-navy-400">
        WirelessCom.Ca Inc. is an authorized Hytera dealer. Other names are
        equipment and cloud platforms we install and support — listing them
        does not imply a formal partnership.
      </p>
    </section>
  );
}

function ProductTile({ product }: { product: FooterProduct }) {
  const src = vendorLogoUrl(product.slug);
  const alt = product.authorizedDealer
    ? `${product.name} (authorized dealer)`
    : product.name;

  const mark = (
    // Official vendor marks skip next/image so they are not re-encoded.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={160}
      height={48}
      loading="lazy"
      decoding="async"
      className={cn(
        "object-contain",
        product.plate === "fill"
          ? "h-full w-full object-cover"
          : product.plate === "dark"
            ? "h-full w-full p-1.5"
            : "max-h-8 w-auto max-w-[90%]",
      )}
    />
  );

  const className = cn(
    "flex h-12 w-full items-center justify-center overflow-hidden rounded-lg border transition-colors sm:h-14",
    product.plate === "light" &&
      "border-white/70 bg-white hover:border-accent-300",
    product.plate === "dark" &&
      "border-navy-700 bg-black hover:border-accent-500/40",
    product.plate === "fill" && "border-transparent hover:opacity-90",
  );

  return (
    <Link href={product.href} className={className} title={alt}>
      {mark}
    </Link>
  );
}
