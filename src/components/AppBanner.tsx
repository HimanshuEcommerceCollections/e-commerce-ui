export default function AppBanner() {
  return (
    <div className="app-banner">
      <div className="app-phone-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      </div>
      <div>
        <h3 className="app-banner-title">Get the Nexus App</h3>
        <p className="app-banner-sub">Shop on the go with live tracking &amp; instant notifications</p>
        <div style={{ display: "flex", marginTop: 12 }}>
          <button className="app-btn-primary">App Store</button>
          <button className="app-btn-secondary">Google Play</button>
        </div>
      </div>
    </div>
  );
}
