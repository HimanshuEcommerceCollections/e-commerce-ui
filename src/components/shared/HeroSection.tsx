"use client";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

interface Category {
  icon: string;
  label: string;
}

interface CarouselSlide {
  id: number;
  title: string;
  subtitle: string;
  offer: string;
  badgeClass: string;
  image: string;
  objectPosition: string;
}

interface DealProduct {
  name: string;
  emoji: string;
}

interface DealBox {
  title: string;
  subtitle: string;
  borderClass: string;
  accentClass: string;
  products: DealProduct[];
}

const CATEGORIES: Category[] = [
  { icon: "📱", label: "Mobiles" },
  { icon: "👗", label: "Fashion" },
  { icon: "💄", label: "Beauty" },
  { icon: "🏠", label: "Home" },
  { icon: "🖥️", label: "Electronics" },
  { icon: "🛋️", label: "Furniture" },
  { icon: "🍳", label: "Kitchen" },
  { icon: "🚲", label: "Sports" },
  { icon: "📚", label: "Books" },
  { icon: "🧸", label: "Toys" },
  { icon: "🔧", label: "Tools" },
  { icon: "🌿", label: "Garden" },
  { icon: "🐾", label: "Pets" },
  { icon: "🎮", label: "Gaming" },
];

const CAROUSEL_SLIDES: CarouselSlide[] = [
  { id: 1, title: "Back to Campus",   subtitle: "Laptops & Gadgets",   offer: "Up to 40% off",      badgeClass: "slide-badge-violet",  image: "/caraouselslides/laptopandgadgets.jpg", objectPosition: "center center" },
  { id: 2, title: "Style Season",     subtitle: "Trending Fashion",     offer: "Min. 50% off",       badgeClass: "slide-badge-pink",    image: "/caraouselslides/trendingfashion.jpg",  objectPosition: "center top"    },
  { id: 3, title: "Smart Home",       subtitle: "Appliances & Decor",   offer: "Starting ₹499",      badgeClass: "slide-badge-emerald", image: "/caraouselslides/appliances.jpg",       objectPosition: "center center" },
  { id: 4, title: "Mega Electronics", subtitle: "Phones & Laptops",     offer: "Extra 10% bank off", badgeClass: "slide-badge-stone",   image: "/caraouselslides/phones.jpg",           objectPosition: "center center" },
  { id: 5, title: "Kitchen Fest",     subtitle: "Cookware & Gadgets",   offer: "Flat ₹200 off",      badgeClass: "slide-badge-blue",    image: "/caraouselslides/cookware.jpg",         objectPosition: "center center" },
  { id: 6, title: "Sports & Fitness", subtitle: "Gear up for glory",    offer: "Up to 60% off",      badgeClass: "slide-badge-lime",    image: "/caraouselslides/sports.jpeg",          objectPosition: "center center" },
  { id: 7, title: "Books & Learning", subtitle: "Expand your world",    offer: "From ₹99",           badgeClass: "slide-badge-orange",  image: "/caraouselslides/books.jpg",            objectPosition: "center center" },
];

const DEAL_BOXES: DealBox[] = [
  {
    title: "Mobiles Under ₹15,000",
    subtitle: "Top picks this season",
    borderClass: "deal-border-violet",
    accentClass: "deal-accent-violet",
    products: [
      { name: "Redmi Note 13", emoji: "📱" },
      { name: "Realme Narzo",  emoji: "📱" },
      { name: "POCO M6",       emoji: "📱" },
      { name: "iQOO Z9",       emoji: "📱" },
    ],
  },
  {
    title: "Fashion Trends",
    subtitle: "Min. 40% off",
    borderClass: "deal-border-pink",
    accentClass: "deal-accent-pink",
    products: [
      { name: "Casual Tees",  emoji: "👕" },
      { name: "Ethnic Wear",  emoji: "👗" },
      { name: "Sneakers",     emoji: "👟" },
      { name: "Accessories",  emoji: "💍" },
    ],
  },
  {
    title: "Home Essentials",
    subtitle: "Starting ₹99",
    borderClass: "deal-border-emerald",
    accentClass: "deal-accent-emerald",
    products: [
      { name: "Cookware", emoji: "🍳" },
      { name: "Storage",  emoji: "📦" },
      { name: "Decor",    emoji: "🕯️" },
      { name: "Bedding",  emoji: "🛏️" },
    ],
  },
  {
    title: "Electronics",
    subtitle: "Best deals live",
    borderClass: "deal-border-yellow",
    accentClass: "deal-accent-yellow",
    products: [
      { name: "Laptops",      emoji: "💻" },
      { name: "Headphones",   emoji: "🎧" },
      { name: "Smartwatches", emoji: "⌚" },
      { name: "Cameras",      emoji: "📷" },
    ],
  },
  {
    title: "Beauty & Care",
    subtitle: "Up to 55% off",
    borderClass: "deal-border-rose",
    accentClass: "deal-accent-rose",
    products: [
      { name: "Skincare", emoji: "🧴" },
      { name: "Makeup",   emoji: "💄" },
      { name: "Hair Care",emoji: "💇" },
      { name: "Perfumes", emoji: "🌸" },
    ],
  },
  {
    title: "Sports & Outdoor",
    subtitle: "Gear up today",
    borderClass: "deal-border-lime",
    accentClass: "deal-accent-lime",
    products: [
      { name: "Dumbbells", emoji: "🏋️" },
      { name: "Yoga Mats", emoji: "🧘" },
      { name: "Cycles",    emoji: "🚲" },
      { name: "Shoes",     emoji: "👟" },
    ],
  },
];

export default function HeroSection() {
  const [activeCategory, setActiveCategory] = useState<string>("Mobiles");
  const [idx, setIdx] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = CAROUSEL_SLIDES.length;

  const startTimer = (): void => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIdx((p) => (p + 1) % total), 3500);
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const goTo = (i: number): void => { setIdx(i); startTimer(); };
  const prev = (): void => { setIdx((p) => (p - 1 + total) % total); startTimer(); };
  const next = (): void => { setIdx((p) => (p + 1) % total); startTimer(); };

  const s1 = CAROUSEL_SLIDES[idx % total];
  const s2 = CAROUSEL_SLIDES[(idx + 1) % total];

  return (
    <div>

      {/* Category Strip */}
      <div className="cat-strip">
        <div className="cat-strip-inner">
          {CATEGORIES.map((c) => (
            <button
              key={c.label}
              onClick={() => setActiveCategory(c.label)}
              className={`cat-item ${activeCategory === c.label ? "cat-item-active" : ""}`}
            >
              <span className="cat-item-icon">{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Carousel */}
      <div className="carousel-section">
        <div className="relative">
          <div className="carousel-grid">
            {[s1, s2].map((slide, i) => (
              <div
                key={`${slide.id}-${i}`}
                className="carousel-slide"
              >
                {/* Background photo */}
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  style={{ objectPosition: slide.objectPosition }}
                  priority={i === 0}
                />
                {/* Dark gradient so text stays readable */}
                <div className="carousel-slide-overlay" />
                {/* Text content */}
                <div className="carousel-slide-content">
                  <div />
                  <div>
                    <h3 className="carousel-slide-title">{slide.title}</h3>
                    <p className="carousel-slide-subtitle">{slide.subtitle}</p>
                    <span className={`carousel-slide-badge ${slide.badgeClass}`}>
                      {slide.offer}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={prev} className="carousel-nav-btn carousel-nav-prev">
            <ChevronLeft size={16} />
          </button>
          <button onClick={next} className="carousel-nav-btn carousel-nav-next">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="carousel-dots">
          {CAROUSEL_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`carousel-dot ${i === idx ? "carousel-dot-active" : ""}`}
            />
          ))}
        </div>
      </div>

      {/* Deal Boxes */}
      <div className="deals-section">
        <div className="deals-grid">
          {DEAL_BOXES.map((box) => (
            <div key={box.title} className={`deal-box ${box.borderClass}`}>
              <div className="deal-box-header">
                <p className="deal-box-title">{box.title}</p>
                <p className={`deal-box-subtitle ${box.accentClass}`}>{box.subtitle}</p>
              </div>
              <div className="deal-box-products">
                {box.products.map((p) => (
                  <div key={p.name} className="deal-box-product-item">
                    <span className="deal-box-product-emoji">{p.emoji}</span>
                    <span className="deal-box-product-name">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}