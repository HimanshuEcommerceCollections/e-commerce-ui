import AnnouncementBar from "@/components/home/AnnouncementBar";
import Navbar from "@/components/home/Navbar";
import HeroSection from "@/components/home/sections/HeroSection";
import TrustBar from "@/components/home/sections/TrustBar";
import FlashSaleSection from "@/components/home/sections/FlashSaleSection";
import ShopByCategorySection from "@/components/home/sections/ShopByCategorySection";
import TrendingProductsSection from "@/components/home/sections/TrendingProductsSection";
import PromoBannersSection from "@/components/home/sections/PromoBannersSection";
import BestSellersSection from "@/components/home/sections/BestSellersSection";
import ShopByRoomSection from "@/components/home/sections/ShopByRoomSection";
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
        <ShopByCategorySection />
        <TrendingProductsSection />
        <PromoBannersSection />
        <BestSellersSection />
        <ShopByRoomSection />
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
