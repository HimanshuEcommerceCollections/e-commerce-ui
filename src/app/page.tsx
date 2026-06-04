import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FlashDeals from "@/components/FlashDeals";
import Categories from "@/components/Categories";
import TrendingNow from "@/components/TrendingNow";
import TrustBar from "@/components/TrustBar";
import AppBanner from "@/components/AppBanner";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <Navbar />
      <HeroSection />
      <FlashDeals />
      <Categories />
      <TrendingNow />
      <TrustBar />
      <AppBanner />
      <Footer />
    </main>
  );
}
