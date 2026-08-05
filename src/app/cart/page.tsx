"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import ProductImage from "@/components/ProductImage";
import PriceText from "@/components/PriceText";
import { resolvePricing } from "@/utils/pricing";
import { getProductSlug } from "@/utils/productSlug";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc as firestoreDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  readGuestCartFromCookie,
  writeGuestCartToCookie,
} from "@/context/CartContext";
import { useDeliverySettings } from "@/hooks/useDeliverySettings";

type CartItem = {
  docId?: string;
  ID: number | string;
  Quantity: number;
  Size?: string;
  Color?: string;
  ItemNotes?: string;
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
  VariantStock?: Record<string, number>;
  _docId?: string;
};

function formatCurrency(n: number | string | undefined) {
  const num = Number(n || 0);
  if (!isFinite(num)) return "";
  return num.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function CartPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { settings: deliverySettings } = useDeliverySettings();
  const postAuthHandled = useRef(false);

  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [inventoryMap, setInventoryMap] = useState<Record<string, InventoryItem>>({});

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

        await updateDoc(ref, {
          Quantity: prevQty + action.payload.quantity,
        });
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

  const grandTotal = useMemo(() => {
    return items.reduce((sum, it) => {
      const prod = inventoryMap[String(it.ID)];
      const base = resolvePricing({ Price: prod?.Price, OriginalPrice: prod?.OriginalPrice, DiscountPercent: prod?.DiscountPercent }).selling;
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
  const freeDeliveryThreshold = deliverySettings.freeDeliveryThreshold;
  const amountUntilFreeDelivery =
    freeDeliveryThreshold > 0
      ? Math.max(0, freeDeliveryThreshold - grandTotal)
      : 0;
  const qualifiesForFreeDelivery =
    freeDeliveryThreshold > 0 && grandTotal >= freeDeliveryThreshold;

  // Ensure all cart items are within available stock.
  // If any are not, silently remove them from the cart.
  function resolveItemStock(prod: InventoryItem, item: CartItem): number | undefined {
    if (prod.VariantStock && item.Color && item.Size) {
      const key = `${item.Color}|${item.Size}`;
      if (typeof prod.VariantStock[key] === "number") return prod.VariantStock[key];
    }
    const size = (item.Size || "").toUpperCase();
    if (size === "S" && typeof prod.StockS === "number") return prod.StockS;
    if (size === "M" && typeof prod.StockM === "number") return prod.StockM;
    if (size === "L" && typeof prod.StockL === "number") return prod.StockL;
    if (size === "XL" && typeof prod.StockXL === "number") return prod.StockXL;
    return typeof prod.Stock === "number" ? prod.Stock : undefined;
  }

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

      const maxAllowed = resolveItemStock(prod, item);

      if (typeof maxAllowed === "number" && (maxAllowed <= 0 || qty > maxAllowed)) {
        removedItems.push(item);
        return;
      }

      nextItems.push(item);
    });

    if (removedItems.length > 0) {
      // Persist the cleaned-up cart for guest vs logged-in users
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

    // If nothing is left after cleanup, don't proceed to checkout
    if (nextItems.length === 0 && removedItems.length > 0) {
      return false;
    }

    // No removals or still have valid items
    return true;
  }

  function persistGuest(next: CartItem[]) {
    writeGuestCartToCookie(next || []);
    setItems(next || []); 
  }

  async function changeQuantity(item: CartItem, delta: number) {
    const currentQty = Number(item.Quantity || 0);
    const newQty = Math.max(0, currentQty + delta);

    // If increasing, enforce stock limits based on selected size
    if (delta > 0) {
      const prod = inventoryMap[String(item.ID)];
      if (prod) {
        const maxAllowed = resolveItemStock(prod, item) ?? prod.Stock;
        if (typeof maxAllowed === "number" && newQty > maxAllowed) {
          alert("No more stock available for this variant.");
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

  if (loading || loadingItems) {
    return (
      <div className="min-h-screen flex items-center justify-center font-semibold text-black">
        Loading cart…
      </div>
    );
  }

  return (
    <div className="px-4 py-10 md:px-10 md:py-14 text-black flex justify-center">
      <div className="w-full max-w-md bg-white/90 border border-gray-200 shadow-sm px-4 py-6">
        <header className="border-b pb-3 mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Cart</h1>
          <span className="text-xs text-gray-500">
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </span>
        </header>

        {items.length === 0 ? (
          <div className="mt-6 text-center flex flex-col items-center justify-center min-h-[60vh]">
            <Image
              src="/supermarket-shopping-cart-concept-illustration_114360-22408.avif"
              alt="Supermarket shopping cart illustration"
              width={260}
              height={260}
              className="mx-auto mb-6 object-contain"
              priority
            />
            <p className="text-sm text-gray-700 mb-4 max-w-xs">
              Your cart is empty. Start adding beautiful pieces to your bag.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center bg-[#D2693F] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#8B4513]"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <section className="border overflow-hidden mb-4">
              <div className="px-4 py-3 border-b flex items-center gap-2 text-sm font-semibold tracking-wide uppercase text-gray-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 4h2l2 12h10l2-8H7" />
                  <circle cx="9" cy="20" r="1.5" />
                  <circle cx="18" cy="20" r="1.5" />
                </svg>
                <span>Cart</span>
              </div>

              <ul>
                {items.map((it) => {
                  const key = String(it.ID);
                  const prod = inventoryMap[key];
                  const img =
                    prod?.ImageUrl1 ||
                    prod?.ImageUrl2 ||
                    prod?.ImageUrl3 ||
                    "/placeholder.png";
                  const base = resolvePricing({ Price: prod?.Price, OriginalPrice: prod?.OriginalPrice, DiscountPercent: prod?.DiscountPercent }).selling;
                  const custom =
                    it.isCustomized && it.customPrice
                      ? Number(it.customPrice)
                      : 0;
                  const totalPerItem = base + custom;
                  const lineTotal =
                    totalPerItem * Number(it.Quantity || 0);

                  return (
                    <li
                      key={String(it.docId ?? it.ID)}
                      className="px-4 py-4 border-b last:border-b-0 flex gap-3"
                    >
                      <div className="w-16 h-16 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0 bg-white">
                        <Link
                          href={`/product/${encodeURIComponent(
                            getProductSlug(prod)
                          )}`}
                          className="block w-full h-full relative"
                        >
                          <ProductImage
                            src={img}
                            srcMedium={prod?.ImageUrl1Medium || prod?.ImageUrl2Medium || prod?.ImageUrl3Medium}
                            srcThumb={prod?.ImageUrl1Thumb || prod?.ImageUrl2Thumb || prod?.ImageUrl3Thumb}
                            size="thumb"
                            alt={prod?.ProductName ?? prod?.Description ?? ""}
                            className="w-full h-full"
                          />
                        </Link>
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-900 leading-snug">
                              {prod?.ProductName ?? prod?.Description ?? ""}
                            </p>
                            {it.Size && (
                              <p className="text-xs" style={{ color: "#9A6E50" }}>
                                {it.Color ? `${it.Color} / ` : ""}Size: {it.Size}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              <PriceText amount={lineTotal} />
                            </p>
                            <p className="text-xs text-gray-500">
                              <PriceText amount={totalPerItem} /> each
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => removeItem(it)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
                          >
                            Remove
                          </button>

                          <div className="inline-flex items-center border border-gray-300 overflow-hidden text-sm">
                            <button
                              type="button"
                              onClick={() => changeQuantity(it, -1)}
                              className="px-3 py-1 bg-white hover:bg-gray-50 text-gray-800"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 text-gray-900 text-sm min-w-[32px] text-center">
                              {it.Quantity}
                            </span>
                            {(() => {
                              const prodForLine = inventoryMap[String(it.ID)];
                              const maxAllowed = prodForLine
                                ? resolveItemStock(prodForLine, it)
                                : undefined;
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
                                  className={`px-3 py-1 bg-white text-gray-800 ${
                                    atMax ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50"
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

              <div className="px-4 py-3 text-sm space-y-2">
                <hr className="mb-2" />
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    <PriceText amount={subtotal} />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
                <hr className="my-2" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold">
                    <PriceText amount={total} />
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Prices include GST (CGST 1.5% + SGST 1.5%). Shipping calculated at checkout.
                </p>
              </div>
            </section>

            <button
              type="button"
              onClick={() => {
                if (!hasSufficientStock()) return;
                router.push("/checkout");
              }}
              className="w-full bg-[#D2693F] text-white py-3 text-sm font-semibold tracking-wide hover:bg-[#8B4513]"
            >
              Proceed to Checkout
            </button>

            <div className="mt-3 text-center text-xs text-gray-500">
              <Link
                href="/shop"
                className="underline underline-offset-2 hover:text-gray-700"
              >
                Continue Shopping
              </Link>
              <span className="mx-1">|</span>
              <Link
                href="/contact-us"
                className="underline underline-offset-2 hover:text-gray-700"
              >
                View Policies
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}