import Image from 'next/image';

const features = [
  'Real-time order tracking',
  'Personalized recommendations',
  'Faster checkout',
  'App-only exclusive deals',
];

export default function DownloadAppSection() {
  return (
    <section className="download-section">
      <div className="download-container">
        <div className="download-card">
          <div className="download-left">
            <h2 className="download-heading">Download Our App</h2>
            <p className="download-subtext">Shop on the go with exclusive app-only deals</p>

            <div className="download-features">
              {features.map((text, index) => (
                <div className="download-feature-row" key={index}>
                  <div className="download-feature-icon-circle">
                    <Image src="/appIcons/tick.png" alt="tick" width={24} height={24} />
                  </div>
                  <span className="download-feature-text">{text}</span>
                </div>
              ))}
            </div>

            <div className="download-buttons-row">
              <button className="download-store-btn">
                <Image src="/appIcons/appleIcon.png" alt="App Store" width={29} height={29} />
                <div className="download-btn-text-group">
                  <span className="download-btn-top-text">Download on the</span>
                  <span className="download-btn-main-text">App Store</span>
                </div>
              </button>

              <button className="download-store-btn">
                <Image src="/appIcons/mobilescreen.png" alt="Google Play" width={29} height={29} />
                <div className="download-btn-text-group">
                  <span className="download-btn-top-text">Get it on</span>
                  <span className="download-btn-main-text">Google Play</span>
                </div>
              </button>
            </div>
          </div>

          <div className="download-right">
            <div className="download-app-image">
              <Image
                src="/appImages/Image (Mobile App).png"
                alt="Mobile App"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
