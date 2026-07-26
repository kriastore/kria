"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCategories } from "@/hooks/useCategories";
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
  const categories = firestoreCategories.slice(0, 4).map((c) => c.name);
  const categoryImages: Record<string, string> = Object.fromEntries(
    firestoreCategories.slice(0, 4).filter((c) => c.image).map((c) => [c.name, c.image!])
  );

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

      {/* Marquee */}
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
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 md:grid md:grid-cols-4">
            {categories.map(cat => {
              const imgSrc = categoryImages[cat] || `https://picsum.photos/seed/${encodeURIComponent(cat)}/400/600`;
              return (
                <Link
                  key={cat}
                  href={`/shop?category=${encodeURIComponent(cat)}`}
                  className="w-[calc(50%-0.375rem)] sm:w-[calc(50%-0.5rem)] md:w-auto group block overflow-hidden border border-[#E8E0D8] shadow-[0_1px_10px_rgba(45,32,20,0.05)] hover:shadow-[0_10px_28px_rgba(45,32,20,0.16)] transition-shadow duration-300"
                >
                  <div className="relative h-44 sm:h-56 md:h-80 lg:h-96 bg-[#F3EDE4] flex items-center justify-center overflow-hidden">
                    <ProductImage
                      src={imgSrc}
                      size="thumb"
                      alt={cat}
                      className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent z-10 flex items-end justify-center pb-5 sm:pb-7">
                      <span
                        className="text-sm sm:text-lg md:text-2xl lg:text-3xl text-white drop-shadow-lg tracking-wide text-center px-2 relative after:content-[''] after:block after:w-8 after:h-[2px] after:bg-white/70 after:mx-auto after:mt-2 after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform after:duration-300"
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

      <ReviewCarousel />
    </>
  );
}
