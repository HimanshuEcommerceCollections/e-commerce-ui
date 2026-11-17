/**
 * The store logo. Decorative: the store name next to it (or the link's
 * aria-label) names the brand.
 *
 * - default: designs/logo.png on a small white tile, for dark grounds
 *   (checkout, invoice, seller portal).
 * - `full`: the full-colour mark with its empty margins trimmed (design 01
 *   v2), for the white storefront header and the footer's white plate.
 */
export function BrandMark({ className = "", full = false }: { className?: string; full?: boolean }) {
  return (
    <span className={`logo-mark${full ? " logo-mark-full" : ""} ${className}`.trim()} aria-hidden="true">
      {full ? (
        // eslint-disable-next-line @next/next/no-img-element -- small static asset; no optimisation needed
        <img src="/brand/logo-trim.png" alt="" width={310} height={180} decoding="async" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- small static asset; no optimisation needed
        <img src="/brand/logo-240.png" alt="" width={240} height={141} decoding="async" />
      )}
    </span>
  );
}
