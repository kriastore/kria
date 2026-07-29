"use client";

import { useRouter } from "next/navigation";
import { usePolicies } from "@/hooks/usePolicies";

export default function ShippingPolicyPage() {
  const router = useRouter();
  const { policies, loading } = usePolicies();
  const page = policies.shippingPolicy;

  return (
    <div className="px-4 py-10 md:px-10 md:py-14 text-[#2D2D2D] flex justify-center">
      <div className="w-full max-w-4xl bg-white border border-[#E8E0D8] shadow-sm p-6 md:p-10 space-y-8">
        <header className="space-y-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 hover:underline cursor-pointer"
          >
            <span aria-hidden="true">←</span>
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{page.title}</h1>
            <p className="mt-2 text-sm md:text-base text-gray-700 max-w-2xl">{page.subtitle}</p>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#D2693F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          page.sections.map((s, i) => (
            <section key={i} className="space-y-2">
              <h2 className="text-xl md:text-2xl font-semibold">{s.heading}</h2>
              <div className="text-sm md:text-base text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: s.body }} />
            </section>
          ))
        )}

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
