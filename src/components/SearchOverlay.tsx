"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { db } from "@/firebase";
import { collection, query, getDocs } from "firebase/firestore";
import ProductImage from "@/components/ProductImage";
import PriceText from "@/components/PriceText";
import { resolvePricing } from "@/utils/pricing";
import { getProductSlug } from "@/utils/productSlug";

interface Product {
  id?: string;
  ProductName?: string;
  Description?: string;
  Category?: string;
  Product?: string;
  Price?: number | string;
  OriginalPrice?: number | string;
  DiscountPercent?: number | string;
  ImageUrl1?: string;
  ImageUrl1Medium?: string;
  ImageUrl1Thumb?: string;
  [key: string]: unknown;
}

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && !loaded && db) {
      getDocs(query(collection(db, "inventory"))).then((snap) => {
        const items = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setAllProducts(items);
        setLoaded(true);
      });
    }
  }, [open, loaded]);

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setResults([]);
    }
  }, [open]);

  const filterProducts = useCallback(
    (term: string) => {
      if (!term.trim()) {
        setResults([]);
        setIsSearching(false);
        return;
      }
      const lower = term.toLowerCase();
      const filtered = allProducts.filter((p) => {
        const fields = [
          p.ProductName,
          p.Description,
          p.Category,
          p.Product,
        ];
        return fields.some(
          (f) => f && f.toString().toLowerCase().includes(lower)
        );
      });
      setResults(filtered);
      setIsSearching(false);
    },
    [allProducts]
  );

  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);
      setIsSearching(true);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => filterProducts(term), 300);
    },
    [filterProducts]
  );

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const productName = (p: Product) =>
    p.ProductName || p.Description || p.Product || "Unnamed Product";

  return (
    <div
      className={`fixed inset-0 z-[200] transition-opacity duration-200 ${
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />

      {/* Mobile: full height from top. Desktop: centered panel */}
      <div
        className={`relative z-10 w-full h-full sm:h-auto sm:max-w-2xl sm:mx-auto sm:mt-[10vh] bg-[#F9F6F0] flex flex-col transition-all duration-300 ${
          visible
            ? "translate-y-0 opacity-100"
            : "-translate-y-4 opacity-0"
        } sm:max-h-[80vh] sm:border sm:border-[#E0D0B8]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#E0D0B8] flex-shrink-0">
          <h2
            className="text-lg sm:text-xl text-[#2D2D2D]"
            style={{ fontFamily: "'Tenor Sans', serif" }}
          >
            Search
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[#2D2D2D] hover:bg-[#F3EDE4] transition-colors text-xl leading-none"
            aria-label="Close search"
          >
            ×
          </button>
        </div>

        {/* Search Input */}
        <div className="px-5 sm:px-6 py-3 border-b border-[#E0D0B8] flex-shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search for products..."
            className="w-full py-3 px-0 text-base sm:text-lg bg-transparent text-[#2D2D2D] placeholder:text-[#999] focus:outline-none"
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-6 sm:pb-6">
          {isSearching && (
            <p className="py-8 text-center text-[#2D2D2D] opacity-60">
              Searching...
            </p>
          )}

          {!searchTerm.trim() && !isSearching && (
            <div className="py-16 flex flex-col items-center gap-3 text-[#2D2D2D] opacity-40">
              <svg
                className="w-14 h-14"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  strokeWidth={1.5}
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <p
                className="text-base"
                style={{ fontFamily: "'Tenor Sans', serif" }}
              >
                Start typing to search products
              </p>
            </div>
          )}

          {searchTerm.trim() &&
            !isSearching &&
            results.length === 0 &&
            loaded && (
              <div className="py-12 text-center text-[#2D2D2D]">
                <p className="text-base font-medium mb-1">No products found</p>
                <p className="text-sm opacity-60">Try a different term</p>
              </div>
            )}

          {!isSearching && results.length > 0 && (
            <div className="divide-y divide-[#E0D0B8]">
              {results.map((product) => {
                const pricing = resolvePricing({
                  Price: product.Price,
                  OriginalPrice: product.OriginalPrice,
                  DiscountPercent: product.DiscountPercent,
                });
                const slug = encodeURIComponent(getProductSlug(product));

                return (
                  <Link
                    key={product.id}
                    href={`/product/${slug}`}
                    onClick={onClose}
                    className="flex items-center gap-4 py-4 hover:bg-[#F3EDE4] transition-colors -mx-5 sm:-mx-6 px-5 sm:px-6"
                  >
                    <ProductImage
                      src={product.ImageUrl1 as string}
                      srcMedium={product.ImageUrl1Medium as string}
                      srcThumb={product.ImageUrl1Thumb as string}
                      size="thumb"
                      alt={productName(product)}
                      className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 border border-[#E0D0B8] overflow-hidden"
                    />
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base text-[#2D2D2D] truncate">
                        {productName(product)}
                      </p>
                      <PriceText
                        amount={pricing.selling}
                        className="text-sm text-[#D2693F] mt-1"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
