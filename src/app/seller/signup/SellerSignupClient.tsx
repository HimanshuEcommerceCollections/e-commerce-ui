'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type PasswordStrength = 0 | 1 | 2 | 3 | 4;

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score as PasswordStrength;
}

export default function SellerSignupClient() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreed: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = getPasswordStrength(formData.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!formData.agreed) return;
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const strengthColors: string[] = [
    '',
    'seller-signup__strength-bar--weak',
    'seller-signup__strength-bar--medium',
    'seller-signup__strength-bar--medium',
    'seller-signup__strength-bar--strong',
  ];

  const EyeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 3C4.5 3 1.5 8 1.5 8s3 5 6.5 5 6.5-5 6.5-5-3-5-6.5-5z" stroke="#9E9E9E" strokeWidth="1.2" fill="none"/>
      <circle cx="8" cy="8" r="2" stroke="#9E9E9E" strokeWidth="1.2" fill="none"/>
    </svg>
  );

  const EyeOffIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2l12 12M8 3C4.5 3 1.5 8 1.5 8s.8 1.3 2.2 2.5M6 5.2A3 3 0 0110.8 10M8 13c3.5 0 6.5-5 6.5-5s-.8-1.3-2.2-2.5" stroke="#9E9E9E" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div className="seller-signup__page">

      {/* ── LEFT PANEL ── */}
      <aside className="seller-signup__left">
        <div className="seller-signup__left-glow" />

        {/* Navbar */}
        <nav className="seller-signup__left-nav">
          <div className="seller-signup__logo-icon">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M2.5 3.5H4.5L7 14H16L18.5 6H7" stroke="#FFFFFF" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="8.5" cy="17" r="1.2" stroke="#FFFFFF" strokeWidth="1.67"/>
              <circle cx="14.5" cy="17" r="1.2" stroke="#FFFFFF" strokeWidth="1.67"/>
            </svg>
          </div>
          <span className="seller-signup__logo-name">ShopHub</span>
          <span className="seller-signup__logo-badge">Seller Center</span>
        </nav>

        {/* Main content */}
        <div className="seller-signup__left-content">
          <div className="seller-signup__pill">
            <span className="seller-signup__pill-text">✦ Join 50,000+ Sellers</span>
          </div>

          <div style={{ marginBottom: 16 }}>
            <span className="seller-signup__heading-light">Start Selling on</span>
            <span className="seller-signup__heading-bold">ShopHub Today</span>
          </div>

          <p className="seller-signup__subtext">
            Reach 5 million buyers. Zero upfront cost.
          </p>

          <div className="seller-signup__features">
            <div className="seller-signup__feature-item">
              <div className="seller-signup__feature-icon">💰</div>
              <span className="seller-signup__feature-text">0% commission for your first 90 days</span>
            </div>
            <div className="seller-signup__feature-item">
              <div className="seller-signup__feature-icon">🚀</div>
              <span className="seller-signup__feature-text">Start listing products in under 10 minutes</span>
            </div>
            <div className="seller-signup__feature-item">
              <div className="seller-signup__feature-icon">📦</div>
              <span className="seller-signup__feature-text">Fulfillment &amp; logistics support available</span>
            </div>
          </div>

          <div className="seller-signup__stats">
            <div className="seller-signup__stat-card">
              <span className="seller-signup__stat-value">50K+</span>
              <span className="seller-signup__stat-label">Active Sellers</span>
            </div>
            <div className="seller-signup__stat-card">
              <span className="seller-signup__stat-value">$2.4M</span>
              <span className="seller-signup__stat-label">Paid Out Monthly</span>
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="seller-signup__trust-bar">
          <div className="seller-signup__trust-item">
            <span className="seller-signup__trust-emoji">🔒</span>
            <span className="seller-signup__trust-text">No Hidden Fees</span>
          </div>
          <div className="seller-signup__trust-divider" />
          <div className="seller-signup__trust-item">
            <span className="seller-signup__trust-emoji">⭐</span>
            <span className="seller-signup__trust-text">4.8/5 Seller Rating</span>
          </div>
          <div className="seller-signup__trust-divider" />
          <div className="seller-signup__trust-item">
            <span className="seller-signup__trust-emoji">📞</span>
            <span className="seller-signup__trust-text">24/7 Seller Support</span>
          </div>
        </div>
      </aside>

      {/* ── RIGHT PANEL ── */}
      <main className="seller-signup__right">
        <div style={{ width: 480 }}>
          <div className="seller-signup__card">

            {/* Card logo */}
            <div className="seller-signup__card-logo">
              <div className="seller-signup__card-logo-icon">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path d="M2.5 3.5H4.5L7 14H16L18.5 6H7" stroke="#FFFFFF" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8.5" cy="17" r="1.2" stroke="#FFFFFF" strokeWidth="1.67"/>
                  <circle cx="14.5" cy="17" r="1.2" stroke="#FFFFFF" strokeWidth="1.67"/>
                </svg>
              </div>
              <span className="seller-signup__card-logo-name">ShopHub Seller Center</span>
            </div>

            <h1 className="seller-signup__card-title">Create Seller Account</h1>
            <p className="seller-signup__card-subtitle">
              Get started in minutes. Complete your profile after signup.
            </p>

            {/* Form fields */}
            <div className="seller-signup__form">

              {/* Your Name */}
              <div className="seller-signup__field">
                <label className="seller-signup__label">Your Name</label>
                <div className="seller-signup__input-wrap">
                  <span className="seller-signup__input-icon">
                    <Image src="/merchanticons/Container.png" alt="" width={16} height={16} />
                  </span>
                  <input
                    className="seller-signup__input"
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="seller-signup__field">
                <label className="seller-signup__label">Email Address</label>
                <div className="seller-signup__input-wrap">
                  <span className="seller-signup__input-icon">
                    <Image src="/merchanticons/Container (1).png" alt="" width={16} height={16} />
                  </span>
                  <input
                    className="seller-signup__input"
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="seller-signup__field">
                <label className="seller-signup__label">Phone Number</label>
                <div className="seller-signup__input-wrap">
                  <span className="seller-signup__phone-prefix">
                    🇮🇳 +91
                  </span>
                  <input
                    className="seller-signup__input seller-signup__input--phone"
                    type="tel"
                    name="phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="seller-signup__field">
                <label className="seller-signup__label">Password</label>
                <div className="seller-signup__input-wrap">
                  <span className="seller-signup__input-icon">
                    <Image src="/merchanticons/Container (2).png" alt="" width={16} height={16} />
                  </span>
                  <input
                    className="seller-signup__input seller-signup__input--with-right-icon"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Create a password (min. 8 characters)"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="seller-signup__input-right-icon"
                    onClick={() => setShowPassword(p => !p)}
                    aria-label="Toggle password visibility"
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
                {formData.password && (
                  <div className="seller-signup__password-strength">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`seller-signup__strength-bar ${i <= passwordStrength ? strengthColors[passwordStrength] : ''}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="seller-signup__field">
                <label className="seller-signup__label">Confirm Password</label>
                <div className="seller-signup__input-wrap">
                  <span className="seller-signup__input-icon">
                    <Image src="/merchanticons/Container (2).png" alt="" width={16} height={16} />
                  </span>
                  <input
                    className="seller-signup__input seller-signup__input--with-right-icon"
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="seller-signup__input-right-icon"
                    onClick={() => setShowConfirm(p => !p)}
                    aria-label="Toggle confirm password visibility"
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    {showConfirm ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
              </div>

            </div>

            {/* Terms checkbox */}
            <div className="seller-signup__checkbox-row">
              <input
                className="seller-signup__checkbox"
                type="checkbox"
                name="agreed"
                id="agreed"
                checked={formData.agreed}
                onChange={handleChange}
              />
              <label htmlFor="agreed" className="seller-signup__checkbox-label">
                I agree to ShopHub&apos;s{' '}
                <Link href="/seller/terms">Seller Terms</Link>
                {' '}&amp;{' '}
                <Link href="/seller/policies">Marketplace Policies</Link>
              </label>
            </div>

            {/* Submit */}
            <button
              className="seller-signup__submit-btn"
              onClick={handleSubmit}
              disabled={!formData.agreed || isLoading}
            >
              {isLoading ? 'Creating Account…' : 'Create Seller Account →'}
            </button>

            {/* Sign in link */}
            <p className="seller-signup__signin-text">
              Already have an account?{' '}
              <Link href="/seller/login">Sign In</Link>
            </p>

          </div>

          {/* Trust badges below card */}
          <div className="seller-signup__badge-row">
            <div className="seller-signup__badge-item">
              <div className="seller-signup__badge-icon-wrap">
                <Image src="/merchanticons/Container.png" alt="Secure" width={16} height={16} />
              </div>
              <div className="seller-signup__badge-text-wrap">
                <span className="seller-signup__badge-title">Secure</span>
                <span className="seller-signup__badge-subtitle">Signup</span>
              </div>
            </div>
            <div className="seller-signup__badge-item">
              <div className="seller-signup__badge-icon-wrap">
                <Image src="/merchanticons/Container (1).png" alt="Free" width={16} height={16} />
              </div>
              <div className="seller-signup__badge-text-wrap">
                <span className="seller-signup__badge-title">Free to</span>
                <span className="seller-signup__badge-subtitle">List</span>
              </div>
            </div>
            <div className="seller-signup__badge-item">
              <div className="seller-signup__badge-icon-wrap">
                <Image src="/merchanticons/Container (2).png" alt="Get Paid" width={16} height={16} />
              </div>
              <div className="seller-signup__badge-text-wrap">
                <span className="seller-signup__badge-title">Get Paid</span>
                <span className="seller-signup__badge-subtitle">Fast</span>
              </div>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
