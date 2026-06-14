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

// Full literal class names — Tailwind tree-shakes by scanning source for
// complete strings, so these must not be built dynamically.
const ROOT_CLASS: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "inline-flex flex-row items-center gap-[8px]",
  md: "inline-flex flex-row items-center gap-[9.61px]",
  lg: "inline-flex flex-row items-center gap-[9.61px]",
};

const ICON_SIZE_CLASS: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "w-[32px] h-[32px] rounded-[11px]",
  md: "w-[40px] h-[40px] rounded-[14px]",
  lg: "w-[48px] h-[48px] rounded-[19px]",
};

const TEXT_SIZE_CLASS: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "text-[18px] leading-[1.2] tracking-[-0.4px]",
  md: "text-[22px] leading-[1.2] tracking-[-0.5px]",
  lg: "text-[28.83px] leading-[38px] tracking-[-0.72px]",
};

export default function Logo({
  size = "md",
  tone = "light",
  href = "/",
  className = "",
}: LogoProps) {
  /* tone: flip for contrast on dark surfaces */
  const iconToneCls =
    tone === "dark" ? "bg-white text-[#2563EB]" : "bg-[#2563EB] text-white";
  const textToneCls = tone === "dark" ? "text-white" : "text-[#0F172A]";

  const cls = [ROOT_CLASS[size], className].filter(Boolean).join(" ");
  return (
    <Link href={href} className={cls} aria-label="ShopHub — go to homepage">
      <span
        className={`flex items-center justify-center flex-shrink-0 ${ICON_SIZE_CLASS[size]} ${iconToneCls}`}
      >
        {/* ShopHub_Icon.svg masked so it recolors with currentColor for contrast */}
        <span className="w-[60%] h-[60%] bg-current [mask:url('/icons/ShopHub_Icon.svg')_center/contain_no-repeat] [-webkit-mask:url('/icons/ShopHub_Icon.svg')_center/contain_no-repeat]" />
      </span>
      <span
        className={`font-bold whitespace-nowrap ${TEXT_SIZE_CLASS[size]} ${textToneCls}`}
      >
        ShopHub
      </span>
    </Link>
  );
}
