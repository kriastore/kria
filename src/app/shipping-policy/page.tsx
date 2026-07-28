"use client";

import { useRouter } from "next/navigation";

export default function ShippingPolicyPage() {
  const router = useRouter();

  return (
    <div className="px-4 py-10 md:px-10 md:py-14 text-[#2D2D2D] flex justify-center">
      <div className="w-full max-w-4xl bg-white border border-[#E8E0D8] shadow-sm p-6 md:p-10 space-y-8">
        {/* Header */}
        <header className="space-y-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 hover:underline cursor-pointer"
          >
            <span aria-hidden="true">←</span>
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Shipping Policy</h1>
            <p className="mt-2 text-sm md:text-base text-gray-700 max-w-2xl">
              We aim to deliver your Kria orders quickly and safely across India,
              while keeping the experience smooth and transparent.
            </p>
          </div>
        </header>

        {/* Order Processing Time */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Order Processing Time</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            Orders are typically dispatched within <span className="font-semibold">5–7 business days</span>
            &nbsp;from the time of order confirmation, excluding Sundays and public holidays.
          </p>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            Orders placed before 12 PM will be processed on the same day (excluding Sundays and public holidays).
            Orders placed after 12 PM will be processed on the next business day.
          </p>
        </section>

        {/* Shipping Time */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Shipping Time</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            <span className="font-semibold">Delivery within India:</span> 7–10 business days from the date of dispatch.
          </p>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            <span className="font-semibold">International Shipping:</span> Delivery timelines vary by destination
            and typically range from 10–21 business days.
          </p>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            Delivery timelines are estimates and may vary based on your exact location
            and courier partner operations.
          </p>
        </section>

        {/* Shipping Charges */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Shipping Charges</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            We offer <span className="font-semibold">FREE shipping across India on all orders above ₹1,000</span>.
          </p>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            For orders below ₹1,000, a flat shipping charge may apply and will be calculated at checkout.
          </p>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            International shipping charges are calculated based on destination and weight at checkout.
          </p>
        </section>

        {/* Order Tracking */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Order Tracking</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            Once your order is dispatched, a tracking link will be shared with you
            via <span className="font-semibold">email and/or SMS</span>. You can use this link to
            track your shipment status in real time on our courier partner's website.
          </p>
        </section>

        {/* Delivery Partners */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Delivery Partners</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            We work with trusted third-party courier partners such as
            &nbsp;<span className="font-semibold">DTDC</span> to deliver your orders safely and on time.
          </p>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            Courier partners are selected based on serviceability, delivery speed,
            and your location to ensure the best possible delivery experience.
          </p>
        </section>


        {/* Delivery Delays + Note */}
        <section className="space-y-3">
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-semibold">Delivery Delays</h2>
            <p className="text-sm md:text-base text-gray-800 leading-relaxed">
              In certain situations, deliveries may be delayed due to factors
              beyond our control, including but not limited to:
            </p>
            <ul className="list-disc pl-5 text-sm md:text-base text-gray-800 space-y-1">
              <li>Festivals, holidays, or sale periods</li>
              <li>Weather disruptions or natural calamities</li>
              <li>Operational or logistics issues with courier partners</li>
              <li>Local restrictions, strikes, or unforeseen events</li>
            </ul>
          </div>

          <div className="border border-[#E0D0B8] bg-[#F9F6F0] px-4 py-3 flex items-start gap-3">
            <span className="mt-0.5 text-lg" aria-hidden="true">📌</span>
            <p className="text-xs md:text-sm text-gray-900 leading-relaxed">
              <span className="font-semibold">Note:</span> Kria is not responsible for delays caused by
              courier partners. However, our team is always here to help you with
              any shipment-related queries and support.
            </p>
          </div>
        </section>

        {/* Help */}
        <section className="pt-2 border-t border-[#E8E0D8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm md:text-base text-gray-800">
          <p>If you have any questions about shipping, feel free to reach out to us.</p>
          <button
            onClick={() => router.push("/faq")}
            className="px-4 py-2 border border-[#E8E0D8] bg-[#F9F6F0] text-[#D2693F] text-sm font-medium hover:bg-[#F9F6F0] cursor-pointer transition-colors"
          >
            Contact &amp; Support
          </button>
        </section>
      </div>
    </div>
  );
}
