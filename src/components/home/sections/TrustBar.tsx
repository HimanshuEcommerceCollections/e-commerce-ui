export default function TrustBar() {
  return (
    <div className="trust-bar">
      <div className="trust-bar-inner">

        {/* Fast Shipping */}
        <div className="trust-item">
          <div className="trust-item-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="1"/>
              <path d="M16 8h4l3 5v3h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <div className="trust-item-text">
            <span className="trust-item-title">Fast Shipping</span>
            <span className="trust-item-subtitle">Free on orders $50+</span>
          </div>
        </div>

        {/* Secure Payments */}
        <div className="trust-item">
          <div className="trust-item-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div className="trust-item-text">
            <span className="trust-item-title">Secure Payments</span>
            <span className="trust-item-subtitle">100% protected</span>
          </div>
        </div>

        {/* Easy Returns */}
        <div className="trust-item">
          <div className="trust-item-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </div>
          <div className="trust-item-text">
            <span className="trust-item-title">Easy Returns</span>
            <span className="trust-item-subtitle">30-day guarantee</span>
          </div>
        </div>

        {/* 24/7 Support */}
        <div className="trust-item">
          <div className="trust-item-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
              <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
            </svg>
          </div>
          <div className="trust-item-text">
            <span className="trust-item-title">24/7 Support</span>
            <span className="trust-item-subtitle">Always here to help</span>
          </div>
        </div>

        {/* US Customer Service */}
        <div className="trust-item">
          <div className="trust-item-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div className="trust-item-text">
            <span className="trust-item-title">US Customer Service</span>
            <span className="trust-item-subtitle">Based in America</span>
          </div>
        </div>

      </div>
    </div>
  );
}
