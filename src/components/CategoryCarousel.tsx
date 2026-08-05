"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import PriceText from "@/components/PriceText";
import { resolvePricing } from "@/utils/pricing";
import { getProductSlug } from "@/utils/productSlug";

type Product = {
  ID: number;
  Description: string;
  ImageUrl1: string;
  ImageUrl1Medium?: string;
  ImageUrl1Thumb?: string;
  Price?: number;
  OriginalPrice?: number;
  DiscountPercent?: number;
};

export default function CategoryCarousel({
  title,
  products,
}: {
  title: string;
  products: Product[];
}) {
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const canSlide = products.length > 4;

  const visible = canSlide
    ? products.slice(index, index + 4)
    : products;

  const startAuto = () => {
    if (!canSlide) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setIndex(prev => (prev + 4) % products.length);
    }, 12000);
  };

  useEffect(() => {
    startAuto();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [products]);

  const move = (dir: number) => {
    startAuto();
    setIndex(prev => (prev + dir + products.length) % products.length);
  };

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-extrabold text-[#2D2D2D]">{title}</h2>

      <div className="relative flex items-center">
        {canSlide && (
          <button 
            onClick={() => move(-4)} 
            className="text-3xl px-2 text-[#2D2D2D] hover:text-[#D2693F] transition-colors"
          >
            ‹
          </button>
        )}

        <div className="grid grid-cols-4 gap-6 flex-1">
          {visible.map(p => (
            <Link
              key={p.ID}
              href={`/product/${encodeURIComponent(getProductSlug(p))}`}
              className="border border-[#E8E0D8] bg-white p-4 font-bold hover:shadow-lg hover:border-[#C5A059] transition text-[#2D2D2D]"
            >
              <div className="aspect-square border border-[#E8E0D8] mb-3 overflow-hidden">
                <ProductImage
                  src={p.ImageUrl1}
                  srcMedium={(p as any).ImageUrl1Medium}
                  srcThumb={(p as any).ImageUrl1Thumb}
                  size="thumb"
                  alt={p.Description}
                  className="w-full h-full"
                />
              </div>
              <div className="truncate text-[#2D2D2D]">{p.Description}</div>
              <PriceText amount={resolvePricing({ Price: p.Price, OriginalPrice: p.OriginalPrice, DiscountPercent: p.DiscountPercent }).selling} className="mt-1 text-[#D2693F] font-semibold" />
            </Link>
          ))}
        </div>

        {canSlide && (
          <button 
            onClick={() => move(4)} 
            className="text-3xl px-2 text-[#2D2D2D] hover:text-[#D2693F] transition-colors"
          >
            ›
          </button>
        )}
      </div>
    </section>
  );
}
