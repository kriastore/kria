"use client";

import { useEffect, useRef, useState } from "react";
import { useReviews, type Review } from "@/hooks/useReviews";
import ProductImage from "@/components/ProductImage";

function ReviewCard({ review }: { review: Review }) {
  const hasImage = !!review.image;
  return (
    <div className="h-full bg-[#F9F6F0] border border-[#E8E0D8] shadow-sm flex flex-col overflow-hidden">
      <div className="relative w-full aspect-square overflow-hidden bg-white border-b border-[#E8E0D8]">
        {hasImage ? (
          <ProductImage
            src={review.image}
            size="full"
            alt={review.name}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#D2693F]/10 text-[#D2693F] font-semibold text-5xl">
            {(review.name || "K").charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <p className="text-[#2D2D2D] text-xs sm:text-sm leading-relaxed flex-1">
          &ldquo;{review.text}&rdquo;
        </p>
        <span className="text-[#D2693F] font-semibold text-xs sm:text-sm mt-3">
          — {review.name}
        </span>
      </div>
    </div>
  );
}

export default function ReviewCarousel() {
  const { reviews } = useReviews();
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = () => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  };

  const scrollByOne = (direction: "left" | "right") => {
    const el = containerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    if (!card) return;
    const cardWidth = card.offsetWidth + 24;
    el.scrollBy({
      left: direction === "right" ? cardWidth : -cardWidth,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (canScrollRight) {
        scrollByOne("right");
      }
    }, 9000);
    return () => clearInterval(interval);
  }, [canScrollRight]);

  useEffect(() => {
    updateScrollButtons();
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollButtons);
    return () => el.removeEventListener("scroll", updateScrollButtons);
  }, [reviews.length]);

  return (
    <section className="pt-6 pb-16 text-[#2D2D2D]">
      <h2
        className="text-2xl sm:text-3xl md:text-4xl text-center mb-16"
        style={{ fontFamily: "'Tenor Sans', sans-serif", fontWeight: 600 }}
      >
        Customer Reviews
      </h2>

      {reviews.length === 0 ? (
        <p className="text-center text-sm text-[#9A6E50] tracking-wide">No reviews yet.</p>
      ) : (
        <div className="relative">
          {canScrollLeft && (
            <button
              onClick={() => scrollByOne("left")}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-[#F9F6F0] text-[#2D2D2D] p-3 shadow-lg border border-[#E8E0D8]"
            >
              ‹
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={() => scrollByOne("right")}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-[#F9F6F0] text-[#2D2D2D] p-3 shadow-lg border border-[#E8E0D8]"
            >
              ›
            </button>
          )}

          <div
            ref={containerRef}
            className="flex gap-6 overflow-x-auto px-6 lg:px-12 scrollbar-hide scroll-smooth"
          >
            {reviews.map((review, idx) => (
              <div
                key={idx}
                data-card
                className="flex-shrink-0 w-[75%] sm:w-[42%] lg:w-[26%]"
              >
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
