'use client';

import { useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Lock,
  Upload,
  MapPin,
  Phone,
  Mail,
  User,
  FileText,
  Calendar,
  Building2,
  CreditCard,
  Shield,
} from 'lucide-react';

interface FormData {
  businessType: string;
  legalName: string;
  tradeName: string;
  businessPhone: string;
  businessEmail: string;
  taxId: string;
  yearEstablished: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  description: string;
  accountHolderName: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  routingNumber: string;
}

/* ── Reusable input wrapper classes ──────────────────────────────── */
const INPUT_CLS =
  'w-full h-12 bg-[#FAFAFA] border-[0.8px] border-[#E0E0E0] rounded-[10px] px-4 pr-11 [font-family:\'Inter\',sans-serif] font-normal text-[14px] text-[#212121] outline-none appearance-none placeholder:text-[rgba(33,33,33,0.5)] focus:border-[#2874F0]';

const LABEL_CLS =
  '[font-family:\'Inter\',sans-serif] font-medium text-[13px] leading-[20px] text-[#424242] mb-[6px] block';

/* ── Icon adornment ────────────────────────────────────────────── */
function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#9E9E9E] pointer-events-none">
      {children}
    </span>
  );
}

export default function SellerProfileClient() {
  const [formData, setFormData] = useState<FormData>({
    businessType: '',
    legalName: '',
    tradeName: '',
    businessPhone: '',
    businessEmail: '',
    taxId: '',
    yearEstablished: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    description: '',
    accountHolderName: '',
    bankName: '',
    accountType: '',
    accountNumber: '',
    routingNumber: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const steps = [
    { label: 'Account Created', done: true,  active: false },
    { label: 'Business Info',   done: false, active: true  },
    { label: 'Bank Details',    done: false, active: false },
    { label: 'Verification',    done: false, active: false },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-[100px]">

      {/* ── Top navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex flex-row justify-between items-center px-4 sm:px-8 lg:px-12 h-14 sm:h-16 bg-white border-b-[0.8px] border-[#E8EDF5]">

        {/* Logo */}
        <div className="flex flex-row items-center gap-2 shrink-0">
          <div className="flex justify-center items-center w-8 h-8 sm:w-9 sm:h-9 bg-[#2874F0] rounded-[18px] shrink-0">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M2.5 3.5H4.5L7 14H16L18.5 6H7" stroke="#FFFFFF" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="8.5" cy="17" r="1.2" stroke="#FFFFFF" strokeWidth="1.67"/>
              <circle cx="14.5" cy="17" r="1.2" stroke="#FFFFFF" strokeWidth="1.67"/>
            </svg>
          </div>
          <span className="[font-family:'Inter',sans-serif] font-bold text-[15px] sm:text-[18px] leading-[27px] tracking-[-0.3px] text-[#212121]">ShopHub</span>
          <span className="hidden sm:inline bg-[#FF9F00] rounded-[20px] px-[10px] py-[3px] [font-family:'Inter',sans-serif] font-semibold text-[11px] sm:text-[12px] text-[#FFFFFF]">Seller Center</span>
        </div>

        {/* Center title — hidden on very small screens */}
        <span className="hidden md:block absolute left-1/2 -translate-x-1/2 [font-family:'Inter',sans-serif] font-semibold text-[15px] sm:text-[18px] leading-[27px] text-[#212121] whitespace-nowrap">
          Complete Your Seller Profile
        </span>

        {/* Right actions */}
        <div className="flex flex-row items-center gap-2 sm:gap-4 shrink-0">
          <span className="[font-family:'Inter',sans-serif] font-normal text-[12px] sm:text-[14px] leading-[21px] text-[#757575]">Step 2 of 4</span>
          <button className="border-[0.8px] border-[#E0E0E0] rounded-[8px] px-3 sm:px-4 py-[6px] sm:py-[7px] [font-family:'Inter',sans-serif] font-medium text-[12px] sm:text-[13px] leading-[20px] text-[#424242] bg-transparent cursor-pointer whitespace-nowrap">
            Save &amp; Exit
          </button>
        </div>
      </nav>

      {/* ── Progress bar ── */}
      <div className="fixed top-14 sm:top-16 left-0 right-0 z-50 h-1 bg-[#E0E0E0]">
        <div className="w-1/2 h-1 bg-[linear-gradient(90deg,#FF9F00_0%,#F57C00_100%)]" />
      </div>

      {/* ── Scrollable content ── */}
      <div className="pt-[60px] sm:pt-[68px] flex flex-col items-center px-3 sm:px-6">

        {/* Page title for mobile (since center title is hidden) */}
        <p className="md:hidden mt-4 [font-family:'Inter',sans-serif] font-semibold text-[15px] text-[#212121] text-center">
          Complete Your Seller Profile
        </p>

        {/* ── Step indicator ── */}
        <div className="flex flex-row items-start pt-5 sm:pt-8 gap-0 w-full max-w-[1100px] overflow-x-auto pb-1">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex flex-row items-start"
              style={{ flex: i < steps.length - 1 ? 1 : undefined }}
            >
              <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                <div
                  className="flex justify-center items-center w-7 h-7 sm:w-9 sm:h-9 rounded-[18px] shrink-0"
                  style={{
                    background: step.done ? '#4CAF50' : step.active ? '#FF9F00' : '#E0E0E0',
                    color: step.done || step.active ? '#FFFFFF' : '#9E9E9E',
                  }}
                >
                  {step.done
                    ? <Check size={13} />
                    : <span style={{ fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 12 }}>{i + 1}</span>}
                </div>
                <span
                  className="[font-family:'Inter',sans-serif] text-[10px] sm:text-[13px] leading-[16px] sm:leading-[20px] text-center"
                  style={{
                    color: step.done ? '#4CAF50' : step.active ? '#FF9F00' : '#9E9E9E',
                    fontWeight: step.active ? 600 : 400,
                    width: 64,
                  }}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex flex-row items-center pb-7 flex-1">
                  <div
                    className="min-w-[20px] flex-1 h-0.5"
                    style={{ background: step.done ? '#4CAF50' : '#E0E0E0' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Success banner */}
        <div className="flex flex-row items-center px-3 sm:px-4 py-[6px] gap-[6px] bg-[#FFF8E1] border-[0.8px] border-[#FF9F00] rounded-[20px] mt-4 sm:mt-5 self-center w-fit max-w-full">
          <span style={{ fontSize: 13 }}>🎉</span>
          <span className="[font-family:'Inter',sans-serif] font-medium text-[12px] sm:text-[13px] leading-[20px] text-[#92400E] text-center">
            Account created! Complete your profile to start selling
          </span>
        </div>

        {/* ── Form card ── */}
        <div className="flex flex-col items-start py-6 sm:py-10 lg:py-12 px-4 sm:px-8 lg:px-14 w-full max-w-[1400px] bg-white shadow-[0px_8px_32px_rgba(0,0,0,0.08)] rounded-[16px] sm:rounded-[20px] mt-5 sm:mt-7">

          <h1 className="[font-family:'Inter',sans-serif] font-bold text-[18px] sm:text-[22px] leading-[33px] text-[#212121]">Business Information</h1>
          <p className="[font-family:'Inter',sans-serif] font-normal text-[13px] sm:text-[14px] leading-[21px] text-[#757575] mt-[6px]">
            Provide your business details to set up your seller account. This information is used for verification.
          </p>

          {/* ── Section 1: Business Details ── */}
          <div className="w-full mt-8 sm:mt-9">
            <div className="flex flex-row flex-wrap items-center gap-2 mb-1">
              <span className="[font-family:'Inter',sans-serif] font-semibold text-[15px] sm:text-[16px] leading-[24px] text-[#212121]">Business Details</span>
              <span className="inline-flex items-center px-[10px] py-[2px] bg-[#FFF8E1] border-[0.8px] border-[#FF9F00] rounded-[20px] [font-family:'Inter',sans-serif] font-medium text-[11px] sm:text-[12px] leading-[18px] text-[#92400E]">Required</span>
            </div>
            <p className="[font-family:'Inter',sans-serif] font-normal text-[12px] sm:text-[13px] leading-[20px] text-[#9E9E9E] mt-[6px]">Enter your official business registration details.</p>
          </div>

          {/* Business Type */}
          <div className="w-full mt-5">
            <label className={LABEL_CLS}>Business Type</label>
            <div className="relative">
              <select
                className={INPUT_CLS}
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                style={{ cursor: 'pointer' }}
              >
                <option value="">Select business type</option>
                <option value="individual">Individual / Sole Proprietor</option>
                <option value="partnership">Partnership</option>
                <option value="llp">LLP</option>
                <option value="private_limited">Private Limited</option>
                <option value="public_limited">Public Limited</option>
              </select>
              <FieldIcon><ChevronDown size={16} /></FieldIcon>
            </div>
          </div>

          {/* Legal Name + Trade Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full mt-4">
            <div>
              <label className={LABEL_CLS}>Legal Business Name</label>
              <div className="relative">
                <input className={INPUT_CLS} type="text" name="legalName" placeholder="As per registration" value={formData.legalName} onChange={handleChange} />
                <FieldIcon><Building2 size={16} /></FieldIcon>
              </div>
            </div>
            <div>
              <label className={LABEL_CLS}>Trade / Brand Name</label>
              <div className="relative">
                <input className={INPUT_CLS} type="text" name="tradeName" placeholder="Name customers see" value={formData.tradeName} onChange={handleChange} />
                <FieldIcon><User size={16} /></FieldIcon>
              </div>
            </div>
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full mt-4">
            <div>
              <label className={LABEL_CLS}>Business Phone</label>
              <div className="relative">
                <input className={INPUT_CLS} type="tel" name="businessPhone" placeholder="+91 98765 43210" value={formData.businessPhone} onChange={handleChange} />
                <FieldIcon><Phone size={16} /></FieldIcon>
              </div>
            </div>
            <div>
              <label className={LABEL_CLS}>Business Email</label>
              <div className="relative">
                <input className={INPUT_CLS} type="email" name="businessEmail" placeholder="business@example.com" value={formData.businessEmail} onChange={handleChange} />
                <FieldIcon><Mail size={16} /></FieldIcon>
              </div>
            </div>
          </div>

          {/* Tax ID + Year Established */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full mt-4">
            <div>
              <label className={LABEL_CLS}>GST / Tax ID</label>
              <div className="relative">
                <input className={INPUT_CLS} type="text" name="taxId" placeholder="22AAAAA0000A1Z5" value={formData.taxId} onChange={handleChange} />
                <FieldIcon><FileText size={16} /></FieldIcon>
              </div>
            </div>
            <div>
              <label className={LABEL_CLS}>Year Established</label>
              <div className="relative">
                <input className={INPUT_CLS} type="text" name="yearEstablished" placeholder="e.g. 2015" value={formData.yearEstablished} onChange={handleChange} />
                <FieldIcon><Calendar size={16} /></FieldIcon>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-[#F0F0F0] mt-8 sm:mt-9" />

          {/* ── Section 2: Business Address ── */}
          <div className="w-full mt-7 sm:mt-9">
            <span className="[font-family:'Inter',sans-serif] font-semibold text-[15px] sm:text-[16px] leading-[24px] text-[#212121]">Business Address</span>
            <p className="[font-family:'Inter',sans-serif] font-normal text-[12px] sm:text-[13px] leading-[20px] text-[#9E9E9E] mt-[6px]">
              Your registered business or pickup location.
            </p>
          </div>

          {/* Street Address */}
          <div className="w-full mt-5">
            <label className={LABEL_CLS}>Street Address</label>
            <div className="relative">
              <input className={INPUT_CLS} type="text" name="address" placeholder="Building, street, area" value={formData.address} onChange={handleChange} />
              <FieldIcon><MapPin size={16} /></FieldIcon>
            </div>
          </div>

          {/* City + State + ZIP — stacks to 1-col on mobile, 3-col on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-4">
            <div>
              <label className={LABEL_CLS}>City</label>
              <input
                className="w-full h-12 bg-[#FAFAFA] border-[0.8px] border-[#E0E0E0] rounded-[10px] px-4 [font-family:'Inter',sans-serif] font-normal text-[14px] text-[#212121] outline-none appearance-none placeholder:text-[rgba(33,33,33,0.5)] focus:border-[#2874F0]"
                type="text" name="city" placeholder="Mumbai" value={formData.city} onChange={handleChange}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>State</label>
              <div className="relative">
                <select
                  className={INPUT_CLS}
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">Select state</option>
                  <option value="MH">Maharashtra</option>
                  <option value="DL">Delhi</option>
                  <option value="KA">Karnataka</option>
                  <option value="TN">Tamil Nadu</option>
                  <option value="GJ">Gujarat</option>
                  <option value="UP">Uttar Pradesh</option>
                  <option value="RJ">Rajasthan</option>
                  <option value="WB">West Bengal</option>
                  <option value="TS">Telangana</option>
                </select>
                <FieldIcon><ChevronDown size={16} /></FieldIcon>
              </div>
            </div>
            <div>
              <label className={LABEL_CLS}>PIN Code</label>
              <input
                className="w-full h-12 bg-[#FAFAFA] border-[0.8px] border-[#E0E0E0] rounded-[10px] px-4 [font-family:'Inter',sans-serif] font-normal text-[14px] text-[#212121] outline-none appearance-none placeholder:text-[rgba(33,33,33,0.5)] focus:border-[#2874F0]"
                type="text" name="zip" placeholder="400001" value={formData.zip} onChange={handleChange}
              />
            </div>
          </div>

          <div className="w-full h-px bg-[#F0F0F0] mt-8 sm:mt-9" />

          {/* ── Section 3: Store Description & Branding ── */}
          <div className="w-full mt-7 sm:mt-9">
            <span className="[font-family:'Inter',sans-serif] font-semibold text-[15px] sm:text-[16px] leading-[24px] text-[#212121]">Store Description &amp; Branding</span>
            <p className="[font-family:'Inter',sans-serif] font-normal text-[12px] sm:text-[13px] leading-[20px] text-[#9E9E9E] mt-[6px]">
              Help buyers discover what makes your store unique.
            </p>
          </div>

          {/* Store description */}
          <div className="w-full mt-5">
            <label className={LABEL_CLS}>Store Description</label>
            <textarea
              className="w-full h-24 bg-[#FAFAFA] border-[0.8px] border-[#E0E0E0] rounded-[10px] px-4 py-3 [font-family:'Inter',sans-serif] font-normal text-[14px] text-[#212121] outline-none resize-none placeholder:text-[rgba(33,33,33,0.5)] focus:border-[#2874F0]"
              name="description"
              placeholder="Tell buyers about your business, products, and what sets you apart…"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Upload zones — stack on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-4">
            <div className="flex flex-col items-center px-6 py-6 sm:py-8 gap-2 bg-[#FAFAFA] border-[1.6px] border-dashed border-[#E0E0E0] rounded-xl cursor-pointer hover:border-[#FF9F00] transition-[border-color] duration-200">
              <div className="flex justify-center items-center w-10 h-10 sm:w-11 sm:h-11 bg-[#FF9F00] rounded-[22px] text-[#FFFFFF]">
                <Upload size={18} />
              </div>
              <span className="[font-family:'Inter',sans-serif] font-semibold text-[13px] leading-[20px] text-[#212121] text-center">Store Logo</span>
              <span className="[font-family:'Inter',sans-serif] font-normal text-[12px] leading-[18px] text-[#9E9E9E] text-center">PNG, JPG up to 2MB · 200×200px</span>
            </div>
            <div className="flex flex-col items-center px-6 py-6 sm:py-8 gap-2 bg-[#FAFAFA] border-[1.6px] border-dashed border-[#E0E0E0] rounded-xl cursor-pointer hover:border-[#FF9F00] transition-[border-color] duration-200">
              <div className="flex justify-center items-center w-10 h-10 sm:w-11 sm:h-11 bg-[#FF9F00] rounded-[22px] text-[#FFFFFF]">
                <Upload size={18} />
              </div>
              <span className="[font-family:'Inter',sans-serif] font-semibold text-[13px] leading-[20px] text-[#212121] text-center">Store Banner</span>
              <span className="[font-family:'Inter',sans-serif] font-normal text-[12px] leading-[18px] text-[#9E9E9E] text-center">PNG, JPG up to 5MB · 1200×300px</span>
            </div>
          </div>

          <div className="w-full h-px bg-[#F0F0F0] mt-8 sm:mt-9" />

          {/* ── Section 4: Banking Information ── */}
          <div className="w-full mt-7 sm:mt-9">
            <div className="flex flex-row flex-wrap items-center gap-2 mb-1">
              <span className="[font-family:'Inter',sans-serif] font-semibold text-[15px] sm:text-[16px] leading-[24px] text-[#212121]">Banking Information</span>
              <span className="inline-flex items-center px-[10px] py-[2px] bg-[#FFF8E1] border-[0.8px] border-[#FF9F00] rounded-[20px] [font-family:'Inter',sans-serif] font-medium text-[11px] sm:text-[12px] leading-[18px] text-[#92400E]">Required for payouts</span>
            </div>
            <p className="[font-family:'Inter',sans-serif] font-normal text-[12px] sm:text-[13px] leading-[20px] text-[#9E9E9E] mt-[6px]">Your payments will be deposited to this account.</p>
          </div>

          {/* Account Holder + Bank Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full mt-5">
            <div>
              <label className={LABEL_CLS}>Account Holder Name</label>
              <div className="relative">
                <input className={INPUT_CLS} type="text" name="accountHolderName" placeholder="As per bank records" value={formData.accountHolderName} onChange={handleChange} />
                <FieldIcon><User size={16} /></FieldIcon>
              </div>
            </div>
            <div>
              <label className={LABEL_CLS}>Bank Name</label>
              <div className="relative">
                <input className={INPUT_CLS} type="text" name="bankName" placeholder="e.g. HDFC Bank" value={formData.bankName} onChange={handleChange} />
                <FieldIcon><Building2 size={16} /></FieldIcon>
              </div>
            </div>
          </div>

          {/* Account Type */}
          <div className="w-full mt-4">
            <label className={LABEL_CLS}>Account Type</label>
            <div className="relative">
              <select
                className={INPUT_CLS}
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                style={{ cursor: 'pointer' }}
              >
                <option value="">Select account type</option>
                <option value="savings">Savings</option>
                <option value="current">Current / Checking</option>
              </select>
              <FieldIcon><ChevronDown size={16} /></FieldIcon>
            </div>
          </div>

          {/* Account Number + IFSC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full mt-4">
            <div>
              <label className={LABEL_CLS}>Account Number</label>
              <div className="relative">
                <input className={INPUT_CLS} type="text" name="accountNumber" placeholder="Enter account number" value={formData.accountNumber} onChange={handleChange} />
                <FieldIcon><CreditCard size={16} /></FieldIcon>
              </div>
            </div>
            <div>
              <label className={LABEL_CLS}>IFSC / Routing Code</label>
              <div className="relative">
                <input className={INPUT_CLS} type="text" name="routingNumber" placeholder="e.g. HDFC0001234" value={formData.routingNumber} onChange={handleChange} />
                <FieldIcon><FileText size={16} /></FieldIcon>
              </div>
            </div>
          </div>

          {/* Encryption notice */}
          <div className="flex flex-row items-start px-3 sm:px-4 py-3 gap-2 bg-[#F5F7FA] rounded-[10px] w-full mt-5">
            <Lock size={14} color="#9E9E9E" style={{ flexShrink: 0, marginTop: 2 }} />
            <span className="[font-family:'Inter',sans-serif] font-normal text-[12px] leading-[19px] text-[#757575]">
              Your banking information is encrypted with 256-bit SSL and stored securely. ShopHub uses
              this only for processing seller payouts and never shares it with third parties.
            </span>
          </div>

        </div>{/* end card */}
      </div>{/* end content */}

      {/* ── Bottom footer bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-row justify-between items-center px-4 sm:px-8 lg:px-12 h-[64px] sm:h-[72px] bg-white border-t-[0.8px] border-[#E8EDF5] gap-3">

        {/* Back button */}
        <button className="flex flex-row items-center gap-[6px] px-3 sm:px-5 py-2 sm:py-2.5 border-[0.8px] border-[#E0E0E0] rounded-[8px] bg-transparent cursor-pointer [font-family:'Inter',sans-serif] font-medium text-[13px] sm:text-[14px] leading-[21px] text-[#424242] shrink-0">
          <ChevronLeft size={14} />
          Back
        </button>

        {/* SSL badge — hidden on very small screens */}
        <div className="hidden sm:flex flex-row items-center gap-[6px]">
          <Shield size={14} color="#9E9E9E" />
          <span className="[font-family:'Inter',sans-serif] font-normal text-[12px] leading-[18px] text-[#9E9E9E]">256-bit SSL encrypted</span>
        </div>

        {/* Continue button */}
        <button className="flex flex-row items-center gap-2 px-4 sm:px-7 h-10 sm:h-12 bg-[linear-gradient(135deg,#FF9F00_0%,#F57C00_100%)] shadow-[0px_2px_8px_rgba(255,159,0,0.2)] rounded-[10px] border-none cursor-pointer [font-family:'Inter',sans-serif] font-semibold text-[13px] sm:text-[16px] leading-[24px] text-[#FFFFFF] hover:opacity-90 transition-opacity duration-200 shrink-0 whitespace-nowrap">
          Save &amp; Continue
          <ChevronRight size={14} />
        </button>
      </div>

    </div>
  );
}
