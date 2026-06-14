'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/lib/apiError';

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

type FormErrors = Partial<Record<'name' | 'email' | 'phone' | 'password' | 'confirmPassword', string>>;

function validate(formData: {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}): FormErrors {
  const errors: FormErrors = {};
  if (formData.name.trim().length < 2) errors.name = 'Enter your full name';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Enter a valid email address';
  if (!/^\d{10}$/.test(formData.phone.replace(/[\s()-]/g, ''))) errors.phone = 'Enter a valid 10-digit phone number';
  if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters';
  if (formData.confirmPassword !== formData.password) errors.confirmPassword = 'Passwords do not match';
  return errors;
}

/* Shared Tailwind class strings (migrated from the former seller signup section of globals.css) */
const fieldClass = 'flex flex-col gap-[6px] w-full';
const labelClass = "[font-family:'Inter',sans-serif] font-medium text-[13px] leading-[20px] text-[#424242]";
const inputWrapClass = 'relative w-[384px] h-12 max-md:w-full';
const inputIconClass = 'absolute left-[14px] top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center pointer-events-none z-[1]';
const inputBaseClass =
  "absolute left-0 top-0 w-full h-12 bg-[#FAFAFA] border-[0.8px] border-solid border-[#E0E0E0] py-0 [font-family:'Inter',sans-serif] font-normal text-[14px] text-[#212121] outline-none box-border placeholder:text-[rgba(33,33,33,0.5)] focus:border-[#2874F0]";
const inputClass = `${inputBaseClass} rounded-[10px] pl-[42px] pr-[14px]`;
const inputWithRightIconClass = `${inputBaseClass} rounded-[10px] pl-[42px] pr-[44px]`;
const inputPhoneClass = `${inputBaseClass} rounded-[20px] pl-[80px] pr-[14px]`;
const inputRightIconClass = 'absolute right-[14px] top-1/2 -translate-y-1/2 cursor-pointer z-[1] bg-transparent border-none p-0';
const featureItemClass = 'flex flex-row items-center gap-[14px]';
const featureIconClass = 'flex justify-center items-center w-7 h-7 bg-[#FF9F00] rounded-[14px] text-[13px] shrink-0';
const featureTextClass = "[font-family:'Inter',sans-serif] font-medium text-[15px] leading-[22px] text-white";
const statCardClass =
  'flex flex-col items-start px-5 py-4 bg-[rgba(255,255,255,0.12)] border-[0.8px] border-solid border-[rgba(255,255,255,0.22)] rounded-[14px]';
const statValueClass = "[font-family:'Inter',sans-serif] font-extrabold text-[24px] leading-[36px] tracking-[-0.5px] text-white";
const statLabelClass = "[font-family:'Inter',sans-serif] font-normal text-[12px] leading-[18px] text-[rgba(255,255,255,0.65)]";
const trustItemClass = 'flex flex-row items-center gap-[7px]';
const trustDividerClass = 'w-px h-4 bg-[rgba(255,255,255,0.2)]';
const trustEmojiClass = 'text-[14px] leading-[21px]';
const trustTextClass = "[font-family:'Inter',sans-serif] font-medium text-[13px] leading-[20px] text-[rgba(255,255,255,0.75)]";
const checkboxLinkClass = 'text-[#2874F0] no-underline hover:underline';
const badgeItemClass = 'flex flex-row items-center gap-[10px]';
const badgeIconWrapClass = 'flex justify-center items-center w-8 h-8 bg-[#EBF3FF] rounded-[16px] shrink-0';
const badgeImgClass = 'w-4 h-4 object-contain';
const badgeTextWrapClass = 'flex flex-col';
const badgeTitleClass = "[font-family:'Inter',sans-serif] font-semibold text-[12px] leading-[16px] text-[#424242]";
const badgeSubtitleClass = "[font-family:'Inter',sans-serif] font-normal text-[11px] leading-[14px] text-[#757575]";

export default function SellerSignupClient() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreed: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
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
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!formData.agreed) return;
    const validationErrors = validate(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);
    try {
      await register({
        fullName: formData.name.trim(),
        email: formData.email.trim(),
        phoneNumber: `+91${formData.phone.replace(/[\s()-]/g, '')}`,
        password: formData.password,
        role: 'ROLE_MERCHANT',
      });
      toast.success('Seller account created — welcome to ShopHub!');
      router.push('/merchant');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Sign up failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const strengthColors: string[] = [
    '',
    'bg-[#F44336]',
    'bg-[#FF9F00]',
    'bg-[#FF9F00]',
    'bg-[#4CAF50]',
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
    <div className="flex flex-row items-stretch w-full min-h-screen">

      {/* ── LEFT PANEL ── */}
      <aside className="sticky top-0 w-[792px] min-w-[792px] h-screen bg-[linear-gradient(135deg,#0A1628_0%,#1A2F6A_40%,#1A3A8F_100%)] flex flex-col overflow-hidden max-lg:hidden">
        <div className="absolute w-[420px] h-[420px] left-[277.2px] top-[311.7px] bg-[radial-gradient(70.71%_70.71%_at_50%_50%,rgba(255,159,0,0.22)_0%,rgba(0,0,0,0)_70%)] rounded-[210px] pointer-events-none" />

        {/* Navbar */}
        <nav className="flex flex-row items-center px-14 py-8 gap-[10px] w-full h-[100px] shrink-0 relative z-[1]">
          <div className="flex justify-center items-center w-9 h-9 bg-[#2874F0] rounded-[18px] shrink-0">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M2.5 3.5H4.5L7 14H16L18.5 6H7" stroke="#FFFFFF" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="8.5" cy="17" r="1.2" stroke="#FFFFFF" strokeWidth="1.67"/>
              <circle cx="14.5" cy="17" r="1.2" stroke="#FFFFFF" strokeWidth="1.67"/>
            </svg>
          </div>
          <span className="[font-family:'Inter',sans-serif] font-bold text-[18px] leading-[27px] tracking-[-0.3px] text-white">ShopHub</span>
          <span className="bg-[#FF9F00] rounded-[20px] px-[10px] py-[3px] [font-family:'Inter',sans-serif] font-semibold text-[12px] leading-[18px] text-white">Seller Center</span>
        </nav>

        {/* Main content */}
        <div className="flex flex-col justify-center items-start pl-14 pr-10 flex-1 relative z-[1]">
          <div className="flex flex-row items-center px-[14px] py-[5px] gap-[6px] bg-[rgba(255,159,0,0.15)] border-[0.8px] border-solid border-[#FF9F00] rounded-[20px] mb-5">
            <span className="[font-family:'Inter',sans-serif] font-semibold text-[13px] leading-[20px] text-[#FF9F00]">✦ Join 50,000+ Sellers</span>
          </div>

          <div className="mb-4">
            <span className="[font-family:'Inter',sans-serif] font-normal text-[40px] leading-[48px] text-[rgba(255,255,255,0.8)] block">Start Selling on</span>
            <span className="[font-family:'Inter',sans-serif] font-extrabold text-[56px] leading-[62px] tracking-[-1.5px] text-white block mb-4">ShopHub Today</span>
          </div>

          <p className="[font-family:'Inter',sans-serif] font-normal text-[18px] leading-[27px] text-[rgba(255,255,255,0.7)] mb-8">
            Reach 5 million buyers. Zero upfront cost.
          </p>

          <div className="flex flex-col gap-[14px] mb-0">
            <div className={featureItemClass}>
              <div className={featureIconClass}>💰</div>
              <span className={featureTextClass}>0% commission for your first 90 days</span>
            </div>
            <div className={featureItemClass}>
              <div className={featureIconClass}>🚀</div>
              <span className={featureTextClass}>Start listing products in under 10 minutes</span>
            </div>
            <div className={featureItemClass}>
              <div className={featureIconClass}>📦</div>
              <span className={featureTextClass}>Fulfillment &amp; logistics support available</span>
            </div>
          </div>

          <div className="flex flex-row gap-[14px] mt-12">
            <div className={statCardClass}>
              <span className={statValueClass}>50K+</span>
              <span className={statLabelClass}>Active Sellers</span>
            </div>
            <div className={statCardClass}>
              <span className={statValueClass}>$2.4M</span>
              <span className={statLabelClass}>Paid Out Monthly</span>
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="flex flex-row justify-center items-center gap-9 w-full h-[52px] bg-[rgba(0,0,0,0.2)] shrink-0 relative z-[1]">
          <div className={trustItemClass}>
            <span className={trustEmojiClass}>🔒</span>
            <span className={trustTextClass}>No Hidden Fees</span>
          </div>
          <div className={trustDividerClass} />
          <div className={trustItemClass}>
            <span className={trustEmojiClass}>⭐</span>
            <span className={trustTextClass}>4.8/5 Seller Rating</span>
          </div>
          <div className={trustDividerClass} />
          <div className={trustItemClass}>
            <span className={trustEmojiClass}>📞</span>
            <span className={trustTextClass}>24/7 Seller Support</span>
          </div>
        </div>
      </aside>

      {/* ── RIGHT PANEL ── */}
      <main className="flex-1 min-h-screen overflow-y-auto bg-[#F5F7FA] flex justify-center items-start px-8 py-12 max-lg:p-6 max-sm:px-4">
        <div className="w-[480px] max-lg:w-full max-lg:max-w-[480px]">
          <div className="flex flex-col items-start px-12 py-11 w-[480px] bg-white shadow-[0px_8px_40px_rgba(0,0,0,0.1)] rounded-[20px] max-lg:w-full max-md:px-5 max-md:py-7">

            {/* Card logo */}
            <div className="flex flex-row items-center gap-2 w-[384px] mb-0 max-md:w-full">
              <div className="flex justify-center items-center w-7 h-7 bg-[#2874F0] rounded-[14px] shrink-0">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path d="M2.5 3.5H4.5L7 14H16L18.5 6H7" stroke="#FFFFFF" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8.5" cy="17" r="1.2" stroke="#FFFFFF" strokeWidth="1.67"/>
                  <circle cx="14.5" cy="17" r="1.2" stroke="#FFFFFF" strokeWidth="1.67"/>
                </svg>
              </div>
              <span className="[font-family:'Inter',sans-serif] font-bold text-[18px] leading-[27px] text-[#212121]">ShopHub Seller Center</span>
            </div>

            <h1 className="[font-family:'Inter',sans-serif] font-bold text-[26px] leading-[39px] text-[#212121] mt-6 mb-0">Create Seller Account</h1>
            <p className="[font-family:'Inter',sans-serif] font-normal text-[14px] leading-[21px] text-[#757575] mt-[6px] mb-0">
              Get started in minutes. Complete your profile after signup.
            </p>

            {/* Form fields */}
            <div className="flex flex-col gap-4 w-[384px] mt-7 max-md:w-full">

              {/* Your Name */}
              <div className={fieldClass}>
                <label className={labelClass}>Your Name</label>
                <div className={inputWrapClass}>
                  <span className={inputIconClass}>
                    <Image src="/merchanticons/Container.png" alt="" width={16} height={16} />
                  </span>
                  <input
                    className={inputClass}
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                  />
                </div>
                {errors.name && <p className="auth-error">{errors.name}</p>}
              </div>

              {/* Email Address */}
              <div className={fieldClass}>
                <label className={labelClass}>Email Address</label>
                <div className={inputWrapClass}>
                  <span className={inputIconClass}>
                    <Image src="/merchanticons/Container (1).png" alt="" width={16} height={16} />
                  </span>
                  <input
                    className={inputClass}
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <p className="auth-error">{errors.email}</p>}
              </div>

              {/* Phone Number */}
              <div className={fieldClass}>
                <label className={labelClass}>Phone Number</label>
                <div className={inputWrapClass}>
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-row items-center gap-1 [font-family:'Inter',sans-serif] text-[13px] text-[#757575] z-[1] pointer-events-none">
                    🇮🇳 +91
                  </span>
                  <input
                    className={inputPhoneClass}
                    type="tel"
                    name="phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                  />
                </div>
                {errors.phone && <p className="auth-error">{errors.phone}</p>}
              </div>

              {/* Password */}
              <div className={fieldClass}>
                <label className={labelClass}>Password</label>
                <div className={inputWrapClass}>
                  <span className={inputIconClass}>
                    <Image src="/merchanticons/Container (2).png" alt="" width={16} height={16} />
                  </span>
                  <input
                    className={inputWithRightIconClass}
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Create a password (min. 8 characters)"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={inputRightIconClass}
                    onClick={() => setShowPassword(p => !p)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
                {errors.password && <p className="auth-error">{errors.password}</p>}
                {formData.password && (
                  <div className="flex flex-row gap-1 w-[384px] mt-2 max-md:w-full">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`flex-1 h-[3px] rounded-[4px] ${i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-[#E0E0E0]'}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className={fieldClass}>
                <label className={labelClass}>Confirm Password</label>
                <div className={inputWrapClass}>
                  <span className={inputIconClass}>
                    <Image src="/merchanticons/Container (2).png" alt="" width={16} height={16} />
                  </span>
                  <input
                    className={inputWithRightIconClass}
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={inputRightIconClass}
                    onClick={() => setShowConfirm(p => !p)}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirm ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="auth-error">{errors.confirmPassword}</p>}
              </div>

            </div>

            {/* Terms checkbox */}
            <div className="flex flex-row items-start gap-[10px] mt-5">
              <input
                className="w-4 h-4 mt-[2px] shrink-0 accent-[#2874F0] cursor-pointer"
                type="checkbox"
                name="agreed"
                id="agreed"
                checked={formData.agreed}
                onChange={handleChange}
              />
              <label htmlFor="agreed" className="[font-family:'Inter',sans-serif] font-normal text-[13px] leading-[20px] text-[#424242]">
                I agree to ShopHub&apos;s{' '}
                <Link href="/seller/terms" className={checkboxLinkClass}>Seller Terms</Link>
                {' '}&amp;{' '}
                <Link href="/seller/policies" className={checkboxLinkClass}>Marketplace Policies</Link>
              </label>
            </div>

            {/* Submit */}
            <button
              className="flex flex-row justify-center items-center gap-2 w-[384px] h-[52px] bg-[linear-gradient(135deg,#FF9F00_0%,#F57C00_100%)] shadow-[0px_2px_8px_rgba(255,159,0,0.2)] rounded-[10px] border-none cursor-pointer mt-6 [font-family:'Inter',sans-serif] font-semibold text-[16px] leading-[24px] text-white [transition:opacity_0.2s] hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed max-md:w-full"
              onClick={handleSubmit}
              disabled={!formData.agreed || isLoading}
            >
              {isLoading ? 'Creating Account…' : 'Create Seller Account →'}
            </button>

            {/* Sign in link */}
            <p className="[font-family:'Inter',sans-serif] font-normal text-[14px] leading-[21px] text-[#757575] text-center w-[384px] mt-6 max-md:w-full">
              Already have an account?{' '}
              <Link href="/seller/login" className="text-[#2874F0] font-semibold no-underline hover:underline">Sign In</Link>
            </p>

          </div>

          {/* Trust badges below card */}
          <div className="flex flex-row items-center gap-8 w-full mt-7 justify-center max-md:flex-wrap max-md:gap-4 max-md:justify-center">
            <div className={badgeItemClass}>
              <div className={badgeIconWrapClass}>
                <Image src="/merchanticons/Container.png" alt="Secure" width={16} height={16} className={badgeImgClass} />
              </div>
              <div className={badgeTextWrapClass}>
                <span className={badgeTitleClass}>Secure</span>
                <span className={badgeSubtitleClass}>Signup</span>
              </div>
            </div>
            <div className={badgeItemClass}>
              <div className={badgeIconWrapClass}>
                <Image src="/merchanticons/Container (1).png" alt="Free" width={16} height={16} className={badgeImgClass} />
              </div>
              <div className={badgeTextWrapClass}>
                <span className={badgeTitleClass}>Free to</span>
                <span className={badgeSubtitleClass}>List</span>
              </div>
            </div>
            <div className={badgeItemClass}>
              <div className={badgeIconWrapClass}>
                <Image src="/merchanticons/Container (2).png" alt="Get Paid" width={16} height={16} className={badgeImgClass} />
              </div>
              <div className={badgeTextWrapClass}>
                <span className={badgeTitleClass}>Get Paid</span>
                <span className={badgeSubtitleClass}>Fast</span>
              </div>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
