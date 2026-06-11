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
    <div className="seller-profile__page">

      {/* ── Top navbar ── */}
      <nav className="seller-profile__topbar">
        <div className="seller-profile__topbar-logo">
          <div className="seller-profile__topbar-logo-icon">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M2.5 3.5H4.5L7 14H16L18.5 6H7" stroke="#FFFFFF" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="8.5" cy="17" r="1.2" stroke="#FFFFFF" strokeWidth="1.67"/>
              <circle cx="14.5" cy="17" r="1.2" stroke="#FFFFFF" strokeWidth="1.67"/>
            </svg>
          </div>
          <span className="seller-profile__topbar-logo-name">ShopHub</span>
          <span className="seller-profile__topbar-badge">Seller Center</span>
        </div>

        <span className="seller-profile__topbar-title">Complete Your Seller Profile</span>

        <div className="seller-profile__topbar-actions">
          <span className="seller-profile__topbar-step">Step 2 of 4</span>
          <button className="seller-profile__topbar-save-btn">Save &amp; Exit</button>
        </div>
      </nav>

      {/* ── Progress bar ── */}
      <div className="seller-profile__progress-bar">
        <div className="seller-profile__progress-fill" />
      </div>

      {/* ── Scrollable content ── */}
      <div className="seller-profile__content">

        {/* Step indicator */}
        <div className="seller-profile__steps">
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                flex: i < steps.length - 1 ? 1 : undefined,
              }}
            >
              <div className="seller-profile__step-item">
                <div
                  className="seller-profile__step-circle"
                  style={{
                    background: step.done ? '#4CAF50' : step.active ? '#FF9F00' : '#E0E0E0',
                    color: step.done || step.active ? '#FFFFFF' : '#9E9E9E',
                  }}
                >
                  {step.done
                    ? <Check size={16} />
                    : <span style={{ fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 14 }}>{i + 1}</span>}
                </div>
                <span
                  className="seller-profile__step-label"
                  style={{
                    color: step.done ? '#4CAF50' : step.active ? '#FF9F00' : '#9E9E9E',
                    fontWeight: step.active ? 600 : 400,
                    width: 96,
                  }}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="seller-profile__step-connector">
                  <div
                    className="seller-profile__step-line"
                    style={{ background: step.done ? '#4CAF50' : '#E0E0E0' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Success banner */}
        <div className="seller-profile__success-banner">
          <span style={{ fontSize: 14 }}>🎉</span>
          <span className="seller-profile__success-text">
            Account created! Complete your profile to start selling
          </span>
        </div>

        {/* ── Form card ── */}
        <div className="seller-profile__card">

          <h1 className="seller-profile__card-title">Business Information</h1>
          <p className="seller-profile__card-subtitle">
            Provide your business details to set up your seller account. This information is used for verification.
          </p>

          {/* ── Section 1: Business Details ── */}
          <div style={{ width: '100%', marginTop: 36 }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span className="seller-profile__section-title">Business Details</span>
              <span className="seller-profile__section-note">Required</span>
            </div>
            <p className="seller-profile__section-hint">Enter your official business registration details.</p>
          </div>

          {/* Business Type */}
          <div style={{ width: '100%', marginTop: 20 }}>
            <label className="seller-profile__label">Business Type</label>
            <div className="seller-profile__input-wrap">
              <select
                className="seller-profile__input seller-profile__input--icon-right"
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
              <span className="seller-profile__input-icon-right">
                <ChevronDown size={16} />
              </span>
            </div>
          </div>

          {/* Legal Name + Trade Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, width: '100%', marginTop: 16 }}>
            <div>
              <label className="seller-profile__label">Legal Business Name</label>
              <div className="seller-profile__input-wrap">
                <input
                  className="seller-profile__input seller-profile__input--icon-right"
                  type="text"
                  name="legalName"
                  placeholder="As per registration"
                  value={formData.legalName}
                  onChange={handleChange}
                />
                <span className="seller-profile__input-icon-right"><Building2 size={16} /></span>
              </div>
            </div>
            <div>
              <label className="seller-profile__label">Trade / Brand Name</label>
              <div className="seller-profile__input-wrap">
                <input
                  className="seller-profile__input seller-profile__input--icon-right"
                  type="text"
                  name="tradeName"
                  placeholder="Name customers see"
                  value={formData.tradeName}
                  onChange={handleChange}
                />
                <span className="seller-profile__input-icon-right"><User size={16} /></span>
              </div>
            </div>
          </div>

          {/* Phone + Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, width: '100%', marginTop: 16 }}>
            <div>
              <label className="seller-profile__label">Business Phone</label>
              <div className="seller-profile__input-wrap">
                <input
                  className="seller-profile__input seller-profile__input--icon-right"
                  type="tel"
                  name="businessPhone"
                  placeholder="+91 98765 43210"
                  value={formData.businessPhone}
                  onChange={handleChange}
                />
                <span className="seller-profile__input-icon-right"><Phone size={16} /></span>
              </div>
            </div>
            <div>
              <label className="seller-profile__label">Business Email</label>
              <div className="seller-profile__input-wrap">
                <input
                  className="seller-profile__input seller-profile__input--icon-right"
                  type="email"
                  name="businessEmail"
                  placeholder="business@example.com"
                  value={formData.businessEmail}
                  onChange={handleChange}
                />
                <span className="seller-profile__input-icon-right"><Mail size={16} /></span>
              </div>
            </div>
          </div>

          {/* Tax ID + Year Established */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, width: '100%', marginTop: 16 }}>
            <div>
              <label className="seller-profile__label">GST / Tax ID</label>
              <div className="seller-profile__input-wrap">
                <input
                  className="seller-profile__input seller-profile__input--icon-right"
                  type="text"
                  name="taxId"
                  placeholder="22AAAAA0000A1Z5"
                  value={formData.taxId}
                  onChange={handleChange}
                />
                <span className="seller-profile__input-icon-right"><FileText size={16} /></span>
              </div>
            </div>
            <div>
              <label className="seller-profile__label">Year Established</label>
              <div className="seller-profile__input-wrap">
                <input
                  className="seller-profile__input seller-profile__input--icon-right"
                  type="text"
                  name="yearEstablished"
                  placeholder="e.g. 2015"
                  value={formData.yearEstablished}
                  onChange={handleChange}
                />
                <span className="seller-profile__input-icon-right"><Calendar size={16} /></span>
              </div>
            </div>
          </div>

          <div className="seller-profile__divider" />

          {/* ── Section 2: Business Address ── */}
          <div style={{ width: '100%', marginTop: 36 }}>
            <span className="seller-profile__section-title">Business Address</span>
            <p className="seller-profile__section-hint" style={{ marginTop: 6 }}>
              Your registered business or pickup location.
            </p>
          </div>

          <div style={{ width: '100%', marginTop: 20 }}>
            <label className="seller-profile__label">Street Address</label>
            <div className="seller-profile__input-wrap">
              <input
                className="seller-profile__input seller-profile__input--icon-right"
                type="text"
                name="address"
                placeholder="Building, street, area"
                value={formData.address}
                onChange={handleChange}
              />
              <span className="seller-profile__input-icon-right"><MapPin size={16} /></span>
            </div>
          </div>

          {/* City + State + ZIP */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, width: '100%', marginTop: 16 }}>
            <div>
              <label className="seller-profile__label">City</label>
              <input
                className="seller-profile__input"
                type="text"
                name="city"
                placeholder="Mumbai"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="seller-profile__label">State</label>
              <div className="seller-profile__input-wrap">
                <select
                  className="seller-profile__input seller-profile__input--icon-right"
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
                <span className="seller-profile__input-icon-right"><ChevronDown size={16} /></span>
              </div>
            </div>
            <div>
              <label className="seller-profile__label">PIN Code</label>
              <input
                className="seller-profile__input"
                type="text"
                name="zip"
                placeholder="400001"
                value={formData.zip}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="seller-profile__divider" />

          {/* ── Section 3: Store Description & Branding ── */}
          <div style={{ width: '100%', marginTop: 36 }}>
            <span className="seller-profile__section-title">Store Description &amp; Branding</span>
            <p className="seller-profile__section-hint" style={{ marginTop: 6 }}>
              Help buyers discover what makes your store unique.
            </p>
          </div>

          <div style={{ width: '100%', marginTop: 20 }}>
            <label className="seller-profile__label">Store Description</label>
            <textarea
              className="seller-profile__textarea"
              name="description"
              placeholder="Tell buyers about your business, products, and what sets you apart…"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', gap: 16, width: '100%', marginTop: 16 }}>
            <div className="seller-profile__upload-zone">
              <div className="seller-profile__upload-icon">
                <Upload size={20} />
              </div>
              <span className="seller-profile__upload-label">Store Logo</span>
              <span className="seller-profile__upload-sublabel">PNG, JPG up to 2MB · 200×200px</span>
            </div>
            <div className="seller-profile__upload-zone">
              <div className="seller-profile__upload-icon">
                <Upload size={20} />
              </div>
              <span className="seller-profile__upload-label">Store Banner</span>
              <span className="seller-profile__upload-sublabel">PNG, JPG up to 5MB · 1200×300px</span>
            </div>
          </div>

          <div className="seller-profile__divider" />

          {/* ── Section 4: Banking Information ── */}
          <div style={{ width: '100%', marginTop: 36 }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span className="seller-profile__section-title">Banking Information</span>
              <span className="seller-profile__section-note">Required for payouts</span>
            </div>
            <p className="seller-profile__section-hint">Your payments will be deposited to this account.</p>
          </div>

          {/* Account Holder + Bank Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, width: '100%', marginTop: 20 }}>
            <div>
              <label className="seller-profile__label">Account Holder Name</label>
              <div className="seller-profile__input-wrap">
                <input
                  className="seller-profile__input seller-profile__input--icon-right"
                  type="text"
                  name="accountHolderName"
                  placeholder="As per bank records"
                  value={formData.accountHolderName}
                  onChange={handleChange}
                />
                <span className="seller-profile__input-icon-right"><User size={16} /></span>
              </div>
            </div>
            <div>
              <label className="seller-profile__label">Bank Name</label>
              <div className="seller-profile__input-wrap">
                <input
                  className="seller-profile__input seller-profile__input--icon-right"
                  type="text"
                  name="bankName"
                  placeholder="e.g. HDFC Bank"
                  value={formData.bankName}
                  onChange={handleChange}
                />
                <span className="seller-profile__input-icon-right"><Building2 size={16} /></span>
              </div>
            </div>
          </div>

          {/* Account Type */}
          <div style={{ width: '100%', marginTop: 16 }}>
            <label className="seller-profile__label">Account Type</label>
            <div className="seller-profile__input-wrap">
              <select
                className="seller-profile__input seller-profile__input--icon-right"
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                style={{ cursor: 'pointer' }}
              >
                <option value="">Select account type</option>
                <option value="savings">Savings</option>
                <option value="current">Current / Checking</option>
              </select>
              <span className="seller-profile__input-icon-right"><ChevronDown size={16} /></span>
            </div>
          </div>

          {/* Account Number + IFSC */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, width: '100%', marginTop: 16 }}>
            <div>
              <label className="seller-profile__label">Account Number</label>
              <div className="seller-profile__input-wrap">
                <input
                  className="seller-profile__input seller-profile__input--icon-right"
                  type="text"
                  name="accountNumber"
                  placeholder="Enter account number"
                  value={formData.accountNumber}
                  onChange={handleChange}
                />
                <span className="seller-profile__input-icon-right"><CreditCard size={16} /></span>
              </div>
            </div>
            <div>
              <label className="seller-profile__label">IFSC / Routing Code</label>
              <div className="seller-profile__input-wrap">
                <input
                  className="seller-profile__input seller-profile__input--icon-right"
                  type="text"
                  name="routingNumber"
                  placeholder="e.g. HDFC0001234"
                  value={formData.routingNumber}
                  onChange={handleChange}
                />
                <span className="seller-profile__input-icon-right"><FileText size={16} /></span>
              </div>
            </div>
          </div>

          {/* Encryption notice */}
          <div className="seller-profile__enc-notice" style={{ width: '100%', marginTop: 20 }}>
            <Lock size={14} color="#9E9E9E" style={{ flexShrink: 0, marginTop: 2 }} />
            <span className="seller-profile__enc-text">
              Your banking information is encrypted with 256-bit SSL and stored securely. ShopHub uses
              this only for processing seller payouts and never shares it with third parties.
            </span>
          </div>

        </div>{/* end card */}
      </div>{/* end content */}

      {/* ── Bottom footer bar ── */}
      <div className="seller-profile__bottombar">
        <button className="seller-profile__back-btn">
          <ChevronLeft size={16} />
          Back
        </button>

        <div className="seller-profile__enc-footer">
          <Shield size={14} color="#9E9E9E" />
          <span className="seller-profile__enc-footer-text">256-bit SSL encrypted</span>
        </div>

        <button className="seller-profile__continue-btn">
          Save &amp; Continue
          <ChevronRight size={16} />
        </button>
      </div>

    </div>
  );
}
