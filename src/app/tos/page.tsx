"use client";

import { useRouter } from "next/navigation";

export default function TermsAndConditionsPage() {
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
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Terms &amp; Conditions
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-700 max-w-2xl">
              These terms outline the rules and regulations for using Kria
              Boutique website and services.
            </p>
          </div>
        </header>

        {/* General Usage */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">General Usage</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            By accessing and using the Kria website, you agree to comply
            with and be bound by these Terms &amp; Conditions. If you do not agree
            with any part of these terms, you should discontinue use of the site.
          </p>
        </section>

        {/* General Conditions */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">General Conditions</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            We reserve the right to refuse service to anyone for any reason at any time.
            You understand that your content (not including credit card information) may be transferred
            unencrypted and involve transmissions over various networks. Credit card information is
            always encrypted during transfer over networks.
          </p>
        </section>

        {/* Product Information & Accuracy */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Product Information &amp; Accuracy</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            We are not responsible if information made available on this site is not accurate, complete, or current.
            The material is provided for general information only and should not be relied upon as the sole basis
            for making decisions. Any reliance on the material on this site is at your own risk.
          </p>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            This site may contain certain historical information. Historical information, necessarily,
            is not current and is provided for your reference only. We reserve the right to modify the
            contents of this site at any time, but we have no obligation to update any information on our site.
          </p>
        </section>

        {/* Product Pricing */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Product Pricing</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            Prices for our products are subject to change without notice. We reserve the right at any time
            to modify or discontinue the Service (or any part or content thereof) without notice at any time.
            We shall not be liable to you or to any third-party for any modification, price change,
            suspension, or discontinuance of the Service.
          </p>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            We have made every effort to display as accurately as possible the colors and images of our
            products that appear at the store. We cannot guarantee that your computer monitor's display
            of any color will be accurate.
          </p>
        </section>

        {/* Order Cancellation */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Order Cancellation</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            We reserve the right to refuse or cancel any order you place with us.
            We may, in our sole discretion, limit or cancel quantities purchased per person,
            per household, or per order. These restrictions may include orders placed by or under
            the same customer account, the same credit card, and/or orders that use the same
            billing and/or shipping address.
          </p>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            In the event that we make a change to or cancel an order, we will attempt to notify
            you by contacting the e-mail and/or billing address/phone number provided at the
            time the order was made.
          </p>
        </section>

        {/* Personal Information */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Personal Information</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            Your submission of personal information through the site is governed by our Privacy Policy.
            Please review our Privacy Policy for more details on how we handle your personal data.
          </p>
        </section>

        {/* Errors & Inaccuracies */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Errors, Inaccuracies &amp; Omissions</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            Occasionally there may be information on our site that contains typographical errors,
            inaccuracies, or omissions that may relate to product descriptions, pricing, promotions,
            offers, product shipping charges, transit times, and availability. We reserve the right
            to correct any errors, inaccuracies, or omissions, and to change or update information
            or cancel orders if any information in the Service or on any related website is inaccurate
            at any time without prior notice.
          </p>
        </section>

        {/* Prohibited Uses */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Prohibited Uses</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            In addition to other prohibitions as set forth in the Terms &amp; Conditions, you are
            prohibited from using the site or its content: (a) for any unlawful purpose; (b) to
            solicit others to perform or participate in any unlawful acts; (c) to violate any
            international, federal, provincial, or state regulations, rules, laws, or local
            ordinances; (d) to infringe upon or violate our intellectual property rights or the
            intellectual property rights of others; (e) to harass, abuse, insult, harm, defame,
            slander, disparage, intimidate, or discriminate; (f) to submit false or misleading
            information; (g) to upload or transmit viruses or any other type of malicious code;
            (h) to collect or track the personal information of others; (i) to spam, phish, pharm,
            pretext, spider, crawl, or scrape; (j) for any obscene or immoral purpose; or (k) to
            circumvent or violate any security features of the Service.
          </p>
        </section>

        {/* Intellectual Property */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">
            Intellectual Property
          </h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            All content on this website, including logos, images, text, graphics,
            and designs, is the exclusive property of Kria. Unauthorized
            use, reproduction, or distribution of any content is strictly prohibited.
          </p>
        </section>

        {/* Limitation of Liability */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Limitation of Liability</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            We do not guarantee, represent, or warrant that your use of our service will be
            uninterrupted, timely, secure, or error-free. We do not warrant that the results
            that may be obtained from the use of the service will be accurate or reliable.
            You agree that from time to time we may remove the service for indefinite periods
            of time or cancel the service at any time, without notice to you.
          </p>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            In no case shall Kria, our directors, officers, employees, affiliates, agents,
            contractors, suppliers, service providers, or licensors be liable for any injury,
            loss, claim, or any direct, indirect, incidental, punitive, special, or consequential
            damages of any kind.
          </p>
        </section>

        {/* Indemnification */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Indemnification</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            You agree to indemnify, defend, and hold harmless Kria and our parent,
            subsidiaries, affiliates, partners, officers, directors, agents, contractors,
            licensors, service providers, subcontractors, suppliers, and employees from any
            claim or demand, including reasonable attorneys' fees, made by any third-party due
            to or arising out of your breach of these Terms &amp; Conditions or your violation
            of any law or the rights of a third-party.
          </p>
        </section>

        {/* Severability */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Severability</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            In the event that any provision of these Terms &amp; Conditions is determined to be
            unlawful, void, or unenforceable, such provision shall nonetheless be enforceable
            to the fullest extent permitted by applicable law, and the unenforceable portion
            shall be deemed to be severed from these Terms &amp; Conditions. Such determination
            shall not affect the validity and enforceability of any other remaining provisions.
          </p>
        </section>

        {/* Termination */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Termination</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            The obligations and liabilities of the parties incurred prior to the termination
            date shall survive the termination of this agreement for all purposes. These Terms
            &amp; Conditions are effective unless and until terminated by either you or us.
            You may terminate these Terms &amp; Conditions at any time by notifying us that you
            no longer wish to use our Services, or when you cease using our site.
          </p>
        </section>

        {/* Entire Agreement */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Entire Agreement</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            The failure of us to exercise or enforce any right or provision of these Terms &amp;
            Conditions shall not constitute a waiver of such right or provision. These Terms &amp;
            Conditions and any policies or operating rules posted by us on this site constitute
            the entire agreement and understanding between you and us and govern your use of the
            Service, superseding any prior or contemporaneous agreements, communications, and
            proposals, whether oral or written, between you and us.
          </p>
        </section>

        {/* Governing Law */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Governing Law</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            These Terms &amp; Conditions shall be governed by and interpreted in
            accordance with the laws of India. Any disputes arising from the use
            of this website shall be subject to Indian jurisdiction.
          </p>
        </section>

        {/* Changes to Terms */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Changes to Terms &amp; Conditions</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            You can review the most current version of the Terms &amp; Conditions at any time on this page.
            We reserve the right, at our sole discretion, to update, change, or replace any part of these
            Terms &amp; Conditions by posting updates and changes to our website. It is your responsibility
            to check our website periodically for changes.
          </p>
        </section>

        {/* Contact Information */}
        <section className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold">Contact Information</h2>
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            Questions about the Terms &amp; Conditions should be sent to us at
            <a href="mailto:Kriastore@gmail.com" className="font-semibold underline ml-1">Kriastore@gmail.com</a>.
          </p>
        </section>

        {/* Footer CTA */}
        <section className="pt-2 border-t border-[#E8E0D8] text-sm md:text-base text-gray-800">
          <p>
            If you have any questions regarding these Terms &amp; Conditions,
            please contact our support team.
          </p>
        </section>

        <button
    onClick={() => router.push("/faq")}
    className="px-4 py-2 border border-[#E8E0D8] bg-[#F9F6F0] text-[#D2693F] text-sm font-medium hover:bg-[#F9F6F0] cursor-pointer transition-colors"
  >
    Contact &amp; Support
  </button>

      </div>
    </div>
  );
}
