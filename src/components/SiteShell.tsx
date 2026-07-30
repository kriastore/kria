"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isAuth = pathname === "/sign-in" || pathname === "/sign-up";
  const isCheckout = pathname === "/checkout";

  if (isAdmin || isAuth) {
    return <>{children}</>;
  }

  if (isCheckout) {
    return <><CartSidebar />{children}<FloatingWhatsApp /></>;
  }

  return (
    <>
      <Navbar />
      <CartSidebar />
      {children}
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
