import Image from 'next/image';

const features = [
  'Real-time order tracking',
  'Personalized recommendations',
  'Faster checkout',
  'App-only exclusive deals',
];

export default function DownloadAppSection() {
  return (
    <section className="flex w-full flex-col items-center bg-white p-12 max-md:px-4 max-md:py-6">
      <div className="mx-auto w-full max-w-[1384px]">
        <div className="relative flex min-h-[625px] w-full flex-row overflow-hidden rounded-[29px] bg-[linear-gradient(135deg,rgba(37,99,235,0.1)_0%,rgba(37,99,235,0.05)_50%,rgba(249,115,22,0.1)_100%)] max-lg:min-h-0 max-lg:flex-col">
          <div className="flex w-1/2 flex-col items-start justify-center p-[77px] max-lg:w-full max-md:p-6">
            <h2 className="m-0 text-[43px] font-bold leading-[48px] text-[#0F172A] [font-family:'Inter',sans-serif] max-md:text-[28px] max-md:leading-[34px]">Download Our App</h2>
            <p className="mt-[19px] text-[19px] font-normal leading-[29px] text-[#6B7280] [font-family:'Inter',sans-serif]">Shop on the go with exclusive app-only deals</p>

            <div className="mt-[29px] flex w-full flex-col">
              {features.map((text, index) => (
                <div className="flex flex-row items-center gap-[14px] pt-[14px] first:pt-0" key={index}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[rgba(37,99,235,0.1)]">
                    <Image src="/appIcons/tick.png" alt="tick" width={24} height={24} />
                  </div>
                  <span className="text-[17px] font-normal leading-6 text-[#111827] [font-family:'Inter',sans-serif]">{text}</span>
                </div>
              ))}
            </div>

            <div className="mt-[38px] flex flex-row gap-[19px] max-sm:w-full max-sm:flex-col">
              <button className="flex cursor-pointer flex-row items-center gap-[14px] rounded-3xl border-none bg-[#0F172A] px-[29px] py-[14px] max-sm:w-full">
                <Image src="/appIcons/appleIcon.png" alt="App Store" width={29} height={29} />
                <div className="flex flex-col items-start">
                  <span className="text-[14px] font-medium leading-[19px] text-white [font-family:'Inter',sans-serif]">Download on the</span>
                  <span className="text-[17px] font-semibold leading-6 text-white [font-family:'Inter',sans-serif]">App Store</span>
                </div>
              </button>

              <button className="flex cursor-pointer flex-row items-center gap-[14px] rounded-3xl border-none bg-[#0F172A] px-[29px] py-[14px] max-sm:w-full">
                <Image src="/appIcons/mobilescreen.png" alt="Google Play" width={29} height={29} />
                <div className="flex flex-col items-start">
                  <span className="text-[14px] font-medium leading-[19px] text-white [font-family:'Inter',sans-serif]">Get it on</span>
                  <span className="text-[17px] font-semibold leading-6 text-white [font-family:'Inter',sans-serif]">Google Play</span>
                </div>
              </button>
            </div>
          </div>

          <div className="absolute right-0 top-[85px] flex h-[455px] w-1/2 items-center justify-center p-[38px] max-lg:static max-lg:h-[360px] max-lg:w-full max-lg:p-4 max-md:h-[280px]">
            <div className="relative h-full w-full">
              <Image
                src="/appImages/Image (Mobile App).png"
                alt="Mobile App"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
