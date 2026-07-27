"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FAQPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const COMMON_SUBJECT = "Website Inquiry (FAQ)";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSent(null);

    try {
      const res = await fetch("/api/send-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subject: COMMON_SUBJECT, email, message }),
      });

      if (res.ok) {
        setSent("Message sent — we'll get back to you soon.");
        setName("");
        setEmail("");
        setMessage("");
        setTimeout(() => setSent(null), 4000);
      } else {
        const json = await res.json();
        setSent(json?.error || "Failed to send message.");
      }
    } catch (err: any) {
      setSent(err?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      {/* Hero */}
      <div className="bg-[#2D2D2D] py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#C5A059] mb-3 font-semibold">We'd love to hear from you</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "Tenor Sans, serif" }}>Contact Us</h1>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Whether you have a question about orders, products, or just want to say hello — our team is here to help.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-8 pb-16">
        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {/* Phone */}
          <a
            href="tel:+919894414445"
            className="bg-white rounded-xl p-6 border border-[#E0D0B8] flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#F3EDE4" }}>
              <svg className="w-5 h-5" style={{ color: "#D2693F" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#9A6E50] mb-0.5">Call Us</p>
              <p className="text-sm font-semibold text-[#2D2D2D]">+91 98944 14445</p>
            </div>
          </a>

          {/* Email */}
          <a
            href="mailto:Kriastore@gmail.com"
            className="bg-white rounded-xl p-6 border border-[#E0D0B8] flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#F3EDE4" }}>
              <svg className="w-5 h-5" style={{ color: "#D2693F" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#9A6E50] mb-0.5">Email Us</p>
              <p className="text-sm font-semibold text-[#2D2D2D]">Kriastore@gmail.com</p>
            </div>
          </a>

          {/* Hours */}
          <div className="bg-white rounded-xl p-6 border border-[#E0D0B8] flex items-center gap-4">
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#F3EDE4" }}>
              <svg className="w-5 h-5" style={{ color: "#D2693F" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#9A6E50] mb-0.5">Business Hours</p>
              <p className="text-sm font-semibold text-[#2D2D2D]">10 AM – 7 PM IST</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-[#E0D0B8] overflow-hidden">
              <div className="px-6 py-5 border-b border-[#E0D0B8]">
                <h2 className="text-lg font-bold text-[#2D2D2D]" style={{ fontFamily: "Tenor Sans, serif" }}>Send a Message</h2>
                <p className="text-xs text-[#9A6E50] mt-1">Fill out the form and we'll respond within 24 hours.</p>
              </div>

              <div className="p-6">
                {sent && (
                  <div className="mb-5 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2" style={{ backgroundColor: "#F3EDE4", color: "#D2693F", border: "1px solid #E0D0B8" }}>
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {sent}
                  </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#9A6E50] mb-1.5">Name</label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-colors"
                        style={{ border: "1px solid #E0D0B8", backgroundColor: "#F9F6F0", color: "#2D2D2D" }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#D2693F")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#E0D0B8")}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#9A6E50] mb-1.5">Email</label>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-colors"
                        style={{ border: "1px solid #E0D0B8", backgroundColor: "#F9F6F0", color: "#2D2D2D" }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#D2693F")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#E0D0B8")}
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#9A6E50] mb-1.5">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-colors resize-none"
                      style={{ border: "1px solid #E0D0B8", backgroundColor: "#F9F6F0", color: "#2D2D2D" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#D2693F")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#E0D0B8")}
                      rows={5}
                      placeholder="How can we help you?"
                      required
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={sending}
                      className="px-8 py-3 text-sm font-bold tracking-wide rounded-xl transition-all disabled:opacity-50"
                      style={{
                        backgroundColor: sending ? "#E0D0B8" : "#D2693F",
                        color: sending ? "#9A6E50" : "#fff",
                      }}
                    >
                      {sending ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-[#E0D0B8] p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#9A6E50] mb-4">Other Ways to Reach Us</h3>
              <div className="space-y-4">
                <a
                  href="https://wa.me/919894414445"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#F3EDE4" }}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#D2693F">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2D2D2D] group-hover:text-[#D2693F] transition-colors">WhatsApp</p>
                    <p className="text-xs text-[#9A6E50]">Chat with us instantly</p>
                  </div>
                </a>

                <a
                  href="https://www.instagram.com/kria_terracotta_jewellery"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#F3EDE4" }}>
                    <svg className="w-5 h-5" style={{ color: "#D2693F" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <rect x="2" y="2" width="20" height="20" rx="5" />
                      <circle cx="12" cy="12" r="5" />
                      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2D2D2D] group-hover:text-[#D2693F] transition-colors">Instagram</p>
                    <p className="text-xs text-[#9A6E50]">@kria_terracotta_jewellery</p>
                  </div>
                </a>

                <a
                  href="https://facebook.com/kriacrafts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#F3EDE4" }}>
                    <svg className="w-5 h-5" style={{ color: "#D2693F" }} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2D2D2D] group-hover:text-[#D2693F] transition-colors">Facebook</p>
                    <p className="text-xs text-[#9A6E50]">@kriacrafts</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E0D0B8] p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#9A6E50] mb-3">Quick Help</h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <span className="text-[#D2693F] mt-0.5">·</span>
                  <span className="text-[#2D2D2D]">Order queries: Share your Order ID from the confirmation email</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-[#D2693F] mt-0.5">·</span>
                  <span className="text-[#2D2D2D]">Custom orders: Mention your preferred design, size, and colours</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-[#D2693F] mt-0.5">·</span>
                  <span className="text-[#2D2D2D]">Returns: We accept returns within 7 days of delivery</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
