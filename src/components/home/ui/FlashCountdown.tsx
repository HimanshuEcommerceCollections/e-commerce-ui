'use client';
import { useState, useEffect } from 'react';

const UNIT_CLASS = 'flex flex-col items-center';
const NUMBER_CLASS =
  "[font-family:'Inter',sans-serif] font-bold text-[36.04px] leading-[43px] text-center text-[#F97316] min-w-[41px] max-md:text-[24px] max-md:leading-[30px] max-md:min-w-[28px]";
const LABEL_CLASS =
  "[font-family:'Inter',sans-serif] font-normal text-[14.42px] leading-[19px] text-center text-[#6B7280]";
const SEP_CLASS =
  "[font-family:'Inter',sans-serif] font-normal text-[36.04px] leading-[43px] text-[#6B7280] self-start pt-[2px] max-md:text-[24px] max-md:leading-[30px]";

export default function FlashCountdown() {
  const [time, setTime] = useState({ hours: 12, mins: 33, secs: 4 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => {
        let { hours, mins, secs } = prev;
        secs--;
        if (secs < 0) { secs = 59; mins--; }
        if (mins < 0) { mins = 59; hours--; }
        if (hours < 0) { hours = 0; mins = 0; secs = 0; }
        return { hours, mins, secs };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="box-border flex flex-row items-start gap-[19.22px] py-[19.22px] px-[38.44px] rounded-[19.22px] border border-[#E5E7EB] bg-[rgba(255,255,255,0.9)] shadow-[0px_4.81px_19.22px_rgba(0,0,0,0.06)] max-md:gap-2 max-md:p-3">
      <div className={UNIT_CLASS}>
        <span className={NUMBER_CLASS}>{pad(time.hours)}</span>
        <span className={LABEL_CLASS}>Hours</span>
      </div>
      <span className={SEP_CLASS}>:</span>
      <div className={UNIT_CLASS}>
        <span className={NUMBER_CLASS}>{pad(time.mins)}</span>
        <span className={LABEL_CLASS}>Mins</span>
      </div>
      <span className={SEP_CLASS}>:</span>
      <div className={UNIT_CLASS}>
        <span className={NUMBER_CLASS}>{pad(time.secs)}</span>
        <span className={LABEL_CLASS}>Secs</span>
      </div>
    </div>
  );
}
