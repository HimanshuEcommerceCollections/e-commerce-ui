"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

interface Category {
  id:   string;
  icon: string;
  name: string;
  slug: string;
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
  { id: "", icon: "📱", name: "Mobiles",     slug: "mobiles"     },
  { id: "", icon: "👗", name: "Fashion",     slug: "fashion"     },
  { id: "", icon: "💄", name: "Beauty",      slug: "beauty"      },
  { id: "", icon: "🏠", name: "Home",        slug: "home"        },
  { id: "", icon: "🖥️", name: "Electronics", slug: "electronics" },
  { id: "", icon: "🛋️", name: "Furniture",   slug: "furniture"   },
  { id: "", icon: "🍳", name: "Kitchen",     slug: "kitchen"     },
  { id: "", icon: "🚲", name: "Sports",      slug: "sports"      },
  { id: "", icon: "📚", name: "Books",       slug: "books"       },
  { id: "", icon: "🧸", name: "Toys",        slug: "toys"        },
  { id: "", icon: "🔧", name: "Tools",       slug: "tools"       },
  { id: "", icon: "🌿", name: "Garden",      slug: "garden"      },
  { id: "", icon: "🐾", name: "Pets",        slug: "pets"        },
  { id: "", icon: "🎮", name: "Gaming",      slug: "gaming"      },
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

/* Two slides are visible at once (left + right boxes, each 50% wide).
   Two clone slides prepended (for backward wrap) and two appended (for
   forward wrap) so the track can loop seamlessly in both directions.
   Real slides live at indices REAL_START … REAL_START+REAL_COUNT-1.
   After a transition into clone territory finishes (~550 ms) we instantly
   snap to the matching real position — no visible jump. */
const REAL_COUNT  = CAROUSEL_SLIDES.length; // 7
const REAL_START  = 2;                       // real slides start here in SLIDES_EXT

const SLIDES_EXT: CarouselSlide[] = [
  { ...CAROUSEL_SLIDES[REAL_COUNT - 2], id: 200 }, // clone of slide 5  (idx 0)
  { ...CAROUSEL_SLIDES[REAL_COUNT - 1], id: 201 }, // clone of slide 6  (idx 1)
  ...CAROUSEL_SLIDES,                               // real slides 0–6   (idx 2–8)
  { ...CAROUSEL_SLIDES[0], id: 101 },               // clone of slide 0  (idx 9)
  { ...CAROUSEL_SLIDES[1], id: 102 },               // clone of slide 1  (idx 10)
];
const EXT_COUNT = SLIDES_EXT.length; // 11

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
      { name: "Casual Tees", emoji: "👕" },
      { name: "Ethnic Wear", emoji: "👗" },
      { name: "Sneakers",    emoji: "👟" },
      { name: "Accessories", emoji: "💍" },
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
      { name: "Skincare",  emoji: "🧴" },
      { name: "Makeup",    emoji: "💄" },
      { name: "Hair Care", emoji: "💇" },
      { name: "Perfumes",  emoji: "🌸" },
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

  /* idx: position in SLIDES_EXT. Real slides live at REAL_START … REAL_START+REAL_COUNT-1.
     animated: false during the instant snap so no CSS transition plays. */
  const [idx,      setIdx]      = useState<number>(REAL_START);
  const [animated, setAnimated] = useState<boolean>(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Re-enable CSS transition one paint after disabling it (snap completed). */
  useEffect(() => {
    if (!animated) {
      const rid = requestAnimationFrame(() =>
        requestAnimationFrame(() => setAnimated(true))
      );
      return () => cancelAnimationFrame(rid);
    }
  }, [animated]);

  /* After the slide transition into clone territory finishes (~550 ms),
     snap to the matching real position — identical visual, no visible jump. */
  useEffect(() => {
    // Forward overflow: entered end-clones zone
    if (idx >= REAL_START + REAL_COUNT) {
      const t = setTimeout(() => {
        setAnimated(false);
        setIdx(idx - REAL_COUNT);
      }, 560);
      return () => clearTimeout(t);
    }
    // Backward overflow: entered start-clones zone
    if (idx < REAL_START) {
      const t = setTimeout(() => {
        setAnimated(false);
        setIdx(idx + REAL_COUNT);
      }, 560);
      return () => clearTimeout(t);
    }
  }, [idx]);

  const startTimer = useCallback((): void => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIdx(p => p + 1), 3500);
  }, []);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  const goTo = (i: number): void => { setIdx(REAL_START + i); startTimer(); };
  const prev = (): void => { setIdx(p => p - 1); startTimer(); };
  const next = (): void => { setIdx(p => p + 1); startTimer(); };

  /* Which dot to highlight — normalised to real-slide range. */
  const dotIdx = ((idx - REAL_START) % REAL_COUNT + REAL_COUNT) % REAL_COUNT;

  /* ── Track geometry ──────────────────────────────────────────────────────
     Viewport  : 100% wide, overflow hidden  →  2 slides visible at once
     Track     : EXT_COUNT × 50%vw  (= 550% for 11 slides)
     Each slide: 50% of viewport  =  100/EXT_COUNT % of track
     Translate : -(idx × 100/EXT_COUNT)% of track
                 = -(idx × 50)% of viewport  →  one full slide per step ✓
  ─────────────────────────────────────────────────────────────────────── */
  const translateX  = `${-(idx * 100) / EXT_COUNT}%`;
  const trackWidth  = `${EXT_COUNT * 50}%`;
  const slideWidth  = `${100 / EXT_COUNT}%`;

  return (
    <div>

      {/* Category Strip */}
      <div className="cat-strip">
        <div className="cat-strip-inner">
          {CATEGORIES.map((c) => (
            <button
              key={c.name}
              onClick={() => setActiveCategory(c.name)}
              className={`cat-item ${activeCategory === c.name ? "cat-item-active" : ""}`}
            >
              <span className="cat-item-icon">{c.icon}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Carousel */}
      <div className="carousel-section">

        {/* Viewport — clips the track; arrows sit inside here */}
        <div className="carousel-viewport">

          {/* Sliding track — all slides in one horizontal row */}
          <div
            className="carousel-track"
            style={{
              width:     trackWidth,
              transform: `translateX(${translateX})`,
              transition: animated
                ? "transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                : "none",
            }}
          >
            {SLIDES_EXT.map((slide) => (
              <div
                key={slide.id}
                className="carousel-slide"
                style={{ width: slideWidth }}
              >
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  style={{ objectPosition: slide.objectPosition }}
                  priority
                />
                <div className="carousel-slide-overlay" />
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

          {/* Navigation arrows */}
          <button onClick={prev} className="carousel-nav-btn carousel-nav-prev">
            <ChevronLeft size={18} />
          </button>
          <button onClick={next} className="carousel-nav-btn carousel-nav-next">
            <ChevronRight size={18} />
          </button>

        </div>

        {/* Dot indicators */}
        <div className="carousel-dots">
          {CAROUSEL_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`carousel-dot ${dotIdx === i ? "carousel-dot-active" : ""}`}
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
