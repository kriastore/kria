"use client";
import Image from "next/image";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCartSidebar } from "@/context/CartSidebarContext";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { useAdmin } from "@/hooks/useAdmin";
import SearchOverlay from "@/components/SearchOverlay";

function NavbarContent() {
  const router = useRouter();
  const pathname = usePathname();

  const { totalItems, pulse } = useCart();
  const { user, loading } = useAuth();
  const { isAdmin } = useAdmin(user);
  const { openCart } = useCartSidebar();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      const menuBox = document.getElementById("hamburger-menu");
      if (menuBox && !menuBox.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClick(e: MouseEvent) {
      const userMenuBox = document.getElementById("user-menu");
      if (userMenuBox && !userMenuBox.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenuOpen]);

  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  return (
    <>
      {/* Search Overlay */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Sliding Sidebar Menu */}
      <div id="hamburger-menu">
        <div
          className={`fixed inset-0 z-[50] bg-black/40 transition-opacity duration-300 ${
            menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={`fixed left-0 top-0 bottom-0 z-[60] bg-[#F9F6F0] text-[#2D2D2D] shadow-xl transition-transform duration-300 ease-in-out w-full sm:w-[360px] lg:w-[420px] ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between mx-4 sm:mx-6 py-4 border-b border-[#E0D0B8]">
            <h2 className="text-lg sm:text-xl text-[#2D2D2D]" style={{ fontFamily: "'Tenor Sans', serif" }}>Menu</h2>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-2 hover:bg-[#F3EDE4] text-[#2D2D2D] min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="p-4 sm:p-6 overflow-y-auto" style={{ height: "calc(100% - 65px)" }}>
            <div className="space-y-2 sm:space-y-4">
              {[
                { href: "/", label: "Home" },
                { href: "/shop", label: "Shop" },
                { href: "/faq", label: "Contact Us" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block py-3 px-4 text-base sm:text-lg text-[#2D2D2D] hover:bg-[#F3EDE4] transition-colors min-h-[48px] flex items-center"
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    window.location.href = item.href;
                  }}
                >
                  {item.label}
                </Link>
              ))}

              <div className="border-t border-[#E0D0B8] pt-4 mt-6">
                {[
                  { href: "/privacy-policy", label: "Privacy Policy" },
                  { href: "/refund-policy", label: "Return & Refund" },
                  { href: "/shipping-policy", label: "Shipping Policy" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block py-3 px-4 text-base sm:text-lg text-[#2D2D2D] hover:bg-[#F3EDE4] transition-colors min-h-[48px] flex items-center"
                    onClick={() => { setMenuOpen(false); window.location.href = item.href; }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="md:hidden">
                {user ? (
                  <div className="border-t border-[#E0D0B8] pt-4 mt-6">
                    <Link
                      href="/orders"
                      className="block py-3 px-4 text-base sm:text-lg text-[#2D2D2D] hover:bg-[#F3EDE4] transition-colors min-h-[48px] flex items-center"
                      onClick={() => { setMenuOpen(false); router.push("/orders"); }}
                    >
                      My Orders
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="block py-3 px-4 text-base sm:text-lg text-[#D2693F] font-medium hover:bg-[#F3EDE4] transition-colors min-h-[48px] flex items-center"
                        onClick={() => { setMenuOpen(false); router.push("/admin"); }}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => { setMenuOpen(false); handleSignOut(); }}
                      className="block w-full text-left py-3 px-4 text-base sm:text-lg text-[#2D2D2D] hover:bg-[#F3EDE4] transition-colors min-h-[48px] flex items-center"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-[#E0D0B8] pt-4 mt-6">
                    <Link
                      href="/sign-in"
                      className="block py-3 px-4 text-base sm:text-lg text-[#2D2D2D] hover:bg-[#F3EDE4] transition-colors min-h-[48px] flex items-center"
                      onClick={() => { setMenuOpen(false); window.location.href = "/sign-in"; }}
                    >
                      Sign In
                    </Link>
                  </div>
                )}
              </div>

              <div className="border-t border-[#E0D0B8] pt-4 mt-6">
                <div className="flex space-x-4 px-4">
                  <a href="#" className="text-[#2D2D2D] hover:text-[#D2693F] transition-colors" aria-label="Instagram">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm4.25 3.25a5.25 5.25 0 1 1 0 10.5a5.25 5.25 0 0 1 0-10.5zm0 1.5a3.75 3.75 0 1 0 0 7.5a3.75 3.75 0 0 0 0-7.5zm5.25.75a1 1 0 1 1-2 0a1 1 0 0 1 2 0z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-[100] backdrop-blur-md bg-white border-b border-[#E8E0D8]">
        <div className="relative flex items-center justify-between px-4 sm:px-6 md:px-10 py-3 sm:py-4 text-white">
          <div className="flex w-full items-center justify-between relative min-h-[48px]">
            {/* Hamburger */}
            <div className="flex items-center h-full">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 sm:p-2 md:p-2 hover:bg-[#F3EDE4] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Menu"
              >
                <div className="space-y-[5px]">
                  <div className="w-[18px] sm:w-[20px] h-[1.5px] bg-[#2D2D2D]"></div>
                  <div className="w-[18px] sm:w-[20px] h-[1.5px] bg-[#2D2D2D]"></div>
                  <div className="w-[18px] sm:w-[20px] h-[1.5px] bg-[#2D2D2D]"></div>
                </div>
              </button>
            </div>

            {/* Brand Logo */}
            <Link
              href="/"
              className="block absolute left-1/2 -translate-x-1/2"
            >
              <Image
                src="/navbarlogo.png"
                alt="KRIA"
                width={160}
                height={48}
                className="h-16 md:h-20 w-auto object-contain"
                priority
              />
            </Link>

            {/* Right side: search, user, cart */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 h-full">
              {/* Search */}
              <button
                type="button"
                aria-label="Open search"
                className="p-2 hover:bg-[#F3EDE4] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                onClick={() => setSearchOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-[#2D2D2D]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </button>

              {/* User */}
              <div className="hidden md:block relative" id="user-menu" onMouseEnter={() => setUserMenuOpen(true)} onMouseLeave={() => setUserMenuOpen(false)}>
                {loading ? (
                  <div className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-[#E0D0B8] border-t-[#2D2D2D] animate-spin"></div>
                  </div>
                ) : user ? (
                  <>
                    <button
                      type="button"
                      aria-label="User menu"
                      onClick={() => setUserMenuOpen((s) => !s)}
                      className="p-2 hover:bg-[#F3EDE4] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-[#2D2D2D]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </button>
                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-0 w-48 bg-[#F9F6F0] shadow-lg border border-[#E0D0B8] py-2 z-50">
                        <Link href="/orders" className="flex items-center px-4 py-2 text-sm text-[#2D2D2D] hover:bg-[#F3EDE4] transition-colors" onClick={() => setUserMenuOpen(false)}>
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M8 11v6h8v-6H8z" />
                          </svg>
                          My Orders
                        </Link>
                        {isAdmin && (
                          <Link href="/admin" className="flex items-center px-4 py-2 text-sm font-medium text-[#D2693F] hover:bg-[#F3EDE4] transition-colors" onClick={() => setUserMenuOpen(false)}>
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                            </svg>
                            Admin Dashboard
                          </Link>
                        )}
                        <button onClick={() => { setUserMenuOpen(false); handleSignOut(); }} className="flex items-center w-full px-4 py-2 text-sm text-[#2D2D2D] hover:bg-[#F3EDE4] transition-colors">
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Link href="/sign-in" className="p-2 hover:bg-[#F3EDE4] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Sign in">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-[#2D2D2D]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676-.584-5.216-.584-7.499-1.632z" />
                    </svg>
                  </Link>
                )}
              </div>

              {/* Cart */}
              <button
                type="button"
                onClick={openCart}
                className={`relative p-2 text-[#2D2D2D] hover:bg-[#F3EDE4] transition-all flex items-center justify-center ${
                  pulse ? "ring-4 ring-[#2D2D2D] animate-pulse px-2 py-1" : ""
                }`}
                style={{ minWidth: "2.5rem", minHeight: "2.5rem" }}
                aria-label="Open cart"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-[#2D2D2D]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#D2693F] text-white text-xs px-1.5 py-0.5 font-bold">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<header className="bg-[#F5F5F5] h-16"></header>}>
      <NavbarContent />
    </Suspense>
  );
}
