"use client";

import { useRouter } from "next/navigation";

export default function AboutUsPage() {
  const router = useRouter();

  return (
    <div className="px-4 py-10 md:px-10 md:py-14 text-[#2D2D2D] flex justify-center">
      <div className="w-full max-w-4xl bg-white border border-[#E8E0D8] shadow-sm p-6 md:p-10 space-y-8">

        {/* Header */}
        <header className="space-y-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#2D2D2D] hover:underline cursor-pointer"
          >
            <span aria-hidden="true">←</span>
            <span>Back</span>
          </button>

          <div>
            <h1
              className="text-3xl md:text-4xl font-semibold tracking-tight"
              style={{ fontFamily: "'Tenor Sans', sans-serif" }}
            >
              About Kria
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-600 max-w-2xl">
              Learn more about our story, values, and the inspiration behind
              Kria's handcrafted artistry.
            </p>
          </div>
        </header>

        {/* Content */}
        <section className="space-y-4 text-sm md:text-base text-[#2D2D2D] leading-relaxed">
          <p>
            Kria is a premium handcrafted artistry brand dedicated to bringing
            traditional Indian craftsmanship to the modern world. We specialise in
            terracotta jewellery, artisanal home decor, and hand-painted silk
            sarees — each piece lovingly made by skilled artisans.
          </p>

          <p>
            Our collections celebrate the beauty of handmade craft. Every product
            tells a story of heritage, skill, and passion — from the shaping of
            clay to the final brushstroke on silk.
          </p>

          <p>
            At Kria, we believe in sustainable, conscious fashion. Our creations
            are not mass-produced; they are shaped by hand, carrying the warmth
            and individuality of the artisan who made them.
          </p>

          <p>
            Kria is more than a brand — it is a celebration of Indian artistry,
            empowering artisans and bringing timeless handcrafted beauty into
            your life.
          </p>
        </section>

        {/* Footer Note */}
        <section className="pt-2 border-t border-[#E8E0D8] text-sm md:text-base text-[#2D2D2D]">
          <p>
            Thank you for being a part of the Kria family.
          </p>
        </section>

      </div>
    </div>
  );
}
