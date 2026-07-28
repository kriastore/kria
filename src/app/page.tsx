"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCategories } from "@/hooks/useCategories";
import { useMarquee } from "@/hooks/useMarquee";
import ReviewCarousel from "@/components/ReviewCarousel";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { resolvePricing } from "@/utils/pricing";
import ProductImage from "@/components/ProductImage";
import PriceText from "@/components/PriceText";

type Product = {
  ID: number;
  Description: string;
  ProductName?: string;
  ImageUrl1: string;
  Price?: number;
  OriginalPrice?: number;
  Product: string;
  StockType?: string;
  IsCustomizable?: boolean;
  DiscountPercent?: number;
  IsFeatured?: boolean;
  ImageUrl1Medium?: string;
  ImageUrl1Thumb?: string;
};

export default function Home() {
  const { totalItems, pulse } = useCart();
  const { user, loading: authLoading } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);

  const { categories: firestoreCategories, loading: categoriesLoading } = useCategories();
  const { items: marqueeItems } = useMarquee();
  const categories = firestoreCategories.map((c) => c.name);
  const categoryImages: Record<string, string> = Object.fromEntries(
    firestoreCategories.filter((c) => c.image).map((c) => [c.name, c.image!])
  );

  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, firestoreCategories]);

  const scrollCarousel = (dir: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    const cardWidth = el.querySelector<HTMLElement>("a")?.offsetWidth || 200;
    el.scrollBy({ left: dir === "left" ? -(cardWidth + 24) : cardWidth + 24, behavior: "smooth" });
  };

  useEffect(() => {
    const fetchProducts = async () => {
      if (!db) { setProductsLoaded(true); return; }
      try {
        const snap = await getDocs(collection(db!, "inventory"));
        setProducts(snap.docs.map(d => d.data() as Product));
      } catch (e) {
        console.error("Failed to load products:", e);
      } finally {
        setProductsLoaded(true);
      }
    };
    fetchProducts();
  }, []);

  const isReady = !authLoading && !categoriesLoading && productsLoaded;

  const doubledMarquee = [...marqueeItems, ...marqueeItems];

  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#F9F6F0]">
        <div className="w-8 h-8 border-2 border-[#E0D0B8] border-t-[#D2693F] animate-spin" />
        <p
          className="text-[#6B5A47] tracking-wide"
          style={{ fontFamily: "Tenor Sans", fontSize: "14px" }}
        >
          Loading Kria...
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Top Promotional Marquee */}
      <div className="w-full bg-[#2D2D2D] py-2.5 overflow-hidden">
        <div className="animate-marquee text-xs sm:text-sm text-[#F9F6F0] tracking-wider font-medium">
          {doubledMarquee.map((text, i) => (
            <span key={i} className="mx-6 sm:mx-8 inline-block whitespace-nowrap">✦ {text}</span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="w-full bg-[#F9F6F0]">
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-24 px-4">
          <h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-[#211A12] tracking-wide"
            style={{ fontFamily: "'Tenor Sans', sans-serif", fontWeight: 600, letterSpacing: "0.06em" }}
          >
            KRIA
          </h1>
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-[#9A6E50] tracking-[0.25em] sm:tracking-[0.3em] uppercase">
            Premium Handcrafted Artistry
          </p>
          <Link
            href="/shop"
            className="mt-7 sm:mt-8 px-9 py-3 border border-[#2D2D2D] text-[#2D2D2D] text-xs sm:text-sm tracking-[0.2em] uppercase font-medium hover:bg-[#2D2D2D] hover:text-[#F9F6F0] active:scale-[0.98] transition-all duration-300"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Category Marquee */}
      <div className="w-full bg-[#F9F6F0] py-3 border-t border-b border-[#E0D0B8] overflow-hidden">
        <div className="animate-marquee text-xs sm:text-sm text-[#9A6E50] tracking-widest font-medium">
          {[...categories, "Handmade with Love", "Supporting Indian Artisans", "Eco-Friendly Craft",
            ...categories, "Handmade with Love", "Supporting Indian Artisans", "Eco-Friendly Craft"
          ].map((cat, i) => (
            <span key={i} className="mx-6 sm:mx-8 inline-block whitespace-nowrap">✦ {cat}</span>
          ))}
        </div>
      </div>

      {/* Categories */}
      <section className="px-4 sm:px-6 md:px-10 pt-10 sm:pt-14 md:pt-20 bg-[#F9F6F0]">
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl text-center mb-7 sm:mb-11 md:mb-16 text-[#211A12]"
            style={{ fontFamily: "'Tenor Sans', sans-serif", fontWeight: 600 }}
          >
            Browse By Category
          </h2>

          {/* Mobile: 2-col grid, all categories */}
          <div className="md:hidden grid grid-cols-2 gap-3 sm:gap-4">
            {categories.map(cat => {
              const imgSrc = categoryImages[cat] || `https://picsum.photos/seed/${encodeURIComponent(cat)}/400/600`;
              return (
                <Link
                  key={cat}
                  href={`/shop?category=${encodeURIComponent(cat)}`}
                  className="group block overflow-hidden border border-[#E8E0D8] shadow-[0_1px_10px_rgba(45,32,20,0.05)] hover:shadow-[0_10px_28px_rgba(45,32,20,0.16)] transition-shadow duration-300"
                >
                  <div className="relative h-44 sm:h-56 bg-[#F3EDE4] flex items-center justify-center overflow-hidden">
                    <ProductImage
                      src={imgSrc}
                      size="thumb"
                      alt={cat}
                      className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent z-10 flex items-end justify-center pb-5 sm:pb-7">
                      <span
                        className="text-sm sm:text-lg text-white drop-shadow-lg tracking-wide text-center px-2 relative after:content-[''] after:block after:w-8 after:h-[2px] after:bg-white/70 after:mx-auto after:mt-2 after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform after:duration-300"
                        style={{ fontFamily: "'Tenor Sans', sans-serif", fontWeight: 600 }}
                      >
                        Shop {cat}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Desktop: 4-col carousel with arrows */}
          <div className="hidden md:block relative">
            {canScrollLeft && (
              <button
                onClick={() => scrollCarousel("left")}
                className="absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-[#F9F6F0] border border-[#E8E0D8] shadow-md flex items-center justify-center hover:bg-white transition-colors"
                aria-label="Scroll left"
              >
                <svg className="w-5 h-5 text-[#2D2D2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {canScrollRight && (
              <button
                onClick={() => scrollCarousel("right")}
                className="absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-[#F9F6F0] border border-[#E8E0D8] shadow-md flex items-center justify-center hover:bg-white transition-colors"
                aria-label="Scroll right"
              >
                <svg className="w-5 h-5 text-[#2D2D2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            <div
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {categories.map(cat => {
                const imgSrc = categoryImages[cat] || `https://picsum.photos/seed/${encodeURIComponent(cat)}/400/600`;
                return (
                  <Link
                    key={cat}
                    href={`/shop?category=${encodeURIComponent(cat)}`}
                    className="flex-none w-[calc(25%-18px)] group block overflow-hidden border border-[#E8E0D8] shadow-[0_1px_10px_rgba(45,32,20,0.05)] hover:shadow-[0_10px_28px_rgba(45,32,20,0.16)] transition-shadow duration-300"
                  >
                    <div className="relative h-80 lg:h-96 bg-[#F3EDE4] flex items-center justify-center overflow-hidden">
                      <ProductImage
                        src={imgSrc}
                        size="thumb"
                        alt={cat}
                        className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent z-10 flex items-end justify-center pb-7">
                        <span
                          className="text-2xl lg:text-3xl text-white drop-shadow-lg tracking-wide text-center px-2 relative after:content-[''] after:block after:w-8 after:h-[2px] after:bg-white/70 after:mx-auto after:mt-2 after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform after:duration-300"
                          style={{ fontFamily: "'Tenor Sans', sans-serif", fontWeight: 600 }}
                        >
                          Shop {cat}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="px-4 sm:px-6 md:px-10 pt-12 sm:pt-16 md:pt-20 pb-9 sm:pb-14 bg-[#F9F6F0]">
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl text-center mb-7 sm:mb-11 md:mb-16 text-[#211A12]"
            style={{ fontFamily: "'Tenor Sans', sans-serif", fontWeight: 600 }}
          >
            Most Loved Handcrafted Pieces
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-7">
            {products.map((p) => (
              <Link
                key={p.ID}
                href={`/product/${encodeURIComponent(p.ProductName || p.Description)}`}
                className="flex flex-col items-center group"
              >
                <div className="aspect-square border border-[#E8E0D8] mb-2.5 sm:mb-3.5 overflow-hidden w-full bg-white relative shadow-[0_1px_6px_rgba(45,32,20,0.04)] group-hover:shadow-[0_8px_20px_rgba(45,32,20,0.14)] group-hover:border-[#D2693F]/40 transition-all duration-300">
                  <ProductImage
                    src={p.ImageUrl1}
                    srcMedium={(p as any).ImageUrl1Medium}
                    srcThumb={(p as any).ImageUrl1Thumb}
                    size="thumb"
                    alt={p.Description}
                    className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div
                  className="truncate text-[#211A12] text-xs sm:text-sm md:text-base mb-1 w-full text-center px-1"
                  style={{ fontFamily: "'Tenor Sans', sans-serif" }}
                >
                  {p.ProductName || p.Description}
                </div>

                <div className="text-center px-1">
                  {(() => { const pr = resolvePricing({ Price: p.Price, OriginalPrice: p.OriginalPrice, DiscountPercent: p.DiscountPercent }); return (
                    <>
                      {pr.discount > 0 && (
                        <PriceText amount={pr.original} strikeThrough className="line-through text-[#B0A38C] mr-1.5 text-xs" />
                      )}
                      <PriceText amount={pr.selling} className="text-[#D2693F] font-semibold text-xs sm:text-sm" />
                    </>
                  ); })()}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {products.length > 6 && (
        <section className="px-4 sm:px-6 md:px-10 pt-5 sm:pt-9 md:pt-14 pb-9 sm:pb-14 bg-[#F9F6F0]">
          <div className="max-w-7xl mx-auto">
            <h2
              className="text-2xl sm:text-3xl md:text-4xl text-center mb-7 sm:mb-11 md:mb-16 text-[#211A12]"
              style={{ fontFamily: "'Tenor Sans', sans-serif", fontWeight: 600 }}
            >
              New Arrivals
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-7">
              {products.slice(6, 9).map((p) => (
                <Link
                  key={p.ID}
                  href={`/product/${encodeURIComponent(p.ProductName || p.Description)}`}
                  className="flex flex-col items-center group"
                >
                  <div className="aspect-square border border-[#E8E0D8] mb-2.5 sm:mb-3.5 overflow-hidden w-full bg-white relative shadow-[0_1px_6px_rgba(45,32,20,0.04)] group-hover:shadow-[0_8px_20px_rgba(45,32,20,0.14)] group-hover:border-[#D2693F]/40 transition-all duration-300">
                    <ProductImage
                      src={p.ImageUrl1}
                      srcMedium={(p as any).ImageUrl1Medium}
                      srcThumb={(p as any).ImageUrl1Thumb}
                      size="thumb"
                      alt={p.Description}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div
                    className="truncate text-[#211A12] text-xs sm:text-sm md:text-base mb-1 w-full text-center px-1"
                    style={{ fontFamily: "'Tenor Sans', sans-serif" }}
                  >
                    {p.ProductName || p.Description}
                  </div>

                  <div className="text-center px-1">
                    {(() => { const pr = resolvePricing({ Price: p.Price, OriginalPrice: p.OriginalPrice, DiscountPercent: p.DiscountPercent }); return (
                      <>
                        {pr.discount > 0 && (
                          <PriceText amount={pr.original} strikeThrough className="line-through text-[#B0A38C] mr-1.5 text-xs" />
                        )}
                        <PriceText amount={pr.selling} className="text-[#D2693F] font-semibold text-xs sm:text-sm" />
                      </>
                    ); })()}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bottom Promotional Marquee */}
      <div className="w-full bg-[#D2693F] py-3 overflow-hidden">
        <div className="animate-marquee text-xs sm:text-sm text-white tracking-wider font-medium">
          {doubledMarquee.map((text, i) => (
            <span key={i} className="mx-6 sm:mx-8 inline-block whitespace-nowrap">✦ {text}</span>
          ))}
        </div>
      </div>

      <ReviewCarousel />
    </>
  );
}
