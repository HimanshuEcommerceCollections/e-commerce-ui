const TRUST_ITEM_CLASS = "flex w-[180px] flex-col items-center gap-3 max-sm:w-[140px]";
const TRUST_ICON_CIRCLE_CLASS =
  "flex h-[57.67px] w-[57.67px] shrink-0 items-center justify-center rounded-full bg-[rgba(37,99,235,0.1)] [&_svg]:w-[28.83px] [&_svg]:h-[28.83px]";
const TRUST_TEXT_CLASS = "flex flex-col items-center gap-1";
const TRUST_TITLE_CLASS =
  "[font-family:'Inter',sans-serif] not-italic font-semibold text-[16.82px] leading-6 text-center text-[#111827]";
const TRUST_SUBTITLE_CLASS =
  "[font-family:'Inter',sans-serif] not-italic font-normal text-[14.42px] leading-[19px] text-center text-[#6B7280]";

export default function TrustBar() {
  return (
    <div className="w-full bg-white py-6 px-[48.06px] border-t border-b border-[#E5E7EB] max-md:px-4">
      <div className="mx-auto flex w-full max-w-[1384px] flex-row items-start justify-evenly max-md:flex-wrap max-md:justify-center max-md:gap-6">

        {/* Fast Shipping */}
        <div className={TRUST_ITEM_CLASS}>
          <div className={TRUST_ICON_CIRCLE_CLASS}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="1"/>
              <path d="M16 8h4l3 5v3h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <div className={TRUST_TEXT_CLASS}>
            <span className={TRUST_TITLE_CLASS}>Fast Shipping</span>
            <span className={TRUST_SUBTITLE_CLASS}>Free on orders $50+</span>
          </div>
        </div>

        {/* Secure Payments */}
        <div className={TRUST_ITEM_CLASS}>
          <div className={TRUST_ICON_CIRCLE_CLASS}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div className={TRUST_TEXT_CLASS}>
            <span className={TRUST_TITLE_CLASS}>Secure Payments</span>
            <span className={TRUST_SUBTITLE_CLASS}>100% protected</span>
          </div>
        </div>

        {/* Easy Returns */}
        <div className={TRUST_ITEM_CLASS}>
          <div className={TRUST_ICON_CIRCLE_CLASS}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </div>
          <div className={TRUST_TEXT_CLASS}>
            <span className={TRUST_TITLE_CLASS}>Easy Returns</span>
            <span className={TRUST_SUBTITLE_CLASS}>30-day guarantee</span>
          </div>
        </div>

        {/* 24/7 Support */}
        <div className={TRUST_ITEM_CLASS}>
          <div className={TRUST_ICON_CIRCLE_CLASS}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
              <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
            </svg>
          </div>
          <div className={TRUST_TEXT_CLASS}>
            <span className={TRUST_TITLE_CLASS}>24/7 Support</span>
            <span className={TRUST_SUBTITLE_CLASS}>Always here to help</span>
          </div>
        </div>

        {/* US Customer Service */}
        <div className={TRUST_ITEM_CLASS}>
          <div className={TRUST_ICON_CIRCLE_CLASS}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div className={TRUST_TEXT_CLASS}>
            <span className={TRUST_TITLE_CLASS}>US Customer Service</span>
            <span className={TRUST_SUBTITLE_CLASS}>Based in America</span>
          </div>
        </div>

      </div>
    </div>
  );
}
