"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCategories, Category, MAIN_TEXT_SIZES } from "@/hooks/useCategories";
import { useMarquee } from "@/hooks/useMarquee";
import ReviewCarousel from "@/components/ReviewCarousel";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { resolvePricing } from "@/utils/pricing";
import { getProductSlug } from "@/utils/productSlug";
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
  createdAt?: any;
  SKU?: string;
};

function KolamBorder({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center text-center p-1 sm:p-2 overflow-hidden ${className || ""}`}
      style={{
        borderImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8 0l2 6 6 2-6 2-2 6-2-6-6-2 6-2z' fill='%23211A12' opacity='0.4'/%3E%3C/svg%3E") 4 round`,
        borderWidth: "4px",
        borderStyle: "solid",
        borderColor: "transparent",
      }}
    >
      {children}
    </div>
  );
}

function CategoryCard({ cat }: { cat: Category }) {
  return (
    <Link
      href={`/shop?category=${encodeURIComponent(cat.name)}`}
      className="group block overflow-hidden border border-[#E8E0D8]"
    >
      <div className="relative aspect-square flex flex-col items-center justify-center p-2 sm:p-3" style={{ backgroundColor: cat.bgColor || '#F3EDE4' }}>
        <KolamBorder>
          <span style={{ fontFamily: cat.mainTextFont || "'Great Vibes', cursive", wordBreak: 'keep-all' }} className={"text-[#211A12] tracking-wide font-bold leading-tight max-w-full " + (MAIN_TEXT_SIZES[cat.mainTextSize || 4] || MAIN_TEXT_SIZES[4])}>
            {cat.mainText || cat.name}
          </span>
        </KolamBorder>
      </div>
    </Link>
  );
}

function ProductCard({ product }: { product: Product }) {
  const p = product;
  const isNew = p.createdAt && (Date.now() - p.createdAt.toDate()) < 30 * 24 * 60 * 60 * 1000;
  return (
    <Link
      href={`/product/${encodeURIComponent(getProductSlug(p))}`}
      className="flex flex-col items-center group"
    >
      <div className="aspect-square border border-[#E8E0D8] mb-2.5 sm:mb-3.5 overflow-hidden w-full bg-white relative shadow-[0_1px_6px_rgba(45,32,20,0.04)] group-hover:shadow-[0_8px_20px_rgba(45,32,20,0.14)] group-hover:border-[#D2693F]/40 transition-all duration-300">
        {isNew && (
          <span className="absolute top-2 right-2 bg-[#D2693F] text-white text-[10px] font-bold px-2 py-0.5 z-10 uppercase tracking-wider">New</span>
        )}
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
        className="truncate text-[#211A12] text-xs sm:text-sm md:text-base mb-0.5 w-full text-center px-1"
        style={{ fontFamily: "'Tenor Sans', sans-serif" }}
      >
        {p.ProductName || p.Description}
      </div>
      {p.SKU && (
        <div className="text-[10px] text-[#B0A38C] text-center mb-1 px-1">{p.SKU}</div>
      )}
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
  );
}

export default function Home() {
  const { loading: authLoading } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);

  const { categories: firestoreCategories, loading: categoriesLoading } = useCategories();
  const { items: marqueeItems } = useMarquee();
  const categoryNames = firestoreCategories.map((c) => c.name);

  const carouselRef = useRef<HTMLDivElement>(null);
  const leftBtnRef = useRef<HTMLButtonElement>(null);
  const rightBtnRef = useRef<HTMLButtonElement>(null);

  const productsCarouselRef = useRef<HTMLDivElement>(null);
  const productsLeftBtnRef = useRef<HTMLButtonElement>(null);
  const productsRightBtnRef = useRef<HTMLButtonElement>(null);

  const updateArrows = useCallback(() => {
    const el = carouselRef.current;
    const leftBtn = leftBtnRef.current;
    const rightBtn = rightBtnRef.current;
    if (!el || !leftBtn || !rightBtn) return;
    const atStart = el.scrollLeft <= 4;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    leftBtn.classList.toggle("opacity-100", !atStart);
    leftBtn.classList.toggle("opacity-30", atStart);
    leftBtn.classList.toggle("cursor-pointer", !atStart);
    leftBtn.classList.toggle("cursor-default", atStart);
    rightBtn.classList.toggle("opacity-100", !atEnd);
    rightBtn.classList.toggle("opacity-30", atEnd);
    rightBtn.classList.toggle("cursor-pointer", !atEnd);
    rightBtn.classList.toggle("cursor-default", atEnd);
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    el.scrollLeft = 0;

    const run = () => requestAnimationFrame(() => requestAnimationFrame(() => updateArrows()));

    const ro = new ResizeObserver(run);
    ro.observe(el);

    const onPageshow = () => {
      el.scrollLeft = 0;
      requestAnimationFrame(() => requestAnimationFrame(() => updateArrows()));
    };
    window.addEventListener("pageshow", onPageshow);

    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);

    run();

    return () => {
      ro.disconnect();
      window.removeEventListener("pageshow", onPageshow);
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows, firestoreCategories]);

  const updateProductsArrows = useCallback(() => {
    const el = productsCarouselRef.current;
    const leftBtn = productsLeftBtnRef.current;
    const rightBtn = productsRightBtnRef.current;
    if (!el || !leftBtn || !rightBtn) return;
    const atStart = el.scrollLeft <= 4;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    leftBtn.classList.toggle("opacity-100", !atStart);
    leftBtn.classList.toggle("opacity-30", atStart);
    leftBtn.classList.toggle("cursor-pointer", !atStart);
    leftBtn.classList.toggle("cursor-default", atStart);
    rightBtn.classList.toggle("opacity-100", !atEnd);
    rightBtn.classList.toggle("opacity-30", atEnd);
    rightBtn.classList.toggle("cursor-pointer", !atEnd);
    rightBtn.classList.toggle("cursor-default", atEnd);
  }, []);

  const scrollProductsCarousel = (dir: "left" | "right") => {
    const el = productsCarouselRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("a");
    if (!card) return;
    const gap = 12;
    const scrollAmount = (card.offsetWidth + gap) * 2;
    el.scrollBy({ left: dir === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    requestAnimationFrame(() => requestAnimationFrame(() => updateProductsArrows()));
  };

  useEffect(() => {
    const el = productsCarouselRef.current;
    if (!el) return;

    el.scrollLeft = 0;

    const run = () => requestAnimationFrame(() => requestAnimationFrame(() => updateProductsArrows()));

    const ro = new ResizeObserver(run);
    ro.observe(el);

    const onPageshow = () => {
      el.scrollLeft = 0;
      requestAnimationFrame(() => requestAnimationFrame(() => updateProductsArrows()));
    };
    window.addEventListener("pageshow", onPageshow);

    el.addEventListener("scroll", updateProductsArrows, { passive: true });
    window.addEventListener("resize", updateProductsArrows);

    run();

    return () => {
      ro.disconnect();
      window.removeEventListener("pageshow", onPageshow);
      el.removeEventListener("scroll", updateProductsArrows);
      window.removeEventListener("resize", updateProductsArrows);
    };
  }, [updateProductsArrows, productsLoaded]);

  const scrollCarousel = (dir: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("a");
    if (!card) return;
    const gap = 12;
    const scrollAmount = (card.offsetWidth + gap) * 2;
    el.scrollBy({ left: dir === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    requestAnimationFrame(() => requestAnimationFrame(() => updateArrows()));
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
          {[...categoryNames, "Handmade with Love", "Supporting Indian Artisans", "Eco-Friendly Craft",
            ...categoryNames, "Handmade with Love", "Supporting Indian Artisans", "Eco-Friendly Craft"
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

          {/* Mobile: 2-col grid */}
          <div className="lg:hidden grid grid-cols-2 gap-2 sm:gap-3">
            {firestoreCategories.map(cat => (
              <CategoryCard key={cat.id} cat={cat} />
            ))}
          </div>

          {/* Desktop: carousel showing 4 at a time */}
          <div className="hidden lg:block relative">
            <button
              ref={leftBtnRef}
              onClick={() => scrollCarousel("left")}
              className="absolute left-0 top-0 bottom-0 z-10 w-14 flex items-center justify-center transition-opacity duration-300 opacity-30 cursor-default"
              aria-label="Scroll left"
            >
              <span className="w-10 h-10 rounded-full bg-white shadow-sm border border-[#E8E0D8] flex items-center justify-center hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4 text-[#2D2D2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </span>
            </button>
            <button
              ref={rightBtnRef}
              onClick={() => scrollCarousel("right")}
              className="absolute right-0 top-0 bottom-0 z-10 w-14 flex items-center justify-center transition-opacity duration-300 opacity-100 cursor-pointer"
              aria-label="Scroll right"
            >
              <span className="w-10 h-10 rounded-full bg-white shadow-sm border border-[#E8E0D8] flex items-center justify-center hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4 text-[#2D2D2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </button>
            <div
              ref={carouselRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {firestoreCategories.map(cat => (
                <div key={cat.id} className="flex-none w-[calc(25%-9px)]">
                  <CategoryCard cat={cat} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Most Loved */}
      {(() => {
        const featured = products.filter(p => p.IsFeatured);
        const mobileFeatured = featured.slice(0, 4);
        return (
          <section className="px-4 sm:px-6 md:px-10 pt-12 sm:pt-16 md:pt-20 pb-9 sm:pb-14 bg-[#F9F6F0]">
            <div className="max-w-7xl mx-auto">
              <h2
                className="text-2xl sm:text-3xl md:text-4xl text-center mb-7 sm:mb-11 md:mb-16 text-[#211A12]"
                style={{ fontFamily: "'Tenor Sans', sans-serif", fontWeight: 600 }}
              >
                Most Loved Handcrafted Pieces
              </h2>

              {featured.length === 0 ? null : (
                <>
                  {/* Mobile: 2x2 grid, max 4 */}
                  <div className="lg:hidden grid grid-cols-2 gap-4 sm:gap-5">
                    {mobileFeatured.map((p) => (
                      <ProductCard key={p.ID} product={p} />
                    ))}
                  </div>

                  {/* Desktop: carousel showing 4 at a time */}
                  <div className="hidden lg:block relative">
                    <button
                      ref={productsLeftBtnRef}
                      onClick={() => scrollProductsCarousel("left")}
                      className="absolute left-0 top-0 bottom-0 z-10 w-14 flex items-center justify-center transition-opacity duration-300 opacity-30 cursor-default"
                      aria-label="Scroll left"
                    >
                      <span className="w-10 h-10 rounded-full bg-white shadow-sm border border-[#E8E0D8] flex items-center justify-center hover:bg-gray-50 transition-colors">
                        <svg className="w-4 h-4 text-[#2D2D2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                        </svg>
                      </span>
                    </button>
                    <button
                      ref={productsRightBtnRef}
                      onClick={() => scrollProductsCarousel("right")}
                      className="absolute right-0 top-0 bottom-0 z-10 w-14 flex items-center justify-center transition-opacity duration-300 opacity-100 cursor-pointer"
                      aria-label="Scroll right"
                    >
                      <span className="w-10 h-10 rounded-full bg-white shadow-sm border border-[#E8E0D8] flex items-center justify-center hover:bg-gray-50 transition-colors">
                        <svg className="w-4 h-4 text-[#2D2D2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </button>
                    <div
                      ref={productsCarouselRef}
                      className="flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                      {featured.map((p) => (
                        <div key={p.ID} className="flex-none w-[calc(25%-15px)]">
                          <ProductCard product={p} />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        );
      })()}

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
              {products.slice(6, 9).map((p) => {
                const isNew = p.createdAt && (Date.now() - p.createdAt.toDate()) < 30 * 24 * 60 * 60 * 1000;
                return (
                <Link
                  key={p.ID}
                  href={`/product/${encodeURIComponent(getProductSlug(p))}`}
                  className="flex flex-col items-center group"
                >
                  <div className="aspect-square border border-[#E8E0D8] mb-2.5 sm:mb-3.5 overflow-hidden w-full bg-white relative shadow-[0_1px_6px_rgba(45,32,20,0.04)] group-hover:shadow-[0_8px_20px_rgba(45,32,20,0.14)] group-hover:border-[#D2693F]/40 transition-all duration-300">
                    {isNew && (
                      <span className="absolute top-2 right-2 bg-[#D2693F] text-white text-[10px] font-bold px-2 py-0.5 z-10 uppercase tracking-wider">New</span>
                    )}
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
                    className="truncate text-[#211A12] text-xs sm:text-sm md:text-base mb-0.5 w-full text-center px-1"
                    style={{ fontFamily: "'Tenor Sans', sans-serif" }}
                  >
                    {p.ProductName || p.Description}
                  </div>
                  {p.SKU && (
                    <div className="text-[10px] text-[#B0A38C] text-center mb-1 px-1">{p.SKU}</div>
                  )}

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
              );})}
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
