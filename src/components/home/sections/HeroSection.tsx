import HeroLeft from './HeroLeft';
import HeroRight from './HeroRight';

export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-inner">
        <HeroLeft />
        <HeroRight />
      </div>
    </section>
  );
}
