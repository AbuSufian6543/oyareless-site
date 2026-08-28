import Link from "next/link";

import {
  FOOTER_PRODUCTS,
  vendorLogoUrl,
  type FooterProduct,
} from "@/lib/vendor-logos";

/**
 * Compact product strip for the public footer. Small uniform plates so mixed
 * vendor files do not stretch into a second page of tiles. Hytera is the only
 * authorized dealership; the rest are platforms we deploy.
 */
export function FooterProducts() {
  return (
    <section
      aria-labelledby="footer-products-heading"
      className="mt-10 border-t border-white/10 pt-7"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3
          id="footer-products-heading"
          className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-navy-400"
        >
          Platforms we deploy
        </h3>
        <Link
          href="/brands"
          className="text-[0.6875rem] font-semibold text-navy-300 transition-colors hover:text-white"
        >
          Catalogue
        </Link>
      </div>

      <ul className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-2">
        {FOOTER_PRODUCTS.map((product) => (
          <li key={product.slug}>
            <ProductChip product={product} />
          </li>
        ))}
      </ul>

      <p className="mt-3 max-w-3xl text-[0.625rem] leading-relaxed text-navy-500">
        Authorized Hytera dealer. Other names are equipment and platforms we
        install and support.
      </p>
    </section>
  );
}

function ProductChip({ product }: { product: FooterProduct }) {
  const src = vendorLogoUrl(product.slug);
  const alt = product.authorizedDealer
    ? `${product.name} (authorized dealer)`
    : product.name;

  return (
    <Link
      href={product.href}
      title={alt}
      className="flex h-7 items-center justify-center rounded-md bg-white px-2.5 opacity-90 transition-opacity hover:opacity-100"
    >
      {/* Official vendor marks skip next/image so they are not re-encoded. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={96}
        height={28}
        loading="lazy"
        decoding="async"
        className="h-3.5 w-auto max-w-[5rem] object-contain"
      />
    </Link>
  );
}
