'use client';
import { useState } from 'react';
import Image from 'next/image';

const benefits = ['Weekly Deals', 'New Arrivals', 'Early Access'];

export default function NewsletterSection() {
  const [email, setEmail] = useState('');

  return (
    <section className="newsletter-section">
      <div className="newsletter-container">
        <div className="newsletter-outer-card">
          <div className="newsletter-gradient-overlay" />
          <div className="newsletter-inner-card">
            <h2 className="newsletter-heading">Unlock Exclusive Savings</h2>
            <p className="newsletter-subtext">
              Join our newsletter for weekly deals, new arrivals, and early access to sales
            </p>
            <div className="newsletter-input-row">
              <input
                className="newsletter-email-input"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="newsletter-subscribe-btn">Subscribe</button>
            </div>
            <div className="newsletter-benefits-row">
              {benefits.map((benefit, index) => (
                <div className="newsletter-benefit-item" key={index}>
                  <Image src="/unlockIcon/tick.png" alt="checkmark" width={19} height={19} />
                  <span className="newsletter-benefit-text">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
