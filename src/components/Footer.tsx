import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#F9F6F0] text-[#2D2D2D] py-10 px-4 w-full">
      <div className="max-w-7xl mx-auto">

        {/* Top Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left border-b border-[#E8E0D8] pb-8">

          {/* Policies */}
          <div>
            <h4 className="text-[#2D2D2D] font-semibold text-lg mb-4">
              Policies
            </h4>

            <ul className="space-y-2 text-sm mb-4">
              <li><a href="/shipping-policy" className="hover:underline">Shipping Policy</a></li>
              <li><a href="/refund-policy" className="hover:underline">Return & Refund</a></li>
              <li><a href="/privacy-policy" className="hover:underline">Privacy Policy</a></li>
              <li><a href="/tos" className="hover:underline">Terms & Conditions</a></li>
              <li><a href="/about-us" className="hover:underline">About Us</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[#2D2D2D] font-semibold text-lg mb-4">
              Contact
            </h4>

            <ul className="space-y-2 text-sm">
              <li>📞 +91 98944 14445</li>
              <li>✉️ Kriastore@gmail.com</li>
              <li>📍 India</li>
              <li>🕘 10:00 AM – 7:00 PM IST</li>
            </ul>
          </div>

          {/* Follow */}
          <div>
            <h4 className="text-[#2D2D2D] font-semibold text-lg mb-4">
              Follow
            </h4>

            <div className="flex justify-center md:justify-start gap-5">

              {/* Instagram */}
              <a
                href="https://www.instagram.com/kria_terracotta_jewellery"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:opacity-70"
              >
                <svg className="w-5 h-5 fill-[#2D2D2D]" viewBox="0 0 24 24">
                  <path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm10 2a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3h10zm-5 3.5A4.5 4.5 0 1016.5 12 4.5 4.5 0 0012 7.5zm0 7.4a2.9 2.9 0 112.9-2.9 2.9 2.9 0 01-2.9 2.9zm4.8-8.9a1.1 1.1 0 11-1.1-1.1 1.1 1.1 0 011.1 1.1z"/>
                </svg>
              </a>

              {/* Facebook */}
              <a
                href="https://facebook.com/kriacrafts"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hover:opacity-70"
              >
                <svg className="w-5 h-5 fill-[#2D2D2D]" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                </svg>
              </a>

            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="text-center pt-6 text-sm text-[#2D2D2D]">
          <span
            className="block mx-auto text-xl md:text-2xl tracking-wide font-semibold"
            style={{ fontWeight: 600 }}
          >
            KRIA
          </span>
        </div>

      </div>
    </footer>
  );
}
