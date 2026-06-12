const footerColumns = [
  {
    heading: 'Shop',
    links: ['Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Sports'],
  },
  {
    heading: 'Customer Service',
    links: ['Orders', 'Returns', 'Shipping', 'Track Order', 'Contact Us'],
  },
  {
    heading: 'Company',
    links: ['About Us', 'Careers', 'Investors', 'Privacy Policy', 'Terms of Service'],
  },
];

const paymentBadges = ['Visa', 'Mastercard', 'Amex', 'PayPal'];

export default function Footer() {
  return (
    <footer className="flex w-full flex-col items-center bg-[#0F172A] py-[58px]">
      <div className="mx-auto flex w-full max-w-[1384px] flex-col items-start px-12 max-md:px-4">
        <div className="grid w-full grid-cols-[2fr_1fr_1fr_1fr] gap-x-12 max-lg:grid-cols-2 max-lg:gap-y-10 max-sm:grid-cols-1">
          <div className="flex flex-col items-start">
            <div className="flex flex-row items-center gap-[10px]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[19px] bg-[#2563EB]">
                <svg width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 7H6L9 20H22L25 10H9" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="11" cy="24" r="1.5" stroke="#FFFFFF" strokeWidth="2.4" />
                  <circle cx="21" cy="24" r="1.5" stroke="#FFFFFF" strokeWidth="2.4" />
                </svg>
              </div>
              <span className="text-[29px] font-bold leading-[38px] tracking-[-0.72px] text-white [font-family:'Inter',sans-serif]">NEXUS</span>
            </div>
            <p className="mt-[29px] text-[19px] font-normal leading-[29px] text-white/70 [font-family:'Inter',sans-serif]">
              Your one-stop shop for everything you need. Quality products, unbeatable prices, and exceptional service.
            </p>
            <div className="mt-[29px] flex flex-row gap-[19px]">
              <button className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-white/10" aria-label="Facebook">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-white/10" aria-label="Twitter">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23 3C22.0424 3.67548 20.9821 4.19211 19.86 4.53C19.2577 3.83751 18.4573 3.34669 17.567 3.12393C16.6767 2.90116 15.7395 2.9572 14.8821 3.28445C14.0247 3.61171 13.2884 4.1944 12.773 4.95372C12.2575 5.71303 11.9877 6.61234 12 7.53V8.53C10.2426 8.57557 8.50127 8.18581 6.93101 7.39545C5.36074 6.60508 4.01032 5.43864 3 4C3 4 -1 13 8 17C5.94053 18.398 3.48716 19.0989 1 19C10 24 21 19 21 7.5C20.9991 7.22145 20.9723 6.94359 20.92 6.67C21.9406 5.66349 22.6608 4.39271 23 3Z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-white/10" aria-label="Instagram">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="20" height="20" rx="5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="4" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="2" />
                </svg>
              </button>
              <button className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-white/10" aria-label="YouTube">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.54 6.42C22.4212 5.94541 22.1793 5.51057 21.8387 5.15941C21.498 4.80824 21.0708 4.55318 20.6 4.42C18.88 4 12 4 12 4C12 4 5.12 4 3.4 4.46C2.92925 4.59318 2.50198 4.84824 2.16135 5.19941C1.82072 5.55057 1.57879 5.98541 1.46 6.46C1.14521 8.20556 0.991235 9.97631 1 11.75C0.988787 13.537 1.14277 15.3213 1.46 17.08C1.59096 17.5398 1.83831 17.9581 2.17814 18.2945C2.51798 18.6308 2.93882 18.8738 3.4 19C5.12 19.46 12 19.46 12 19.46C12 19.46 18.88 19.46 20.6 19C21.0708 18.8668 21.498 18.6118 21.8387 18.2606C22.1793 17.9094 22.4212 17.4746 22.54 17C22.8524 15.2676 23.0063 13.5103 23 11.75C23.0112 9.96295 22.8573 8.1787 22.54 6.42Z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9.75 15.02L15.5 11.75L9.75 8.48V15.02Z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {footerColumns.map((col, index) => (
            <div className="flex flex-col" key={index}>
              <h3 className="m-0 text-[22px] font-semibold leading-8 text-white [font-family:'Inter',sans-serif]">{col.heading}</h3>
              <div className="mt-[19px] flex flex-col">
                {col.links.map((link, i) => (
                  <span className="cursor-pointer pt-[14px] text-[17px] font-normal leading-6 text-white/70 [font-family:'Inter',sans-serif] first:pt-0" key={i}>{link}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-[58px] flex w-full flex-row items-center justify-between border-t border-white/10 pt-[38px] max-md:flex-col max-md:items-start max-md:gap-4">
          <span className="text-[17px] font-normal leading-6 text-white/70 [font-family:'Inter',sans-serif]">© 2026 NEXUS. All rights reserved.</span>
          <div className="flex flex-row items-center gap-[38px] max-md:flex-wrap max-md:gap-4">
            <span className="text-[17px] font-normal leading-6 text-white/70 [font-family:'Inter',sans-serif]">Country: United States | Language: English</span>
            <div className="flex flex-row gap-[10px] max-sm:flex-wrap">
              {paymentBadges.map((badge, index) => (
                <span className="rounded-[5px] bg-white/10 px-[14px] py-[5px] text-[14px] font-normal leading-[19px] text-white [font-family:'Inter',sans-serif]" key={index}>{badge}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
