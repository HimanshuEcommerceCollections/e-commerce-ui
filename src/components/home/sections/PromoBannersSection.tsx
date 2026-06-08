import Image from 'next/image';

const banners = [
  {
    image: '/displayimages/Image (Electronics Event).png',
    label: 'MEGA SALE',
    heading: 'Electronics Event',
    subtext: 'Up to 60% off tech essentials',
    buttonText: 'Shop Now',
  },
  {
    image: '/displayimages/Image (Home Makeover).png',
    label: 'SUMMER REFRESH',
    heading: 'Home Makeover',
    subtext: 'Transform your space',
    buttonText: 'Explore',
  },
];

export default function PromoBannersSection() {
  return (
    <section className="promo-section">
      <div className="promo-container">
        {banners.map((banner, index) => (
          <div className="promo-card" key={index}>
            <Image
              src={banner.image}
              alt={banner.heading}
              fill
              style={{ objectFit: 'cover' }}
            />
            <div className="promo-card-overlay" />
            <div className="promo-card-content">
              <p className="promo-card-label">{banner.label}</p>
              <h2 className="promo-card-heading">{banner.heading}</h2>
              <p className="promo-card-subtext">{banner.subtext}</p>
              <button className="promo-card-btn">{banner.buttonText}</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
