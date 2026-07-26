"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FAQPage() {
  const router = useRouter();
  const [askDirect, setAskDirect] = useState(true);
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
        setAskDirect(false);
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
    <div className="bg-white min-h-screen flex flex-col">
      <main className="px-0 sm:px-4 pt-12 pb-0 max-w-6xl mx-auto flex-1">
        <div>
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl md:text-4xl font-semibold text-[#2D2D2D]">Contact Us</h1>
            <button 
              onClick={() => router.push("/")} 
              className="font-semibold text-[#2D2D2D] hover:text-[#D2693F] cursor-pointer transition"
            >
              Back
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 md:gap-8 items-start">
            {/* Contact Details */}
            <div className="bg-[#F9F6F0] border border-[#E8E0D8] p-6 sm:col-span-1 shadow-sm">
              <h2 className="text-xl font-semibold text-[#2D2D2D] mb-4">Get in Touch</h2>
              <div className="space-y-3 text-[#2D2D2D]">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5">📞</div>
                  <span className="font-medium">+91 98765 43210</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5">✉️</div>
                  <span className="font-medium">hello@kria.in</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5">🕒</div>
                  <span className="font-medium">10:00 AM – 7:00 PM IST</span>
                </div>
              </div>
            </div>

            {/* Ask Directly Form */}
            <div className="bg-[#F9F6F0] border border-[#E8E0D8] p-6 sm:col-span-2 shadow-sm">
              <h2 className="text-xl font-semibold text-[#2D2D2D] mb-4">Ask Directly</h2>
              
              {sent && (
                <div className="mb-4 px-4 py-2 bg-[#F9F6F0] text-[#2D2D2D] border border-[#E0D0B8] font-semibold">
                  {sent}
                </div>
              )}

              {!askDirect ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Have a specific question? Send us a message directly!</p>
                  <button
                    onClick={() => setAskDirect(true)}
                    className="px-6 py-3 bg-[#D2693F] text-white font-semibold hover:bg-[#B85A34] transition shadow-md cursor-pointer"
                  >
                    Send Message
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#2D2D2D] mb-1">Name</label>
                      <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full border border-[#E8E0D8] bg-white text-[#2D2D2D] px-3 py-2 focus:border-[#C5A059] focus:outline-none transition"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#2D2D2D] mb-1">Email</label>
                      <input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        type="email"
                        className="w-full border border-[#E8E0D8] bg-white text-[#2D2D2D] px-3 py-2 focus:border-[#C5A059] focus:outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#2D2D2D] mb-1">Message</label>
                    <textarea 
                      value={message} 
                      onChange={e => setMessage(e.target.value)} 
                      className="w-full border border-[#E8E0D8] bg-white text-[#2D2D2D] px-3 py-2 focus:border-[#C5A059] focus:outline-none transition" 
                      rows={4} 
                      required 
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button 
                      type="button" 
                      onClick={() => setAskDirect(false)} 
                      className="px-4 py-2 border border-[#E8E0D8] text-[#2D2D2D] hover:bg-white cursor-pointer transition"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={sending} 
                      className="px-4 py-2 bg-[#D2693F] text-white font-semibold hover:bg-[#B85A34] shadow-md cursor-pointer transition disabled:opacity-50"
                    >
                      {sending ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
