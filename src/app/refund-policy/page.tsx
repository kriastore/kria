"use client";

import { useRouter } from "next/navigation";

export default function RefundPolicyPage() {
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
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Return &amp; Refund Policy</h1>
            <p className="mt-2 text-sm md:text-base text-gray-700 max-w-2xl">
              We want you to love your Kria purchase. If something isn&apos;t quite right,
              our simple return and refund guidelines below will help you.
            </p>
          </div>
        </header>

        {/* Return Eligibility */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Return Eligibility</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            We have a <span className="font-semibold">14-day return policy</span>, which means you have
            14 days after receiving your item to request a return.
          </p>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            To be eligible for a return, your item must be in the same condition that you received it,
            <span className="font-semibold"> unworn or unused, with tags, and in its original packaging</span>.
            You will also need the receipt or proof of purchase.
          </p>
        </section>

        {/* How to Start a Return */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">How to Start a Return</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            To start a return, you can contact us at
            &nbsp;<a href="mailto:Kriastore@gmail.com" className="font-semibold underline">Kriastore@gmail.com</a>.
          </p>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            If your return is accepted, we will send you a return shipping label, as well as
            instructions on how and where to send your package. Items sent back to us without
            first requesting a return will not be accepted.
          </p>
        </section>

        {/* Damages and Issues */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Damages and Issues</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            Please inspect your order upon reception and contact us immediately if the item is
            defective, damaged, or if you receive the wrong item, so that we can evaluate the
            issue and make it right.
          </p>
        </section>

        {/* Exceptions / Non-Returnable Items */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Exceptions / Non-Returnable Items</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            Certain types of items cannot be returned. For hygiene and safety reasons,
            <span className="font-semibold"> accessories</span> are non-returnable.
          </p>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            Please get in touch if you have questions or concerns about your specific item.
          </p>
        </section>

        {/* Exchanges */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Exchanges</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            The fastest way to ensure you get what you want is to return the item you have,
            and once the return is accepted, make a separate purchase for the new item.
          </p>
        </section>

        {/* Refunds */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Refunds</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            We will notify you once we have received and inspected your return, and let you know
            if the refund was approved or not. If approved, you will be automatically refunded on
            your original payment method within
            &nbsp;<span className="font-semibold">10 business days</span>. Please remember it can take
            some time for your bank or credit card company to process and post the refund too.
          </p>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            If more than 15 business days have passed since we approved your return, please contact us
            at <a href="mailto:Kriastore@gmail.com" className="underline">Kriastore@gmail.com</a>.
          </p>
        </section>

        {/* Help */}
        <section className="pt-2 border-t border-[#E8E0D8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm md:text-base text-gray-800">
          <p>If you have any questions about returns or refunds, we&apos;re here to help.</p>
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
