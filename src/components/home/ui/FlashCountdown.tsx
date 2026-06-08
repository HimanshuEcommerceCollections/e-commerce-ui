'use client';
import { useState, useEffect } from 'react';

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
    <div className="flash-countdown">
      <div className="flash-countdown-unit">
        <span className="flash-countdown-number">{pad(time.hours)}</span>
        <span className="flash-countdown-label">Hours</span>
      </div>
      <span className="flash-countdown-sep">:</span>
      <div className="flash-countdown-unit">
        <span className="flash-countdown-number">{pad(time.mins)}</span>
        <span className="flash-countdown-label">Mins</span>
      </div>
      <span className="flash-countdown-sep">:</span>
      <div className="flash-countdown-unit">
        <span className="flash-countdown-number">{pad(time.secs)}</span>
        <span className="flash-countdown-label">Secs</span>
      </div>
    </div>
  );
}
