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
import PopularBrandsSection from "@/components/home/sections/PopularBrandsSection";
import RecommendedSection from "@/components/home/sections/RecommendedSection";
import TestimonialsSection from "@/components/home/sections/TestimonialsSection";
import DownloadAppSection from "@/components/home/sections/DownloadAppSection";
import NewsletterSection from "@/components/home/sections/NewsletterSection";
import Footer from "@/components/Footer";

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
        <PopularBrandsSection />
        <RecommendedSection />
        <TestimonialsSection />
        <DownloadAppSection />
        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
}
