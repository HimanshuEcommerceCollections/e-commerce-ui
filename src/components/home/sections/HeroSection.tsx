import HeroLeft from './HeroLeft';
import HeroRight from './HeroRight';

export default function HeroSection() {
  return (
    <section className="w-full pt-[57.67px] px-[48.06px] pb-12 max-md:px-4 max-md:py-6">
      <div className="relative flex w-full flex-row items-start gap-[28.83px] max-lg:flex-col">
        <HeroLeft />
        <HeroRight />
      </div>
    </section>
  );
}
