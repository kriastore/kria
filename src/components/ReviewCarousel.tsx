"use client";

import { useEffect, useRef, useState } from "react";

const reviews = [
  {
    name: "Priya S.",
    text: "The terracotta earrings are absolutely stunning. Lightweight, beautiful craftsmanship, and arrived beautifully packaged."
  },
  {
    name: "Ananya M.",
    text: "I ordered a customised necklace set and they turned out exactly how I envisioned. The attention to detail is remarkable."
  },
  {
    name: "Meera R.",
    text: "The home decor pieces have added such warmth to my living room. Truly artisanal quality."
  },
  {
    name: "Kavitha L.",
    text: "Every piece tells a story. Love supporting handmade Indian craft. Will definitely order again!"
  },
  {
    name: "Shreya P.",
    text: "The silk saree painting is a work of art. Premium quality and the colours are so vibrant."
  },
  {
    name: "Deepa N.",
    text: "Kria has the most elegant handcrafted collection. It feels special to wear something made with such care."
  }
];

export default function ReviewCarousel() {
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
      behavior: "smooth"
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
  }, []);

  return (
    <section className="py-16 text-[#2D2D2D]">
      <h2
        className="text-2xl sm:text-3xl md:text-4xl text-center mb-16"
        style={{ fontFamily: "'Tenor Sans', sans-serif", fontWeight: 600 }}
      >
        Customer Reviews
      </h2>

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
              <div className="h-full bg-[#F9F6F0] border border-[#E8E0D8] p-6 shadow-sm flex flex-col justify-between">
                <p className="text-[#2D2D2D] text-sm sm:text-base leading-relaxed mb-6">
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="text-right">
                  <span className="text-[#D2693F] font-semibold text-sm">
                    — {review.name}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
