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
};

const DEFAULT_POLICIES: PoliciesData = {
  privacyPolicy: {
    title: "Privacy Policy",
    subtitle: "Your privacy matters to us. This policy explains what information we collect, how we use it, and the choices you have.",
    sections: [
      { heading: "Information We Collect", body: "<p>When you place an order or create an account with Kria, we may collect the following information:</p><ul><li>Name</li><li>Phone number</li><li>Email address</li><li>Shipping and delivery address</li><li>Payment information (processed securely via our payment partners and <strong>not stored in full by Kria</strong>)</li></ul>" },
      { heading: "How We Use Your Information", body: "<p>We use the information you provide for the following purposes:</p><ul><li><strong>Order processing:</strong> to confirm your order, arrange shipping, and keep you updated on delivery.</li><li><strong>Customer support:</strong> to respond to your queries, requests, or concerns.</li><li><strong>Marketing emails (optional):</strong> to send you updates, offers, and new arrivals, only if you choose to receive them. You can opt out at any time.</li></ul>" },
      { heading: "Data Security", body: "<p>We take reasonable measures to protect your personal information.</p><ul><li>Payments are processed through <strong>secure payment gateways</strong> that follow industry-standard encryption and security practices.</li><li>We <strong>do not sell, rent, or trade</strong> your personal data to third parties for their marketing purposes.</li></ul>" },
      { heading: "Third-Party Services", body: "<p>To complete your orders and payments, we work with trusted third-party service providers, including:</p><ul><li>Payment gateways for processing online payments</li><li>Shipping and courier partners for order delivery</li></ul><p class='text-xs md:text-sm text-gray-600 mt-1'>These partners have their own privacy and security practices, which may apply in addition to this policy.</p>" },
      { heading: "Cookies", body: "<p>Our website may use cookies and similar technologies to enhance your browsing experience. Cookies help us:</p><ul><li>Remember your preferences and cart items</li><li>Understand how our website is used and improve it over time</li></ul><p class='text-xs md:text-sm text-gray-600 mt-1'>You can manage or disable cookies through your browser settings, but some features of the site may not work properly without them.</p>" },
      { heading: "Your Rights", body: "<p>You have control over your personal information. You may:</p><ul><li>Request <strong>access, updates, or corrections</strong> to your personal details.</li><li>Request <strong>deletion of your data</strong>, subject to legal or operational requirements (such as tax and accounting records).</li></ul><p class='text-xs md:text-sm text-gray-600 mt-1'>To exercise these rights, you can contact our support team using the details on the Contact page.</p>" },
    ],
  },
  refundPolicy: {
    title: "Return & Refund Policy",
    subtitle: "We want you to love your Kria purchase. If something isn't quite right, our simple return and refund guidelines below will help you.",
    sections: [
      { heading: "Return Eligibility", body: "<p>We have a <strong>14-day return policy</strong>, which means you have 14 days after receiving your item to request a return.</p><p>To be eligible for a return, your item must be in the same condition that you received it, <strong>unworn or unused, with tags, and in its original packaging</strong>. You will also need the receipt or proof of purchase.</p>" },
      { heading: "How to Start a Return", body: "<p>To start a return, you can contact us at <a href='mailto:Kriastore@gmail.com' class='font-semibold underline'>Kriastore@gmail.com</a>.</p><p>If your return is accepted, we will send you a return shipping label, as well as instructions on how and where to send your package. Items sent back to us without first requesting a return will not be accepted.</p>" },
      { heading: "Damages and Issues", body: "<p>Please inspect your order upon reception and contact us immediately if the item is defective, damaged, or if you receive the wrong item, so that we can evaluate the issue and make it right.</p>" },
      { heading: "Exceptions / Non-Returnable Items", body: "<p>Certain types of items cannot be returned. For hygiene and safety reasons, <strong>accessories</strong> are non-returnable.</p><p>Please get in touch if you have questions or concerns about your specific item.</p>" },
      { heading: "Exchanges", body: "<p>The fastest way to ensure you get what you want is to return the item you have, and once the return is accepted, make a separate purchase for the new item.</p>" },
      { heading: "Refunds", body: "<p>We will notify you once we have received and inspected your return, and let you know if the refund was approved or not. If approved, you will be automatically refunded on your original payment method within <strong>10 business days</strong>. Please remember it can take some time for your bank or credit card company to process and post the refund too.</p><p class='text-xs md:text-sm text-gray-600 mt-1'>If more than 15 business days have passed since we approved your return, please contact us at <a href='mailto:Kriastore@gmail.com' class='underline'>Kriastore@gmail.com</a>.</p>" },
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
      { heading: "Delivery Delays", body: "<p>In certain situations, deliveries may be delayed due to factors beyond our control, including but not limited to:</p><ul><li>Festivals, holidays, or sale periods</li><li>Weather disruptions or natural calamities</li><li>Operational or logistics issues with courier partners</li><li>Local restrictions, strikes, or unforeseen events</li></ul><div class='border border-[#E0D0B8] bg-[#F9F6F0] px-4 py-3 flex items-start gap-3 mt-3'><p class='text-xs md:text-sm text-gray-900 leading-relaxed'><strong>Note:</strong> Kria is not responsible for delays caused by courier partners. However, our team is always here to help you with any shipment-related queries and support.</p></div>" },
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
      { heading: "Contact Information", body: "<p>Questions about the Terms &amp; Conditions should be sent to us at <a href='mailto:Kriastore@gmail.com' class='font-semibold underline'>Kriastore@gmail.com</a>.</p>" },
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
        setPolicies(snap.data() as PoliciesData);
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
