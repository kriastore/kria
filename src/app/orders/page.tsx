"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/firebase";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useCartSidebar } from "@/context/CartSidebarContext";
import { generateInvoice } from "@/utils/generateInvoice";
import ProductImage from "@/components/ProductImage";
import PriceText from "@/components/PriceText";
import { resolvePricing } from "@/utils/pricing";

type OrderStatus = "placed" | "processing" | "shipped" | "done" | "cancelled";

type OrderItem = {
  ID: number | string;
  Quantity: number;
  Size?: string;
  isCustomized?: boolean;
  customizationText?: string;
  customPrice?: number;
  product?: {
    Description?: string;
    ProductName?: string;
    ImageUrl1?: string;
    Price?: number;
    OriginalPrice?: number;
    DiscountPercent?: number;
  };
};

type Order = {
  id: string;
  createdAt: any;
  userEmail: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    pinCode?: string;
    stateCity?: string;
  };
  total: number;
  status: OrderStatus;
  trackingId?: string;
  shippingCharge?: number;
  shippingZone?: string;
  courierPartner?: string;
  items: OrderItem[];
};

const statusStyles: Record<OrderStatus, string> = {
  placed: "bg-[#F3EDE4] text-[#9A6E50] border border-[#E0D0B8]",
  processing: "bg-[#F3EDE4] text-[#9A6E50] border border-[#E0D0B8]",
  shipped: "bg-[#D2693F] text-white",
  done: "bg-[#C5A059] text-white",
  cancelled: "bg-[#E8E0D8] text-[#9A6E50]",
};

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const { addItem } = useCart();
  const { openCart } = useCartSidebar();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);

  /* Auth guard */
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/sign-in");
    }
  }, [user, loading, router]);

  /* Fetch orders */
  useEffect(() => {
    if (loading) return;

    if (!user || !user.email) {
      setOrders([]);
      setFetching(false);
      return;
    }

    if (!db) {
      setFetching(false);
      return;
    }

    const q = query(
      collection(db, "Orders"),
      where("userEmail", "==", user.email)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: Order[] = snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }));

        rows.sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return bTime - aTime;
        });
        setOrders(rows);
        setFetching(false);
      },
      () => {
        setFetching(false);
      }
    );

    return () => unsub();
  }, [user, loading]);

  /* Buy again */
  const handleBuyAgain = async (items: OrderItem[]) => {
    if (!user?.email) return;

    const cartRef = collection(db!, "Cart");

    for (const item of items) {
      const baseData = {
        ID: item.ID,
        Quantity: item.Quantity,
        Size: item.Size || "S",
        UserMail: user.email,
        ["Added On"]: serverTimestamp(),
      };

      if (item.isCustomized) {
        await addDoc(cartRef, {
          ...baseData,
          isCustomized: true,
          customizationText: item.customizationText,
          customPrice: item.customPrice || 0,
        });
      } else {
        const q = query(
          cartRef,
          where("UserMail", "==", user.email),
          where("ID", "==", item.ID),
          where("Size", "==", item.Size || "S"),
          where("isCustomized", "==", false)
        );

        const snap = await getDocs(q);

        if (!snap.empty) {
          const ref = snap.docs[0].ref;
          const prevQty = snap.docs[0].data().Quantity || 0;

          await updateDoc(ref, {
            Quantity: prevQty + item.Quantity,
            ["Added On"]: serverTimestamp(),
          });
        } else {
          await addDoc(cartRef, { ...baseData, isCustomized: false });
        }
      }

      for (let i = 0; i < item.Quantity; i++) {
        addItem(String(item.ID));
      }
    }

    openCart();
  };

  const formatDate = (ts: any) =>
    ts?.toDate
      ? ts.toDate().toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";

  const visibleOrders = user?.email
    ? orders.filter((o) => o.userEmail === user.email)
    : orders;

  if (loading || fetching) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F9F6F0", color: "#2D2D2D" }}
      >
        <p className="font-semibold" style={{ fontFamily: "'Tenor Sans', serif" }}>
          Loading orders...
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-10 md:px-10 md:py-14 flex justify-center" style={{ backgroundColor: "#F9F6F0", color: "#2D2D2D" }}>
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl sm:text-3xl font-semibold"
            style={{ fontFamily: "'Tenor Sans', serif", color: "#2D2D2D" }}
          >
            Your Orders
          </h1>
        </div>

        {visibleOrders.length === 0 ? (
          <div className="mt-6 text-center flex flex-col items-center justify-center min-h-[60vh]">
            <Image
              src="/supermarket-shopping-cart-concept-illustration_114360-22408.avif"
              alt="Supermarket shopping cart illustration"
              width={260}
              height={260}
              className="mx-auto mb-6 object-contain"
              priority
            />
            <p className="text-sm mb-4 max-w-xs" style={{ color: "#9A6E50" }}>
              You have no orders yet. Start shopping to place your first order.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center text-white px-5 py-2.5 text-sm font-semibold"
              style={{ backgroundColor: "#D2693F" }}
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {visibleOrders.map((order) => {
              const normalTotal = order.items.reduce((sum, item) => {
                const base = resolvePricing({
                  Price: item.product?.Price,
                  OriginalPrice: item.product?.OriginalPrice,
                  DiscountPercent: item.product?.DiscountPercent,
                }).selling;
                const custom = item.isCustomized ? item.customPrice ?? 0 : 0;
                return sum + (base + custom) * item.Quantity;
              }, 0);

              const discountAmount = normalTotal - order.total;
              const discountPercent =
                normalTotal > 0
                  ? Math.round((discountAmount / normalTotal) * 100)
                  : 0;

              return (
                <div
                  key={order.id}
                  className="p-4 sm:p-6 space-y-4"
                  style={{ border: "1px solid #E0D0B8", backgroundColor: "#F9F6F0" }}
                >
                  {/* Meta */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold break-all">
                        Order ID:{" "}
                        <span className="font-mono">{order.id}</span>
                      </p>
                      <p className="text-sm" style={{ color: "#9A6E50" }}>
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`px-4 py-1 font-medium capitalize w-fit ${statusStyles[order.status] || statusStyles.placed}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Courier Partner */}
                  {order.courierPartner && (
                    <p className="text-sm" style={{ color: "#9A6E50" }}>
                      Courier: {order.courierPartner}
                      {order.shippingZone && <> · {order.shippingZone}</>}
                    </p>
                  )}

                  {/* Customer Details */}
                  {order.customer && (
                    <div className="mt-3 text-sm space-y-1" style={{ color: "#9A6E50" }}>
                      <p className="font-semibold" style={{ color: "#2D2D2D" }}>Customer</p>
                      <p>
                        {order.customer.name || ""}
                        {order.customer.email || order.userEmail
                          ? ` (${order.customer.email || order.userEmail})`
                          : ""}
                      </p>
                      {order.customer.phone && <p>Phone: {order.customer.phone}</p>}
                      {order.customer.address && <p>Address: {order.customer.address}</p>}
                      {(order.customer.stateCity || order.customer.pinCode) && (
                        <p>
                          {(order.customer.stateCity || "").trim()}
                          {order.customer.stateCity && order.customer.pinCode ? " - " : ""}
                          {(order.customer.pinCode || "").trim()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Items */}
                  <div className="space-y-2">
                    {order.items.map((item, idx) => {
                      const base = resolvePricing({
                        Price: item.product?.Price,
                        OriginalPrice: item.product?.OriginalPrice,
                        DiscountPercent: item.product?.DiscountPercent,
                      }).selling;
                      const custom = item.isCustomized ? item.customPrice ?? 0 : 0;
                      const total = (base + custom) * item.Quantity;

                      const imgSrc =
                        (item as any).product?.ImageUrl1 || "/placeholder.png";

                      return (
                        <div key={idx} className="space-y-1">
                          <div
                            className="flex items-center justify-between gap-4 text-sm"
                            style={{ borderBottom: "1px solid #E0D0B8", paddingBottom: "8px" }}
                          >
                            <div className="flex items-center gap-3 flex-1">
                               <div className="w-12 h-12 border border-[#E0D0B8] overflow-hidden flex-shrink-0">
                                 <ProductImage
                                   src={imgSrc}
                                   size="thumb"
                                   alt={item.product?.ProductName || item.product?.Description || "Product"}
                                   className="w-full h-full"
                                 />
                               </div>
                              <div>
                                <p className="font-medium">
                                  {item.product?.ProductName ?? item.product?.Description ?? "Product"} × {item.Quantity}
                                </p>
                                <p className="text-xs" style={{ color: "#9A6E50" }}>
                                  ID: {item.ID} • Size: {item.Size || "N/A"}
                                </p>
                              </div>
                            </div>
                            <span className="whitespace-nowrap font-semibold">
                              <PriceText amount={total} />
                            </span>
                          </div>

                          {item.isCustomized && (
                            <div
                              className="ml-3 p-2"
                              style={{ backgroundColor: "#F3EDE4", border: "1px solid #E0D0B8" }}
                            >
                              <p className="text-xs" style={{ color: "#D2693F" }}>
                                Customized: &quot;{item.customizationText}&quot;
                              </p>
                              {custom > 0 && (
                                <p className="text-xs" style={{ color: "#D2693F" }}>
                                  + <PriceText amount={custom} /> customization fee
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Total + Discount */}
                  <div className="space-y-1" style={{ borderTop: "1px solid #E0D0B8", paddingTop: "12px" }}>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm" style={{ color: "#9A6E50" }}>
                        <span>Discount ({discountPercent}%)</span>
                        <span>- <PriceText amount={discountAmount} /></span>
                      </div>
                    )}

                    {order.shippingCharge !== undefined && order.shippingCharge > 0 && (
                      <div className="flex justify-between text-sm" style={{ color: "#9A6E50" }}>
                        <span>Shipping</span>
                        <PriceText amount={order.shippingCharge} />
                      </div>
                    )}

                    {order.shippingCharge !== undefined && order.shippingCharge === 0 && (
                      <div className="flex justify-between text-sm" style={{ color: "#9A6E50" }}>
                        <span>Shipping</span>
                        <span>Free</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center font-semibold text-lg">
                      <span>Total</span>
                      <PriceText amount={order.total} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                    <div
                      className="px-4 py-2 font-medium text-sm flex items-center justify-center"
                      style={{ border: "1px solid #E0D0B8", backgroundColor: "#F3EDE4", color: "#2D2D2D" }}
                    >
                      <span className="truncate">
                        {order.trackingId && order.trackingId.trim() !== ""
                          ? order.trackingId
                          : "Tracking id is not assigned yet"}
                      </span>
                    </div>

                    <button
                      onClick={() => handleBuyAgain(order.items)}
                      className="px-4 py-2 font-medium text-sm"
                      style={{ border: "1px solid #E0D0B8", color: "#2D2D2D" }}
                    >
                      Buy Again
                    </button>

                    <button
                      onClick={() => generateInvoice(order)}
                      className="px-4 py-2 font-medium text-sm"
                      style={{ border: "1px solid #E0D0B8", color: "#2D2D2D" }}
                    >
                      Download Invoice
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
