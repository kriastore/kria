"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export type PolicySection = {
  heading: string;
  body: string;
};

export type PolicyPage = {
  title: string;
  subtitle: string;
  sections: PolicySection[];
};

export type PoliciesData = {
  privacyPolicy: PolicyPage;
  refundPolicy: PolicyPage;
  shippingPolicy: PolicyPage;
  tos: PolicyPage;
  aboutUs: PolicyPage;
  cancellationRefund: PolicyPage;
  shippingReturn: PolicyPage;
  faq: PolicyPage;
  whatMakesKriaSpecial: PolicyPage;
  productCare: PolicyPage;
};

const DEFAULT_POLICIES: PoliciesData = {
  privacyPolicy: {
    title: "Privacy Policy",
    subtitle: "Your privacy matters to us. This policy explains what information we collect, how we use it, and the choices you have.",
    sections: [
      { heading: "Information We Collect", body: "<p>When you place an order or create an account with Kria, we may collect the following information:</p><p>Name, phone number, email address, shipping and delivery address, and payment information (processed securely via our payment partners and <strong>not stored in full by Kria</strong>).</p>" },
      { heading: "How We Use Your Information", body: "<p>We use the information you provide for the following purposes:</p><p><strong>Order processing:</strong> to confirm your order, arrange shipping, and keep you updated on delivery.</p><p><strong>Customer support:</strong> to respond to your queries, requests, or concerns.</p><p><strong>Marketing emails (optional):</strong> to send you updates, offers, and new arrivals, only if you choose to receive them. You can opt out at any time.</p>" },
      { heading: "Data Security", body: "<p>We take reasonable measures to protect your personal information.</p><p>Payments are processed through <strong>secure payment gateways</strong> that follow industry-standard encryption and security practices.</p><p>We <strong>do not sell, rent, or trade</strong> your personal data to third parties for their marketing purposes.</p>" },
      { heading: "Third-Party Services", body: "<p>To complete your orders and payments, we work with trusted third-party service providers, including payment gateways for processing online payments and shipping and courier partners for order delivery.</p><p class='text-xs md:text-sm text-gray-600 mt-1'>These partners have their own privacy and security practices, which may apply in addition to this policy.</p>" },
      { heading: "Cookies", body: "<p>Our website may use cookies and similar technologies to enhance your browsing experience. Cookies help us remember your preferences and cart items, and understand how our website is used so we can improve it over time.</p><p class='text-xs md:text-sm text-gray-600 mt-1'>You can manage or disable cookies through your browser settings, but some features of the site may not work properly without them.</p>" },
      { heading: "Your Rights", body: "<p>You have control over your personal information. You may request <strong>access, updates, or corrections</strong> to your personal details, or request <strong>deletion of your data</strong>, subject to legal or operational requirements (such as tax and accounting records).</p><p class='text-xs md:text-sm text-gray-600 mt-1'>To exercise these rights, you can contact our support team using the details on the Contact page.</p>" },
    ],
  },
  refundPolicy: {
    title: "Return & Refund Policy",
    subtitle: "We want you to love your Kria purchase. If something isn't quite right, our simple return and refund guidelines below will help you.",
    sections: [
      { heading: "Return Eligibility", body: "<p>We have a <strong>14-day return policy</strong>, which means you have 14 days after receiving your item to request a return.</p><p>To be eligible for a return, your item must be in the same condition that you received it, <strong>unworn or unused, with tags, and in its original packaging</strong>. You will also need the receipt or proof of purchase.</p>" },
      { heading: "How to Start a Return", body: "<p>To start a return, you can contact us at <a href='mailto:support@kriastore.in' class='font-semibold underline'>support@kriastore.in</a>.</p><p>If your return is accepted, we will send you a return shipping label, as well as instructions on how and where to send your package. Items sent back to us without first requesting a return will not be accepted.</p>" },
      { heading: "Damages and Issues", body: "<p>Please inspect your order upon reception and contact us immediately if the item is defective, damaged, or if you receive the wrong item, so that we can evaluate the issue and make it right.</p>" },
      { heading: "Exceptions / Non-Returnable Items", body: "<p>Certain types of items cannot be returned. For hygiene and safety reasons, <strong>accessories</strong> are non-returnable.</p><p>Please get in touch if you have questions or concerns about your specific item.</p>" },
      { heading: "Exchanges", body: "<p>The fastest way to ensure you get what you want is to return the item you have, and once the return is accepted, make a separate purchase for the new item.</p>" },
      { heading: "Refunds", body: "<p>We will notify you once we have received and inspected your return, and let you know if the refund was approved or not. If approved, you will be automatically refunded on your original payment method within <strong>10 business days</strong>. Please remember it can take some time for your bank or credit card company to process and post the refund too.</p><p class='text-xs md:text-sm text-gray-600 mt-1'>If more than 15 business days have passed since we approved your return, please contact us at <a href='mailto:support@kriastore.in' class='underline'>support@kriastore.in</a>.</p>" },
    ],
  },
  shippingPolicy: {
    title: "Shipping Policy",
    subtitle: "We aim to deliver your Kria orders quickly and safely across India, while keeping the experience smooth and transparent.",
    sections: [
      { heading: "Order Processing Time", body: "<p>Orders are typically dispatched within <strong>5\u20137 business days</strong> from the time of order confirmation, excluding Sundays and public holidays.</p><p>Orders placed before 12 PM will be processed on the same day (excluding Sundays and public holidays). Orders placed after 12 PM will be processed on the next business day.</p>" },
      { heading: "Shipping Time", body: "<p><strong>Delivery within India:</strong> 7\u201310 business days from the date of dispatch.</p><p><strong>International Shipping:</strong> Delivery timelines vary by destination and typically range from 10\u201321 business days.</p><p class='text-xs md:text-sm text-gray-600 mt-1'>Delivery timelines are estimates and may vary based on your exact location and courier partner operations.</p>" },
      { heading: "Shipping Charges", body: "<p>We offer <strong>FREE shipping across India on all orders above \u20B91,000</strong>.</p><p>For orders below \u20B91,000, a flat shipping charge may apply and will be calculated at checkout.</p><p>International shipping charges are calculated based on destination and weight at checkout.</p>" },
      { heading: "Order Tracking", body: "<p>Once your order is dispatched, a tracking link will be shared with you via <strong>email and/or SMS</strong>. You can use this link to track your shipment status in real time on our courier partner's website.</p>" },
      { heading: "Delivery Partners", body: "<p>We work with trusted third-party courier partners such as <strong>DTDC</strong> to deliver your orders safely and on time.</p><p>Courier partners are selected based on serviceability, delivery speed, and your location to ensure the best possible delivery experience.</p>" },
      { heading: "Delivery Delays", body: "<p>In certain situations, deliveries may be delayed due to factors beyond our control, including but not limited to festivals, holidays, or sale periods; weather disruptions or natural calamities; operational or logistics issues with courier partners; and local restrictions, strikes, or unforeseen events.</p><div class='border border-[#E0D0B8] bg-[#F9F6F0] px-4 py-3 flex items-start gap-3 mt-3'><p class='text-xs md:text-sm text-gray-900 leading-relaxed'><strong>Note:</strong> Kria is not responsible for delays caused by courier partners. However, our team is always here to help you with any shipment-related queries and support.</p></div>" },
    ],
  },
  tos: {
    title: "Terms & Conditions",
    subtitle: "These terms outline the rules and regulations for using Kria Boutique website and services.",
    sections: [
      { heading: "General Usage", body: "<p>By accessing and using the Kria website, you agree to comply with and be bound by these Terms &amp; Conditions. If you do not agree with any part of these terms, you should discontinue use of the site.</p>" },
      { heading: "General Conditions", body: "<p>We reserve the right to refuse service to anyone for any reason at any time. You understand that your content (not including credit card information) may be transferred unencrypted and involve transmissions over various networks. Credit card information is always encrypted during transfer over networks.</p>" },
      { heading: "Product Information & Accuracy", body: "<p>We are not responsible if information made available on this site is not accurate, complete, or current. The material is provided for general information only and should not be relied upon as the sole basis for making decisions. Any reliance on the material on this site is at your own risk.</p><p>This site may contain certain historical information. Historical information, necessarily, is not current and is provided for your reference only. We reserve the right to modify the contents of this site at any time, but we have no obligation to update any information on our site.</p>" },
      { heading: "Product Pricing", body: "<p>Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time. We shall not be liable to you or to any third-party for any modification, price change, suspension, or discontinuance of the Service.</p><p>We have made every effort to display as accurately as possible the colors and images of our products that appear at the store. We cannot guarantee that your computer monitor's display of any color will be accurate.</p>" },
      { heading: "Order Cancellation", body: "<p>We reserve the right to refuse or cancel any order you place with us. We may, in our sole discretion, limit or cancel quantities purchased per person, per household, or per order. These restrictions may include orders placed by or under the same customer account, the same credit card, and/or orders that use the same billing and/or shipping address.</p><p>In the event that we make a change to or cancel an order, we will attempt to notify you by contacting the e-mail and/or billing address/phone number provided at the time the order was made.</p>" },
      { heading: "Personal Information", body: "<p>Your submission of personal information through the site is governed by our Privacy Policy. Please review our Privacy Policy for more details on how we handle your personal data.</p>" },
      { heading: "Errors, Inaccuracies & Omissions", body: "<p>Occasionally there may be information on our site that contains typographical errors, inaccuracies, or omissions that may relate to product descriptions, pricing, promotions, offers, product shipping charges, transit times, and availability. We reserve the right to correct any errors, inaccuracies, or omissions, and to change or update information or cancel orders if any information in the Service or on any related website is inaccurate at any time without prior notice.</p>" },
      { heading: "Prohibited Uses", body: "<p>In addition to other prohibitions as set forth in the Terms &amp; Conditions, you are prohibited from using the site or its content: (a) for any unlawful purpose; (b) to solicit others to perform or participate in any unlawful acts; (c) to violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances; (d) to infringe upon or violate our intellectual property rights or the intellectual property rights of others; (e) to harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate; (f) to submit false or misleading information; (g) to upload or transmit viruses or any other type of malicious code; (h) to collect or track the personal information of others; (i) to spam, phish, pharm, pretext, spider, crawl, or scrape; (j) for any obscene or immoral purpose; or (k) to circumvent or violate any security features of the Service.</p>" },
      { heading: "Intellectual Property", body: "<p>All content on this website, including logos, images, text, graphics, and designs, is the exclusive property of Kria. Unauthorized use, reproduction, or distribution of any content is strictly prohibited.</p>" },
      { heading: "Limitation of Liability", body: "<p>We do not guarantee, represent, or warrant that your use of our service will be uninterrupted, timely, secure, or error-free. We do not warrant that the results that may be obtained from the use of the service will be accurate or reliable. You agree that from time to time we may remove the service for indefinite periods of time or cancel the service at any time, without notice to you.</p><p>In no case shall Kria, our directors, officers, employees, affiliates, agents, contractors, suppliers, service providers, or licensors be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special, or consequential damages of any kind.</p>" },
      { heading: "Indemnification", body: "<p>You agree to indemnify, defend, and hold harmless Kria and our parent, subsidiaries, affiliates, partners, officers, directors, agents, contractors, licensors, service providers, subcontractors, suppliers, and employees from any claim or demand, including reasonable attorneys' fees, made by any third-party due to or arising out of your breach of these Terms &amp; Conditions or your violation of any law or the rights of a third-party.</p>" },
      { heading: "Severability", body: "<p>In the event that any provision of these Terms &amp; Conditions is determined to be unlawful, void, or unenforceable, such provision shall nonetheless be enforceable to the fullest extent permitted by applicable law, and the unenforceable portion shall be deemed to be severed from these Terms &amp; Conditions. Such determination shall not affect the validity and enforceability of any other remaining provisions.</p>" },
      { heading: "Termination", body: "<p>The obligations and liabilities of the parties incurred prior to the termination date shall survive the termination of this agreement for all purposes. These Terms &amp; Conditions are effective unless and until terminated by either you or us. You may terminate these Terms &amp; Conditions at any time by notifying us that you no longer wish to use our Services, or when you cease using our site.</p>" },
      { heading: "Entire Agreement", body: "<p>The failure of us to exercise or enforce any right or provision of these Terms &amp; Conditions shall not constitute a waiver of such right or provision. These Terms &amp; Conditions and any policies or operating rules posted by us on this site constitute the entire agreement and understanding between you and us and govern your use of the Service, superseding any prior or contemporaneous agreements, communications, and proposals, whether oral or written, between you and us.</p>" },
      { heading: "Governing Law", body: "<p>These Terms &amp; Conditions shall be governed by and interpreted in accordance with the laws of India. Any disputes arising from the use of this website shall be subject to Indian jurisdiction.</p>" },
      { heading: "Changes to Terms & Conditions", body: "<p>You can review the most current version of the Terms &amp; Conditions at any time on this page. We reserve the right, at our sole discretion, to update, change, or replace any part of these Terms &amp; Conditions by posting updates and changes to our website. It is your responsibility to check our website periodically for changes.</p>" },
      { heading: "Contact Information", body: "<p>Questions about the Terms &amp; Conditions should be sent to us at <a href='mailto:support@kriastore.in' class='font-semibold underline'>support@kriastore.in</a>.</p>" },
    ],
  },
  aboutUs: {
    title: "About Kria",
    subtitle: "Learn more about our story, values, and the inspiration behind Kria's handcrafted artistry.",
    sections: [
      { heading: "Our Story", body: "<p>Kria is a premium handcrafted artistry brand dedicated to bringing traditional Indian craftsmanship to the modern world. We specialise in terracotta jewellery, artisanal home decor, and hand-painted silk sarees — each piece lovingly made by skilled artisans.</p><p>Our collections celebrate the beauty of handmade craft. Every product tells a story of heritage, skill, and passion — from the shaping of clay to the final brushstroke on silk.</p>" },
      { heading: "Our Mission", body: "<p>At Kria, we believe in sustainable, conscious fashion. Our creations are not mass-produced; they are shaped by hand, carrying the warmth and individuality of the artisan who made them.</p><p>Kria is more than a brand — it is a celebration of Indian artistry, empowering artisans and bringing timeless handcrafted beauty into your life.</p>" },
      { heading: "Craftsmanship", body: "<p>Every Kria product is a testament to the rich heritage of Indian craftsmanship. From the earthy tones of terracotta to the vibrant hues of hand-painted silk, our artisans pour their heart and soul into every creation.</p>" },
      { heading: "Sustainability", body: "<p>We are committed to sustainable practices. By choosing handcrafted products, you support traditional art forms, reduce mass-production waste, and contribute to a more conscious way of living.</p>" },
    ],
  },
  cancellationRefund: {
    title: "Cancellation & Refund Policy",
    subtitle: "Understand our guidelines for order cancellations and refunds.",
    sections: [
      { heading: "Order Cancellation", body: "<p>You may cancel your order within <strong>24 hours</strong> of placing it, as long as it has not yet been shipped. To cancel, please contact us at <a href='mailto:support@kriastore.in' class='font-semibold underline'>support@kriastore.in</a> with your order number.</p><p>Once the order has been shipped, it cannot be cancelled. In such cases, you may refer to our return policy once you receive the product.</p>" },
      { heading: "Refunds", body: "<p>Refunds are processed for cancelled orders (within the cancellation window) and for returned items that meet our return policy criteria.</p><p>Once we receive and inspect your return, we will notify you of the approval status. If approved, refunds are processed to your original payment method within <strong>10 business days</strong>.</p>" },
      { heading: "Refund Timeline", body: "<p>After approval, refunds typically take 5–10 business days to reflect in your account, depending on your bank or payment provider.</p><p>If more than 15 business days have passed since approval, please contact us at <a href='mailto:support@kriastore.in' class='underline'>support@kriastore.in</a>.</p>" },
      { heading: "Non-Refundable Items", body: "<p>Certain items are non-refundable, including accessories (for hygiene reasons), custom or made-to-order items, and items returned without original packaging or tags.</p>" },
    ],
  },
  shippingReturn: {
    title: "Shipping & Return Policy",
    subtitle: "Everything you need to know about shipping and returning your Kria orders.",
    sections: [
      { heading: "Shipping", body: "<p>We aim to deliver your orders quickly and safely across India and internationally.</p><p>Orders are dispatched within <strong>5–7 business days</strong>. Delivery within India takes 7–10 business days from dispatch. International timelines vary by destination (typically 10–21 business days).</p>" },
      { heading: "Shipping Charges", body: "<p>We offer <strong>free shipping across India on orders above ₹1,000</strong>. A flat charge applies for orders below this amount.</p><p>International shipping charges are calculated at checkout based on destination and weight.</p>" },
      { heading: "Return Window", body: "<p>We have a <strong>14-day return policy</strong> from the date of delivery. Items must be unworn, unused, with tags and original packaging.</p>" },
      { heading: "How to Initiate a Return", body: "<p>To start a return, email us at <a href='mailto:support@kriastore.in' class='font-semibold underline'>support@kriastore.in</a> with your order number and reason. We will provide a return shipping label and instructions.</p>" },
      { heading: "Damages & Issues", body: "<p>Please inspect your order upon delivery. If the item is defective, damaged, or incorrect, contact us immediately so we can resolve the issue.</p>" },
    ],
  },
  faq: {
    title: "Frequently Asked Questions",
    subtitle: "Everything you need to know about our handcrafted terracotta jewellery.",
    sections: [
      { heading: "What is terracotta jewellery and how is it made?", body: "<p>Terracotta jewellery is handcrafted from natural clay, shaped by hand, fired in a kiln at high temperatures, then hand-painted with eco-friendly colors and sealed with a protective finish. Each KRIA piece is made individually, so no two are ever exactly alike.</p>" },
      { heading: "Is terracotta jewellery durable?", body: "<p>Yes, when cared for properly. Avoid dropping pieces on hard surfaces, and keep them away from water and chemicals to maintain their finish over time.</p>" },
      { heading: "Is terracotta jewellery waterproof?", body: "<p>It's water-resistant, not fully waterproof. Remove your jewellery before bathing, swimming, or heavy sweating to protect the paint and clay finish.</p>" },
      { heading: "Is terracotta jewellery heavy to wear?", body: "<p>No — terracotta is naturally lighter than most metal jewellery, so even large statement pieces stay comfortable for all-day or daily wear.</p>" },
      { heading: "How do I care for my terracotta jewellery?", body: "<p>Store it in an airtight box or cloth pouch away from direct sunlight. Wipe gently with a dry cloth, and avoid water, perfume, and chemical contact to keep the color and finish intact.</p>" },
      { heading: "Will the color fade over time?", body: "<p>With proper care — avoiding sun exposure, water, and perfume — the color stays vibrant for years. Fading usually only happens with prolonged sunlight or moisture contact.</p>" },
      { heading: "Is terracotta jewellery suitable for sensitive skin?", body: "<p>Yes. Made from natural clay with no metal alloys, it's naturally hypoallergenic and safe for sensitive skin.</p>" },
      { heading: "Is terracotta jewellery eco-friendly?", body: "<p>Yes — it's made from natural, biodegradable clay and finished with eco-friendly, non-toxic colors, making it a sustainable alternative to metal or synthetic jewellery.</p>" },
      { heading: "Can I wear terracotta jewellery daily?", body: "<p>Yes, it's lightweight and comfortable for daily wear. Just avoid water, perfume, and harsh chemicals to keep it looking its best.</p>" },
      { heading: "Where can I wear terracotta jewellery?", body: "<p>It's versatile enough for casual outings, parties, and festive occasions, and pairs beautifully with boho, ethnic, and even western outfits.</p>" },
      { heading: "Can terracotta jewellery designs be customized?", body: "<p>Yes — we offer customization in color, shape, and size. Message us on Instagram or through our website to discuss your requirements.</p>" },
    ],
  },
  whatMakesKriaSpecial: {
    title: "What Makes Kria Special",
    subtitle: "Discover the essence of Kria — where tradition meets timeless artistry.",
    sections: [
      { heading: "Handcrafted with Love", body: "<p>Every Kria product is meticulously handcrafted by skilled Indian artisans. No two pieces are exactly alike, making each creation truly one-of-a-kind.</p>" },
      { heading: "Empowering Artisans", body: "<p>We work directly with artisan communities across India, providing fair wages and a platform for their incredible talent. Your purchase supports livelihoods and preserves traditional crafts.</p>" },
      { heading: "Sustainable & Conscious", body: "<p>We believe in slow, conscious fashion. Our products are made using natural materials like terracotta clay and pure silk, with minimal environmental impact.</p>" },
      { heading: "Rich Heritage", body: "<p>Each piece carries forward centuries of Indian artistic tradition — from the ancient art of terracotta sculpting to the delicate craft of hand-painting on silk.</p>" },
      { heading: "Timeless Designs", body: "<p>Our designs blend traditional aesthetics with modern sensibilities, creating pieces that are both timeless and contemporary — perfect for any occasion.</p>" },
    ],
  },
  productCare: {
    title: "Product Care",
    subtitle: "Tips and guidelines to keep your Kria products beautiful for years to come.",
    sections: [
      { heading: "Terracotta Jewellery Care", body: "<p>Terracotta is delicate and porous. Follow these tips to keep your jewellery looking its best:</p><p><strong>Avoid water:</strong> Remove before bathing, swimming, or washing hands.</p><p><strong>Keep away from chemicals:</strong> Avoid perfumes, lotions, and harsh cleaning agents.</p><p><strong>Store carefully:</strong> Wrap in soft cloth and store in a jewellery box away from direct sunlight.</p><p><strong>Clean gently:</strong> Wipe with a dry, soft cloth. Do not use water or liquid cleaners.</p>" },
      { heading: "Hand-Painted Silk Saree Care", body: "<p>Our hand-painted silk sarees are works of art. Handle them with care:</p><p><strong>Dry clean only:</strong> Always dry clean to preserve the colours and fabric.</p><p><strong>Store properly:</strong> Wrap in a muslin cloth and store in a cool, dry place away from sunlight.</p><p><strong>Avoid moisture:</strong> Keep away from damp areas to prevent colour bleeding or fabric damage.</p><p><strong>Iron carefully:</strong> Iron on low heat on the reverse side. Avoid direct heat on painted areas.</p>" },
      { heading: "Home Decor Care", body: "<p>Our artisanal home decor items require gentle care:</p><p><strong>Dust regularly:</strong> Use a soft, dry cloth or a gentle duster.</p><p><strong>Avoid direct sunlight:</strong> Prolonged exposure may fade colours over time.</p><p><strong>Keep dry:</strong> Avoid contact with water or moisture.</p><p><strong>Handle with care:</strong> Many items are handcrafted and may be fragile.</p>" },
      { heading: "General Tips", body: "<p>To ensure the longevity of all Kria products, keep them away from sharp objects that may snag or scratch the surface, store them in a cool, dry place away from direct heat and sunlight, and handle them with clean, dry hands.</p><p>With proper care, your Kria products will remain beautiful for years to come.</p>" },
    ],
  },
};

export function usePolicies() {
  const [policies, setPolicies] = useState<PoliciesData>(DEFAULT_POLICIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) { setLoading(false); return; }
    const ref = doc(db!, "settings", "policies");
    getDoc(ref).then((snap) => {
      if (snap.exists()) {
        setPolicies({ ...DEFAULT_POLICIES, ...snap.data() } as PoliciesData);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const savePolicies = async (data: PoliciesData) => {
    if (!db) return;
    await setDoc(doc(db!, "settings", "policies"), data);
    setPolicies(data);
  };

  return { policies, loading, savePolicies };
}
