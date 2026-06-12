'use client';
import { useState } from 'react';
import Image from 'next/image';

const benefits = ['Weekly Deals', 'New Arrivals', 'Early Access'];

export default function NewsletterSection() {
  const [email, setEmail] = useState('');

  return (
    <section className="flex w-full flex-col items-center bg-white p-12 max-md:px-4 max-md:py-6">
      <div className="mx-auto w-full max-w-[1384px]">
        <div className="relative flex min-h-[481px] w-full items-center justify-center overflow-hidden rounded-[29px] bg-[#1e40af]">
          <div className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(37,99,235,0.9)_0%,rgba(249,115,22,0.8)_100%)]" />
          <div className="relative z-[2] mx-auto flex w-full max-w-[807px] flex-col items-start rounded-[29px] border border-white/50 bg-white/10 p-[58px] shadow-[0px_10px_38px_rgba(0,0,0,0.08)] max-md:p-6">
            <h2 className="m-0 w-full text-center text-[43px] font-bold leading-[48px] text-white [font-family:'Inter',sans-serif] max-md:text-[28px] max-md:leading-[34px]">Unlock Exclusive Savings</h2>
            <p className="mt-[19px] w-full text-center text-[22px] font-normal leading-[34px] text-white/90 [font-family:'Inter',sans-serif] max-md:text-[17px] max-md:leading-[26px]">
              Join our newsletter for weekly deals, new arrivals, and early access to sales
            </p>
            <div className="mt-[38px] flex w-full flex-row items-start gap-[19px] max-md:flex-col">
              <input
                className="h-[71px] flex-1 rounded-full border-2 border-white/30 bg-white/10 px-[29px] py-[19px] text-[19px] font-normal text-white/60 outline-none [font-family:'Inter',sans-serif] placeholder:text-white/60 max-md:h-[56px] max-md:w-full"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="h-[71px] w-[161px] shrink-0 cursor-pointer rounded-full border-none bg-white text-[19px] font-semibold text-[#2563EB] [font-family:'Inter',sans-serif] max-md:h-[56px] max-md:w-full">Subscribe</button>
            </div>
            <div className="mt-[38px] flex w-full flex-row items-center justify-center gap-[38px] max-md:flex-wrap max-md:gap-4">
              {benefits.map((benefit, index) => (
                <div className="flex flex-row items-center gap-[10px]" key={index}>
                  <Image src="/unlockIcon/tick.png" alt="checkmark" width={19} height={19} />
                  <span className="text-center text-[17px] font-normal leading-6 text-white/80 [font-family:'Inter',sans-serif]">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
