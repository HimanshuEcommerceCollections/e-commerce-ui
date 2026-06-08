import AnnouncementBar from "@/components/home/AnnouncementBar";
import Navbar from "@/components/home/Navbar";
import HeroSection from "@/components/home/sections/HeroSection";
import TrustBar from "@/components/home/sections/TrustBar";
import FlashSaleSection from "@/components/home/sections/FlashSaleSection";
import ShopByCategory from "@/components/home/ShopByCategory";
import TrendingProducts from "@/components/home/TrendingProducts";
import PromoBanners from "@/components/home/PromoBanners";
import BestSellers from "@/components/home/BestSellers";
import ShopByRoom from "@/components/home/ShopByRoom";
import PopularBrands from "@/components/home/PopularBrands";
import RecommendedForYou from "@/components/home/RecommendedForYou";
import Testimonials from "@/components/home/Testimonials";
import AppDownload from "@/components/home/AppDownload";
import Newsletter from "@/components/home/Newsletter";
import Footer from "@/components/home/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AnnouncementBar />
      <Navbar />
      <main>
        <HeroSection />
        <TrustBar />
        <FlashSaleSection />
        <ShopByCategory />
        <TrendingProducts />
        <PromoBanners />
        <BestSellers />
        <ShopByRoom />
        <PopularBrands />
        <RecommendedForYou />
        <Testimonials />
        <AppDownload />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}
