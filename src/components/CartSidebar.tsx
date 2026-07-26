"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartSidebar } from "@/context/CartSidebarContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import {
  readGuestCartFromCookie,
  writeGuestCartToCookie,
} from "@/context/CartContext";
import ProductImage from "@/components/ProductImage";
import PriceText from "@/components/PriceText";
import { resolvePricing } from "@/utils/pricing";
import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  updateDoc,
  addDoc,
  deleteDoc,
  doc as firestoreDoc,
} from "firebase/firestore";

type CartItem = {
  docId?: string;
  ID: number | string;
  Quantity: number;
  Size?: string;
  UserMail?: string;
  AddedOn?: string;
  isCustomized?: boolean;
  customizationText?: string;
  customPrice?: number;
};

type InventoryItem = {
  ID: number | string;
  Description?: string;
  Product?: string;
  ProductName?: string;
  ImageUrl1?: string;
  ImageUrl1Medium?: string;
  ImageUrl1Thumb?: string;
  ImageUrl2?: string;
  ImageUrl2Medium?: string;
  ImageUrl2Thumb?: string;
  ImageUrl3?: string;
  ImageUrl3Medium?: string;
  ImageUrl3Thumb?: string;
  Price?: number | string;
  OriginalPrice?: number | string;
  DiscountPercent?: number | string;
  Stock?: number;
  StockS?: number;
  StockM?: number;
  StockL?: number;
  StockXL?: number;
  _docId?: string;
};

export default function CartSidebar() {
  const router = useRouter();
  const { open, closeCart } = useCartSidebar();
  const { user, loading } = useAuth();
  const { syncTotal } = useCart();
  const postAuthHandled = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [inventoryMap, setInventoryMap] = useState<
    Record<string, InventoryItem>
  >({});
  const [transitioning, setTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Track mount for mount/unmount animation
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Escape key closes sidebar
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, closeCart]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Handle deferred add-to-cart after login
  useEffect(() => {
    if (loading) return;
    if (!user?.email) return;
    if (postAuthHandled.current) return;

    const raw =
      typeof window !== "undefined"
        ? sessionStorage.getItem("postAuthAction")
        : null;
    if (!raw) return;

    const action = JSON.parse(raw);
    if (action.type !== "ADD_TO_CART") return;

    postAuthHandled.current = true;

    const addAfterAuth = async () => {
      const fdb = db;
      if (!fdb) return;
      const cartRef = collection(fdb, "Cart");

      const q = query(
        cartRef,
        where("UserMail", "==", user.email),
        where("ID", "==", action.payload.productId),
        where("Size", "==", action.payload.size)
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        const ref = snap.docs[0].ref;
        const prevQty = (snap.docs[0].data() as any).Quantity || 0;
        await updateDoc(ref, { Quantity: prevQty + action.payload.quantity });
      } else {
        await addDoc(cartRef, {
          ID: action.payload.productId,
          Quantity: action.payload.quantity,
          Size: action.payload.size,
          UserMail: user.email,
        });
      }

      sessionStorage.removeItem("postAuthAction");
    };

    addAfterAuth();
  }, [user, loading]);

  // Load cart items from Firestore (logged-in) or cookie (guest)
  useEffect(() => {
    let unsub: (() => void) | undefined;
    setLoadingItems(true);

    if (user && user.email && db) {
      const fdb = db;
      const colRef = collection(fdb, "Cart");
      const q = query(colRef, where("UserMail", "==", user.email));
      unsub = onSnapshot(
        q,
        (snap) => {
          const rows: CartItem[] = snap.docs.map((d) => ({
            docId: d.id,
            ...(d.data() as any),
          }));
          setItems(rows);
          setLoadingItems(false);
        },
        (err) => {
          console.error("Cart onSnapshot error", err);
          setItems([]);
          setLoadingItems(false);
        }
      );
    } else {
      const guest = readGuestCartFromCookie();
      setItems(guest || []);
      setLoadingItems(false);
    }

    return () => {
      if (unsub) unsub();
    };
  }, [user]);

  // Load inventory for product details
  useEffect(() => {
    if (!db) return;
    const fdb = db;

    async function loadInventory() {
      try {
        if (!fdb) return;
        const col = collection(fdb, "inventory");
        const snap = await getDocs(col);
        const arr: InventoryItem[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          arr.push({ ...(data || {}), _docId: d.id });
        });

        const map: Record<string, InventoryItem> = {};
        arr.forEach((p) => {
          map[String(p.ID)] = p;
        });

        setInventoryMap(map);
      } catch (e) {
        console.error("Failed to load inventory", e);
        setInventoryMap({});
      }
    }

    loadInventory();
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.Quantity || 0), 0),
    [items]
  );

  // Sync sidebar item count back to CartContext (navbar badge)
  useEffect(() => {
    syncTotal(itemCount);
  }, [itemCount, syncTotal]);

  const grandTotal = useMemo(() => {
    return items.reduce((sum, it) => {
      const prod = inventoryMap[String(it.ID)];
      const base = resolvePricing({
        Price: prod?.Price,
        OriginalPrice: prod?.OriginalPrice,
        DiscountPercent: prod?.DiscountPercent,
      }).selling;
      const custom =
        it.isCustomized && it.customPrice ? Number(it.customPrice) : 0;
      const qty = Number(it.Quantity || 0);
      if (!isFinite(base) || !isFinite(custom) || !isFinite(qty)) return sum;
      return sum + (base + custom) * qty;
    }, 0);
  }, [items, inventoryMap]);

  const shippingAmount = 0;
  const subtotal = grandTotal;
  const total = subtotal + shippingAmount;

  function hasSufficientStock() {
    if (!items.length) return false;

    const nextItems: CartItem[] = [];
    const removedItems: CartItem[] = [];

    items.forEach((item) => {
      const prod = inventoryMap[String(item.ID)];
      const qty = Number(item.Quantity || 0);

      if (!prod || !qty || qty <= 0) {
        removedItems.push(item);
        return;
      }

      let sizeStock: number | undefined;
      const size = (item.Size || "").toUpperCase();
      if (size === "S") sizeStock = prod.StockS;
      else if (size === "M") sizeStock = prod.StockM;
      else if (size === "L") sizeStock = prod.StockL;
      else if (size === "XL") sizeStock = prod.StockXL;

      const maxAllowed =
        (typeof sizeStock === "number" ? sizeStock : undefined) ??
        (typeof prod.Stock === "number" ? prod.Stock : undefined);

      if (
        typeof maxAllowed === "number" &&
        (maxAllowed <= 0 || qty > maxAllowed)
      ) {
        removedItems.push(item);
        return;
      }

      nextItems.push(item);
    });

    if (removedItems.length > 0) {
      if (user && user.email && db) {
        setItems(nextItems);
        const fdb2 = db;
        removedItems.forEach((item) => {
          if (item.docId && fdb2) {
            deleteDoc(firestoreDoc(fdb2, "Cart", item.docId)).catch((e) => {
              console.error("hasSufficientStock Firestore cleanup error", e);
            });
          }
        });
      } else {
        persistGuest(nextItems);
      }
    }

    if (nextItems.length === 0 && removedItems.length > 0) {
      return false;
    }

    return true;
  }

  function persistGuest(next: CartItem[]) {
    writeGuestCartToCookie(next || []);
    setItems(next || []);
  }

  async function changeQuantity(item: CartItem, delta: number) {
    const currentQty = Number(item.Quantity || 0);
    const newQty = Math.max(0, currentQty + delta);

    if (delta > 0) {
      const prod = inventoryMap[String(item.ID)];
      if (prod) {
        let sizeStock: number | undefined;
        const size = (item.Size || "").toUpperCase();
        if (size === "S") sizeStock = prod.StockS;
        else if (size === "M") sizeStock = prod.StockM;
        else if (size === "L") sizeStock = prod.StockL;
        else if (size === "XL") sizeStock = prod.StockXL;

        const maxAllowed = sizeStock ?? prod.Stock;
        if (typeof maxAllowed === "number" && newQty > maxAllowed) {
          alert("No more stock available for this size.");
          return;
        }
      }
    }

    if (user && user.email && item.docId && db) {
      try {
        const fdb3 = db;
        if (!fdb3) return;
        if (newQty <= 0) {
          await deleteDoc(firestoreDoc(fdb3, "Cart", item.docId));
        } else {
          await updateDoc(firestoreDoc(fdb3, "Cart", item.docId), {
            Quantity: newQty,
          });
        }
      } catch (e) {
        console.error("changeQuantity Firestore error", e);
      }
    } else {
      const next = items
        .map((it) => (it === item ? { ...it, Quantity: newQty } : it))
        .filter((it) => it.Quantity > 0);
      persistGuest(next);
    }
  }

  async function removeItem(item: CartItem) {
    if (user && user.email && item.docId && db) {
      try {
        const fdb4 = db;
        if (!fdb4) return;
        await deleteDoc(firestoreDoc(fdb4, "Cart", item.docId));
      } catch (e) {
        console.error("removeItem Firestore error", e);
      }
    } else {
      const next = items.filter((it) => it !== item);
      persistGuest(next);
    }
  }

  const isOpen = open || transitioning;

  return (
    <div
      className="fixed inset-0 z-[90]"
      style={{ pointerEvents: open ? "auto" : "none" }}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-in-out ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeCart}
      />

      {/* Sidebar Panel */}
      <div
        ref={panelRef}
        className={`absolute top-0 right-0 h-full w-full max-w-md bg-[#F9F6F0] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        onTransitionEnd={() => {
          if (!open) setTransitioning(false);
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0D0B8]">
          <div>
            <h2
              className="text-lg tracking-wide text-[#2D2D2D]"
              style={{ fontFamily: "'Tenor Sans', serif" }}
            >
              YOUR CART
            </h2>
            <p className="text-xs text-[#9A6E50] mt-0.5">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="w-9 h-9 flex items-center justify-center text-[#2D2D2D] hover:bg-[#F3EDE4] transition-colors"
            aria-label="Close cart"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-5 h-5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading || loadingItems ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-[#9A6E50]">Loading cart...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 py-10 text-center">
              <Image
                src="/supermarket-shopping-cart-concept-illustration_114360-22408.avif"
                alt="Empty cart"
                width={200}
                height={200}
                className="mb-6 object-contain"
                priority
              />
              <p
                className="text-base text-[#2D2D2D] mb-2"
                style={{ fontFamily: "'Tenor Sans', serif" }}
              >
                Your cart is empty
              </p>
              <p className="text-xs text-[#9A6E50] mb-6">
                Start adding beautiful pieces to your bag.
              </p>
              <Link
                href="/shop"
                onClick={closeCart}
                className="inline-flex items-center justify-center bg-[#D2693F] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[#8B4513] transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[#E0D0B8]">
              {items.map((it) => {
                const key = String(it.ID);
                const prod = inventoryMap[key];
                const img =
                  prod?.ImageUrl1 ||
                  prod?.ImageUrl2 ||
                  prod?.ImageUrl3 ||
                  "/favicon.ico";
                const pricing = resolvePricing({
                  Price: prod?.Price,
                  OriginalPrice: prod?.OriginalPrice,
                  DiscountPercent: prod?.DiscountPercent,
                });
                const base = pricing.selling;
                const custom =
                  it.isCustomized && it.customPrice
                    ? Number(it.customPrice)
                    : 0;
                const totalPerItem = base + custom;
                const lineTotal = totalPerItem * Number(it.Quantity || 0);

                return (
                  <li
                    key={String(it.docId ?? it.ID)}
                    className="px-5 py-4 flex gap-3"
                  >
                    <div className="w-16 h-16 border border-[#E0D0B8] overflow-hidden flex items-center justify-center flex-shrink-0 bg-white">
                      <Link
                        href={`/product/${encodeURIComponent(
                          String(
                            prod?.ProductName ||
                              prod?.Description ||
                              prod?.Product ||
                              key
                          )
                        )}`}
                        onClick={closeCart}
                        className="block w-full h-full relative"
                      >
                        <ProductImage
                          src={img}
                          srcMedium={
                            prod?.ImageUrl1Medium ||
                            prod?.ImageUrl2Medium ||
                            prod?.ImageUrl3Medium
                          }
                          srcThumb={
                            prod?.ImageUrl1Thumb ||
                            prod?.ImageUrl2Thumb ||
                            prod?.ImageUrl3Thumb
                          }
                          size="thumb"
                          alt={prod?.ProductName ?? prod?.Description ?? ""}
                          className="w-full h-full"
                        />
                      </Link>
                    </div>

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-sm font-medium text-[#2D2D2D] leading-snug truncate">
                            {prod?.ProductName ?? prod?.Description ?? ""}
                          </p>
                          {it.Size && (
                            <p className="text-[11px] text-[#9A6E50]">
                              Size: {it.Size}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-[#2D2D2D]">
                            <PriceText amount={lineTotal} />
                          </p>
                          <p className="text-[11px] text-[#9A6E50]">
                            <PriceText amount={totalPerItem} /> each
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => removeItem(it)}
                          className="text-xs text-[#9A6E50] hover:text-[#D2693F] transition-colors underline underline-offset-2"
                        >
                          Remove
                        </button>

                        <div className="inline-flex items-center border border-[#E0D0B8] text-sm">
                          <button
                            type="button"
                            onClick={() => changeQuantity(it, -1)}
                            className="w-8 h-8 flex items-center justify-center text-[#2D2D2D] hover:bg-[#F3EDE4] active:scale-90 transition-all"
                          >
                            -
                          </button>
                          <span className="w-8 h-8 flex items-center justify-center text-[#2D2D2D] text-sm border-x border-[#E0D0B8]">
                            {it.Quantity}
                          </span>
                          {(() => {
                            const prodForLine = inventoryMap[String(it.ID)];
                            let sizeStock: number | undefined;
                            const size = (it.Size || "").toUpperCase();
                            if (size === "S") sizeStock = prodForLine?.StockS;
                            else if (size === "M")
                              sizeStock = prodForLine?.StockM;
                            else if (size === "L")
                              sizeStock = prodForLine?.StockL;
                            else if (size === "XL")
                              sizeStock = prodForLine?.StockXL;

                            const maxAllowed =
                              (typeof sizeStock === "number"
                                ? sizeStock
                                : undefined) ??
                              (typeof prodForLine?.Stock === "number"
                                ? prodForLine.Stock
                                : undefined);
                            const atMax =
                              typeof maxAllowed === "number" &&
                              Number(it.Quantity || 0) >= maxAllowed;

                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  if (atMax) return;
                                  changeQuantity(it, +1);
                                }}
                                disabled={atMax}
                                className={`w-8 h-8 flex items-center justify-center text-[#2D2D2D] active:scale-90 transition-all ${
                                  atMax
                                    ? "opacity-30 cursor-not-allowed"
                                    : "hover:bg-[#F3EDE4]"
                                }`}
                              >
                                +
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#E0D0B8] px-5 py-4 bg-[#F9F6F0]">
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#9A6E50]">Subtotal</span>
                <span className="text-[#2D2D2D] font-medium">
                  <PriceText amount={subtotal} />
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#9A6E50]">Shipping</span>
                <span className="text-[#2D2D2D] font-medium">
                  {shippingAmount === 0 ? (
                    "Free"
                  ) : (
                    <PriceText amount={shippingAmount} />
                  )}
                </span>
              </div>
              <div className="border-t border-[#E0D0B8] pt-2 flex items-center justify-between text-sm">
                <span className="text-[#2D2D2D] font-semibold">Total</span>
                <span className="text-[#2D2D2D] font-semibold">
                  <PriceText amount={total} />
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!hasSufficientStock()) return;
                closeCart();
                router.push("/checkout");
              }}
              className="w-full bg-[#D2693F] text-white py-3 text-sm font-semibold tracking-wide hover:bg-[#8B4513] transition-colors"
            >
              Proceed to Checkout
            </button>

            <div className="mt-3 text-center">
              <Link
                href="/shop"
                onClick={closeCart}
                className="text-xs text-[#9A6E50] hover:text-[#D2693F] underline underline-offset-2 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
