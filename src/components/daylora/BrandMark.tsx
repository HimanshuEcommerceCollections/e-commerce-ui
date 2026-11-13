/**
 * The store logo (designs/logo.png) on a white tile, so its navy and green
 * read on the navy header and footer as well as on light pages. Decorative:
 * the store name next to it (or the link's aria-label) names the brand.
 */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`logo-mark ${className}`.trim()} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- small static asset; no optimisation needed */}
      <img src="/brand/logo-240.png" alt="" width={240} height={141} decoding="async" />
    </span>
  );
}
