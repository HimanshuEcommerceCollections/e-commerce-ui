import Link from "next/link";

/**
 * Canonical ShopHub logo — the icon from /public/icons/ShopHub_Icon.svg
 * (masked so it recolors for contrast) + the "ShopHub" wordmark.
 * Renders as a link to the homepage; use this everywhere the brand appears.
 *
 *  - `size`: sm (compact headers) · md (default) · lg (primary navbar)
 *  - `tone`: "light" on light surfaces (blue box, white icon, dark text);
 *            "dark" on dark surfaces (white box, blue icon, white text)
 *  - `href`: link target (defaults to the homepage)
 */
type LogoProps = {
  size?: "sm" | "md" | "lg";
  tone?: "light" | "dark";
  href?: string;
  className?: string;
};

// Full literal class names — Tailwind tree-shakes @layer component classes by
// scanning source for complete strings, so these must not be built dynamically.
const SIZE_CLASS: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "logo logo--sm",
  md: "logo",
  lg: "logo logo--lg",
};

export default function Logo({
  size = "md",
  tone = "light",
  href = "/",
  className = "",
}: LogoProps) {
  const cls = [SIZE_CLASS[size], tone === "dark" ? "logo--on-dark" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <Link href={href} className={cls} aria-label="ShopHub — go to homepage">
      <span className="logo-icon">
        <span className="logo-mark" />
      </span>
      <span className="logo-text">ShopHub</span>
    </Link>
  );
}
