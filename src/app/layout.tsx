import type { Metadata } from "next";
import { Tenor_Sans, Playfair_Display, Great_Vibes, Montserrat, Alex_Brush } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { SearchProvider } from "@/context/SearchContext";
import { CartSidebarProvider } from "@/context/CartSidebarContext";
import SiteShell from "@/components/SiteShell";


const tenorSans = Tenor_Sans({
  variable: "--font-tenor-sans",
  subsets: ["latin"],
  weight: "400",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: "400",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const alexBrush = Alex_Brush({
  variable: "--font-alex-brush",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Kria | Handcrafted Artisanal Jewellery & Home Decor",
  description:
    "Kria brings you premium handcrafted terracotta jewellery, artisanal home decor, and hand-painted silk sarees — made with love by Indian artisans.",
  keywords: [
    "handcrafted jewellery",
    "terracotta jewellery",
    "home decor",
    "hand-painted silk sarees",
    "artisanal Indian crafts",
    "Kria",
  ],
  openGraph: {
    title: "Kria | Handcrafted Artisanal Jewellery & Home Decor",
    description:
      "Premium handcrafted terracotta jewellery, artisanal home decor, and hand-painted silk sarees.",
    siteName: "Kria",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};




export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />

      </head>
      <body
      className={`${tenorSans.variable} ${playfairDisplay.variable} ${greatVibes.variable} ${montserrat.variable} ${alexBrush.variable} antialiased min-h-screen bg-[#F9F6F0] text-[#2D2D2D]`}
  style={{ fontFamily: "'Tenor Sans', var(--font-tenor-sans), sans-serif" }}
>

        <AuthProvider>
          <CartProvider>
            <CartSidebarProvider>
              <SearchProvider>
                <SiteShell>{children}</SiteShell>
              </SearchProvider>
            </CartSidebarProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
