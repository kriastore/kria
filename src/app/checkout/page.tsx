"use client";
import React, { useEffect, useRef, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import PriceText from "@/components/PriceText";
import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  deleteDoc,
  doc as firestoreDoc,
  updateDoc,
} from "firebase/firestore";
import { resolvePricing } from "@/utils/pricing";
import { calculateShipping, type ShippingResult } from "@/utils/shipping";
import { useCartSidebar } from "@/context/CartSidebarContext";
import ProductImage from "@/components/ProductImage";

type CartItem = {
  docId?: string;
  ID: number | string;
  Quantity: number;
  Size?: string;
  Color?: string;
  ItemNotes?: string;
  UserMail?: string;
  AddedOn?: any;
  isCustomized?: boolean;
  customizationText?: string;
  customPrice?: number;
};

type CustomerDetails = {
  name: string;
  email: string;
  phone: string;
  address: string;
  pinCode: string;
  stateCity: string;
};

type OrderStatus = "checkout" | "processing" | "success" | "failed";

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match('(^|;)\\s*' + name + "=([^;]+)");
  return match ? decodeURIComponent(match[2]) : null;
}

const formatCurrency = (n: number) => {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

function CheckoutContent() {
  const { user, loading } = useAuth();
  const { cart, removeItem } = useCart();
  const router = useRouter();
  const { openCart } = useCartSidebar();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [inventoryMap, setInventoryMap] = useState<Record<string, any>>({});
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("checkout");
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: "",
    email: user?.email || "",
    phone: "",
    address: "",
    pinCode: "",
    stateCity: "",
  });
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountCodeStatus, setDiscountCodeStatus] = useState<"idle" | "valid" | "invalid" | "checking">("idle");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const emailInitializedRef = useRef(false);
  const [shippingInfo, setShippingInfo] = useState<ShippingResult>({
    available: true,
    charge: 0,
    estimatedDays: "5-7",
    courierPartner: "DTDC",
    zone: "",
  });
  const [pincodeChecked, setPincodeChecked] = useState(false);

  useEffect(() => {
    if (user?.email && !emailInitializedRef.current) {
      setCustomerDetails((prev) => ({ ...prev, email: user.email || "" }));
      emailInitializedRef.current = true;
    }
  }, [user]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    setItems([]);
    setLoadingItems(true);

    if (user && user.email) {
      const colRef = collection(db!, "Cart");
      const q = query(colRef, where("UserMail", "==", user.email));
      unsub = onSnapshot(
        q,
        (snap) => {
          const rows: CartItem[] = snap.docs.map((d) => ({ docId: d.id, ...(d.data() as any) }));
          setItems(rows);
          setLoadingItems(false);
        },
        (e) => {
          console.error("Cart read error:", e);
          setLoadingItems(false);
        }
      );
    } else {
      const raw = readCookie("guest_cart");
      try {
        const parsed = raw ? JSON.parse(raw) : [];
        setItems(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setItems([]);
      }
      setLoadingItems(false);
    }

    return () => unsub && unsub();
  }, [user]);

  useEffect(() => {
    if (!items || items.length === 0) {
      setInventoryMap({});
      return;
    }

    const ids = items.map((it) => it.ID).filter(Boolean);
    const chunks: any[] = [];
    for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

    async function fetchChunks() {
      const map: Record<string, any> = {};
      for (const chunk of chunks) {
        try {
          const q = query(collection(db!, "inventory"), where("ID", "in", chunk));
          const snap = await getDocs(q);
          snap.docs.forEach((d) => {
            const data = d.data();
            const key = String(data?.ID ?? d.id);
            map[key] = { ...data, _docId: d.id };
          });
        } catch (e) {
          try {
            const allSnap = await getDocs(collection(db!, "inventory"));
            allSnap.docs.forEach((d) => {
              const data = d.data();
              const key = String(data?.ID ?? d.id);
              if (ids.map(String).includes(key)) map[key] = { ...data, _docId: d.id };
            });
          } catch (err) {
            console.error("Failed fetching inventory details:", err);
          }
        }
      }
      setInventoryMap(map);
    }

    fetchChunks();
  }, [items]);

  const grandTotal = items.reduce((sum, it) => {
    const basePrice = resolvePricing({
      Price: inventoryMap[String(it.ID)]?.Price,
      OriginalPrice: inventoryMap[String(it.ID)]?.OriginalPrice,
      DiscountPercent: inventoryMap[String(it.ID)]?.DiscountPercent,
    }).selling;
    const customPrice = it.isCustomized && it.customPrice ? Number(it.customPrice) : 0;
    const totalPrice = basePrice + customPrice;
    const qty = Number(it.Quantity || 0);
    return sum + (isNaN(totalPrice) ? 0 : totalPrice * qty);
  }, 0);

  const discountAmount =
    discountCodeStatus === "valid" && discountPercent > 0 ? Math.round(grandTotal * (discountPercent / 100)) : 0;
  const discountedTotal = grandTotal - discountAmount;
  const finalTotal = discountedTotal + shippingInfo.charge;

  // Calculate shipping when pincode or cart changes
  useEffect(() => {
    if (customerDetails.pinCode.length === 6) {
      setPincodeChecked(true);
      const totalItems = items.reduce((sum, it) => sum + Number(it.Quantity || 0), 0);
      const result = calculateShipping(totalItems, grandTotal, customerDetails.pinCode);
      setShippingInfo(result);
    } else {
      setPincodeChecked(false);
      setShippingInfo({ available: true, charge: 0, estimatedDays: "5-7", courierPartner: "DTDC", zone: "" });
    }
  }, [customerDetails.pinCode, grandTotal, items]);

  const lookupPincodeAuto = async (pincode: string) => {
    if (pincode.length !== 6) return;
    try {
      const res = await fetch(`/api/lookup-pincode?pincode=${pincode}`);
      if (!res.ok) {
        console.error("Pincode lookup failed:", res.status, await res.text());
        return;
      }
      const info = await res.json();
      console.log("Pincode lookup response:", info);
      if (info?.state) {
        setCustomerDetails((prev) => ({
          ...prev,
          stateCity: `${info.city ?? ""}${info.city ? ", " : ""}${info.state}`,
        }));
      } else {
        console.warn("Pincode lookup returned no state:", info);
      }
    } catch (err) {
      console.error("Pincode lookup error:", err);
    }
  };

  const handleInputChange = (field: keyof CustomerDetails, value: string) => {
    if (field === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    if (field === "pinCode") {
      value = value.replace(/\D/g, "").slice(0, 6);
    }
    setCustomerDetails((prev) => ({ ...prev, [field]: value }));
    if (field === "pinCode" && value.length === 6) {
      lookupPincodeAuto(value);
    }
  };

  const isFormValid = () => {
    return (
      customerDetails.name.trim() &&
      customerDetails.email.trim() &&
      customerDetails.phone.trim() &&
      customerDetails.address.trim() &&
      customerDetails.pinCode.trim() &&
      customerDetails.stateCity.trim() &&
      items.length > 0
    );
  };

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      alert("Payment system is loading, please try again.");
      return;
    }

    if (!isFormValid()) {
      alert("Please fill all required fields.");
      return;
    }

    const stockIssues: string[] = [];
    items.forEach((item) => {
      const prod: any = inventoryMap[String(item.ID)];
      if (!prod) return;
      const qty = Number(item.Quantity || 0);
      if (!qty || qty <= 0) return;
      let sizeStock: number | undefined;
      // Try VariantStock first
      if (prod.VariantStock && item.Color && item.Size) {
        const key = `${item.Color}|${item.Size}`;
        if (typeof prod.VariantStock[key] === "number") sizeStock = prod.VariantStock[key];
      }
      if (sizeStock === undefined) {
        const size = (item.Size || "").toUpperCase();
        if (size === "S") sizeStock = prod.StockS;
        else if (size === "M") sizeStock = prod.StockM;
        else if (size === "L") sizeStock = prod.StockL;
        else if (size === "XL") sizeStock = prod.StockXL;
      }
      const maxAllowed =
        (typeof sizeStock === "number" ? sizeStock : undefined) ??
        (typeof prod.Stock === "number" ? prod.Stock : undefined);
      if (typeof maxAllowed === "number" && qty > maxAllowed) {
        const label = prod.ProductName || prod.Description || prod.Product || `Item ${item.ID}`;
        const variant = item.Color ? `${item.Color} / ${item.Size || ""}` : (item.Size || "");
        stockIssues.push(`${label} (${variant}) - only ${maxAllowed} left`);
      }
    });

    if (stockIssues.length > 0) {
      alert(
        "Some items are out of stock or exceed available quantity. Please adjust your cart:\n\n" +
          stockIssues.join("\n")
      );
      return;
    }

    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!razorpayKeyId) {
      alert("Payment setup issue: Razorpay key is not configured. Please contact support.");
      return;
    }

    setOrderStatus("processing");

    const orderData = {
      items: items.map((item) => ({
        ID: item.ID,
        Quantity: item.Quantity,
        Size: item.Size,
        Color: item.Color || "",
        ItemNotes: item.ItemNotes || "",
        product: inventoryMap[String(item.ID)],
        ...(item.isCustomized && {
          isCustomized: true,
          customizationText: item.customizationText,
          customPrice: item.customPrice || 0,
        }),
      })),
      customer: customerDetails,
      total: finalTotal,
      subtotal: grandTotal,
      discountCode: discountCodeStatus === "valid" ? discountCode : "",
      discountPercent: discountCodeStatus === "valid" ? discountPercent : 0,
      discountAmount: discountCodeStatus === "valid" ? discountAmount : 0,
      shippingCharge: shippingInfo.charge,
      shippingZone: shippingInfo.zone,
      courierPartner: shippingInfo.courierPartner,
      estimatedDelivery: shippingInfo.estimatedDays,
      createdAt: new Date().toISOString(),
      userId: user?.uid || null,
      userEmail: user?.email || null,
      trackingId: "",
    };

    const options = {
      key: razorpayKeyId,
      amount: finalTotal * 100,
      currency: "INR",
      name: "Kria",
      description: `Order for ${items.length} items`,
      handler: async function (response: any) {
        try {
          const finalOrderData = {
            ...orderData,
            paymentId: response.razorpay_payment_id,
            status: "placed",
            createdAt: serverTimestamp(),
          };

          const orderRef = await addDoc(collection(db!, "Orders"), finalOrderData);
          setOrderDetails({ ...finalOrderData, orderId: orderRef.id });
          setOrderStatus("success");

          try {
            await Promise.all(
              items.map(async (item) => {
                const prod: any = inventoryMap[String(item.ID)];
                if (!prod?._docId) return;
                const qty = Number(item.Quantity || 0);
                if (!qty || qty <= 0) return;
                const updates: Record<string, any> = {};
                // Deduct variant stock if applicable
                if (item.Color && item.Size && prod.VariantStock) {
                  const key = `${item.Color}|${item.Size}`;
                  if (typeof prod.VariantStock[key] === "number") {
                    const newVariantStock = { ...prod.VariantStock };
                    newVariantStock[key] = Math.max(0, (newVariantStock[key] || 0) - qty);
                    updates.VariantStock = newVariantStock;
                  }
                }
                // Also deduct per-size field if present
                if (item.Size) {
                  const sizeFieldMap: Record<string, string> = { S: "StockS", M: "StockM", L: "StockL", XL: "StockXL" };
                  const sizeKey = sizeFieldMap[String(item.Size).toUpperCase()];
                  if (sizeKey && typeof prod[sizeKey] === "number") {
                    updates[sizeKey] = Math.max(0, Number(prod[sizeKey] || 0) - qty);
                  }
                }
                // Always deduct general Stock
                if (typeof prod.Stock === "number") {
                  updates.Stock = Math.max(0, Number(prod.Stock || 0) - qty);
                }
                if (Object.keys(updates).length === 0) return;
                await updateDoc(firestoreDoc(db!, "inventory", prod._docId), updates);
              })
            );
          } catch (stockErr) {
            console.error("Failed to update inventory stock after order:", stockErr);
          }

          if (user && user.email) {
            try {
              const cartItemsToDelete = items.filter((item) => item.docId);
              await Promise.all(cartItemsToDelete.map((item) => deleteDoc(firestoreDoc(db!, "Cart", item.docId!))));
              Object.keys(cart).forEach((id) => {
                const totalCount = cart[id] || 0;
                for (let i = 0; i < totalCount; i++) {
                  removeItem(id);
                }
              });
            } catch (error) {
              console.error("Error clearing user cart:", error);
            }
          } else {
            document.cookie = "guest_cart=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";
            Object.keys(cart).forEach((id) => {
              const totalCount = cart[id] || 0;
              for (let i = 0; i < totalCount; i++) {
                removeItem(id);
              }
            });
          }

          try {
            const safeOrderForEmail = {
              id: orderRef.id,
              status: "placed",
              total: finalTotal,
              subtotal: grandTotal,
              shippingCharge: shippingInfo.charge,
              shippingZone: shippingInfo.zone,
              courierPartner: shippingInfo.courierPartner,
              estimatedDelivery: shippingInfo.estimatedDays,
              customer: customerDetails,
              items: orderData.items,
              createdAt: new Date().toISOString(),
            };

            fetch("/api/send-invoice", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                order: safeOrderForEmail,
                orderId: orderRef.id,
                sendTo: customerDetails.email,
              }),
            }).catch((err) => {
              console.error("Failed to trigger invoice email:", err);
            });
          } catch (emailErr) {
            console.error("Error preparing invoice email:", emailErr);
          }
        } catch (error) {
          console.error("Error saving order:", error);
          setOrderStatus("failed");
        }
      },
      modal: {
        ondismiss: function () {
          setOrderStatus("failed");
        },
      },
      prefill: {
        name: customerDetails.name,
        email: customerDetails.email,
        contact: customerDetails.phone,
      },
      theme: {
        color: "#D2693F",
      },
    };

    try {
      if (!window.Razorpay) {
        console.error("Razorpay script not loaded or window.Razorpay is undefined");
        alert("Payment system failed to load. Please refresh the page and try again.");
        setOrderStatus("failed");
        return;
      }
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response);
        setOrderStatus("failed");
      });
      rzp.open();
    } catch (error) {
      console.error("Error opening Razorpay:", error);
      setOrderStatus("failed");
    }
  };

  if (loading || loadingItems) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F9F6F0" }}>
        <div className="text-center">
          <div className="animate-spin h-10 w-10 mx-auto mb-4" style={{ border: "3px solid #E0D0B8", borderTopColor: "#D2693F", borderRadius: "50%" }} />
          <p className="text-sm" style={{ color: "#9A6E50" }}>Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (orderStatus === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: "#F9F6F0" }}>
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center rounded-full" style={{ backgroundColor: "#F3EDE4", border: "2px solid #D2693F" }}>
            <svg className="w-8 h-8" style={{ color: "#D2693F" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "Tenor Sans, serif" }}>Order Confirmed!</h1>
          <p className="text-sm mb-6" style={{ color: "#9A6E50" }}>Thank you for shopping with Kria</p>

          <div className="rounded-xl px-5 py-4 mb-4" style={{ backgroundColor: "#fff", border: "1px solid #E0D0B8" }}>
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "#9A6E50" }}>Order ID</p>
            <p className="text-sm font-bold" style={{ color: "#2D2D2D" }}>#{orderDetails?.orderId}</p>
          </div>

          {orderDetails?.estimatedDelivery && (
            <p className="text-sm mb-4" style={{ color: "#9A6E50" }}>
              Estimated delivery: <span className="font-semibold" style={{ color: "#2D2D2D" }}>{orderDetails.estimatedDelivery} business days</span>
            </p>
          )}

          <p className="text-sm mb-6" style={{ color: "#9A6E50" }}>A confirmation has been sent to your email.</p>

          <div className="rounded-xl px-5 py-4 mb-6" style={{ backgroundColor: "#fff", border: "1px solid #E0D0B8" }}>
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#9A6E50" }}>Need Help?</p>
            <a href="https://wa.me/919894414445" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "#D2693F" }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat on WhatsApp
            </a>
          </div>

          <button onClick={() => router.push("/")} className="w-full py-3 text-sm font-bold tracking-wide rounded-xl transition-all" style={{ backgroundColor: "#D2693F", color: "#fff" }}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (orderStatus === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: "#F9F6F0" }}>
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center rounded-full" style={{ backgroundColor: "#F3EDE4", border: "2px solid #D2693F" }}>
            <svg className="w-8 h-8" style={{ color: "#D2693F" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "Tenor Sans, serif" }}>Payment Unsuccessful</h1>
          <p className="text-sm mb-8" style={{ color: "#9A6E50" }}>Your payment could not be processed. Please try again.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => setOrderStatus("checkout")} className="py-3 text-sm font-bold tracking-wide rounded-xl" style={{ backgroundColor: "#D2693F", color: "#fff" }}>
              Try Again
            </button>
            <button onClick={() => router.push("/")} className="py-3 text-sm font-bold tracking-wide rounded-xl" style={{ backgroundColor: "#F3EDE4", color: "#2D2D2D", border: "1px solid #E0D0B8" }}>
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: "#F9F6F0" }}>
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 mx-auto mb-5 flex items-center justify-center rounded-full" style={{ backgroundColor: "#F3EDE4", border: "1px solid #E0D0B8" }}>
            <svg className="w-10 h-10" style={{ color: "#9A6E50" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "Tenor Sans, serif" }}>Your Cart is Empty</h1>
          <p className="text-sm mb-8 max-w-xs mx-auto" style={{ color: "#9A6E50" }}>
            Looks like you haven't added any items yet. Start shopping to see your items here.
          </p>
          <button onClick={() => router.push("/")} className="py-3 px-8 text-sm font-bold tracking-wide rounded-xl" style={{ backgroundColor: "#D2693F", color: "#fff" }}>
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F9F6F0", color: "#2D2D2D" }}>
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b" style={{ backgroundColor: "#F9F6F0", borderColor: "#E0D0B8" }}>
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <button onClick={openCart} className="flex items-center gap-2">
            <svg className="w-5 h-5" style={{ color: "#D2693F" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="text-sm font-semibold tracking-wide" style={{ fontFamily: "Tenor Sans, serif" }}>Back to Cart</span>
          </button>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" style={{ color: "#9A6E50" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <span className="text-xs" style={{ color: "#9A6E50" }}>Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-4">
        <div className="flex items-center gap-3 max-w-lg">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 flex items-center justify-center text-xs font-bold rounded-full" style={{ backgroundColor: "#D2693F", color: "#fff" }}>1</span>
            <span className="text-sm font-semibold" style={{ color: "#D2693F" }}>Shipping</span>
          </div>
          <div className="flex-1 h-px" style={{ backgroundColor: "#E0D0B8" }} />
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 flex items-center justify-center text-xs font-bold rounded-full" style={{ backgroundColor: "#E0D0B8", color: "#9A6E50" }}>2</span>
            <span className="text-sm" style={{ color: "#9A6E50" }}>Payment</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pb-16">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column — Form */}
          <div className="flex-1 min-w-0">
            <section className="mb-6">
              <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "Tenor Sans, serif" }}>Shipping Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#9A6E50" }}>Full Name</label>
                  <input
                    type="text"
                    value={customerDetails.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-colors"
                    style={{ border: "1px solid #E0D0B8", backgroundColor: "#fff", color: "#2D2D2D" }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#D2693F"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "#E0D0B8"}
                    placeholder="John Doe"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#9A6E50" }}>Email</label>
                  <input
                    type="email"
                    value={customerDetails.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-colors"
                    style={{ border: "1px solid #E0D0B8", backgroundColor: "#fff", color: "#2D2D2D" }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#D2693F"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "#E0D0B8"}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#9A6E50" }}>Phone</label>
                  <div className="flex items-center">
                    <span
                      className="px-4 py-3 text-sm select-none rounded-l-lg"
                      style={{ border: "1px solid #E0D0B8", borderRight: "none", backgroundColor: "#F3EDE4", color: "#9A6E50" }}
                    >
                      +91
                    </span>
                    <input
                      type="tel"
                      value={customerDetails.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="w-full px-4 py-3 text-sm rounded-r-lg outline-none transition-colors"
                      style={{ border: "1px solid #E0D0B8", backgroundColor: "#fff", color: "#2D2D2D" }}
                      onFocus={(e) => e.currentTarget.style.borderColor = "#D2693F"}
                      onBlur={(e) => e.currentTarget.style.borderColor = "#E0D0B8"}
                      placeholder="98944 14445"
                      maxLength={10}
                      pattern="[0-9]{10}"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#9A6E50" }}>Address</label>
                  <textarea
                    value={customerDetails.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-colors resize-none"
                    style={{ border: "1px solid #E0D0B8", backgroundColor: "#fff", color: "#2D2D2D" }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#D2693F"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "#E0D0B8"}
                    rows={2}
                    placeholder="Flat / House No., Building, Street, Area"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#9A6E50" }}>PIN Code</label>
                  <input
                    type="text"
                    value={customerDetails.pinCode}
                    onChange={(e) => handleInputChange("pinCode", e.target.value)}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#E0D0B8"; lookupPincodeAuto(customerDetails.pinCode); }}
                    className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-colors"
                    style={{ border: "1px solid #E0D0B8", backgroundColor: "#fff", color: "#2D2D2D" }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#D2693F"}
                    placeholder="411033"
                    maxLength={6}
                    pattern="[0-9]{6}"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#9A6E50" }}>State / City</label>
                  <input
                    type="text"
                    value={customerDetails.stateCity}
                    onChange={(e) => handleInputChange("stateCity", e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-colors"
                    style={{ border: "1px solid #E0D0B8", backgroundColor: "#fff", color: "#2D2D2D" }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#D2693F"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "#E0D0B8"}
                    placeholder="Auto-filled from PIN"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Right Column — Order Summary (sticky on desktop) */}
          <div className="w-full lg:w-[380px] lg:shrink-0">
            <div className="lg:sticky lg:top-20">
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E0D0B8", backgroundColor: "#fff" }}>
                <div className="px-5 py-4" style={{ borderBottom: "1px solid #E0D0B8" }}>
                  <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#9A6E50" }}>
                    Order Summary · {items.length} item{items.length === 1 ? "" : "s"}
                  </h2>
                </div>

                <div className="px-5 py-3 max-h-64 overflow-y-auto">
                  <ul className="space-y-3">
                    {items.map((item) => {
                      const key = String(item.ID);
                      const prod = inventoryMap[key];
                      const basePrice = resolvePricing({
                        Price: prod?.Price,
                        OriginalPrice: prod?.OriginalPrice,
                        DiscountPercent: prod?.DiscountPercent,
                      }).selling;
                      const customPrice = item.isCustomized && item.customPrice ? Number(item.customPrice) : 0;
                      const linePrice = (basePrice + customPrice) * Number(item.Quantity || 0);

                      return (
                        <li key={String(item.docId ?? item.ID)} className="flex items-start gap-3">
                          <div className="w-12 h-12 border border-[#E0D0B8] overflow-hidden flex-shrink-0 bg-white">
                            <ProductImage
                              src={prod?.ImageUrl1 || "/placeholder.png"}
                              srcMedium={prod?.ImageUrl1Medium}
                              srcThumb={prod?.ImageUrl1Thumb}
                              size="thumb"
                              alt={prod?.ProductName ?? prod?.Description ?? ""}
                              className="w-full h-full"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "#2D2D2D" }}>
                              {prod?.ProductName ?? prod?.Description ?? `Item ${item.ID}`}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "#9A6E50" }}>
                              {item.Color && <>{item.Color}{item.Size ? " / " : ""}</>}
                              {item.Size && <>Size: {item.Size}</>}
                              {!item.Color && !item.Size && <>Qty: {item.Quantity}</>}
                              {item.Quantity > 1 && <> · Qty: {item.Quantity}</>}
                            </p>
                            {item.ItemNotes && (
                              <p className="text-[11px] italic mt-0.5" style={{ color: "#9A6E50" }}>
                                {item.ItemNotes}
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-medium shrink-0" style={{ color: "#2D2D2D" }}>
                            <PriceText amount={linePrice} />
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="px-5 py-4 space-y-2" style={{ borderTop: "1px solid #E0D0B8" }}>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: "#9A6E50" }}>Subtotal</span>
                    <span className="font-medium"><PriceText amount={grandTotal} /></span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: "#9A6E50" }}>Discount ({discountPercent}%)</span>
                      <span className="font-medium" style={{ color: "#D2693F" }}>- <PriceText amount={discountAmount} /></span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: "#9A6E50" }}>Shipping</span>
                    <span className="font-medium" style={{ color: "#2D2D2D" }}>
                      {pincodeChecked && customerDetails.pinCode.length === 6
                        ? shippingInfo.charge === 0
                          ? <span style={{ color: "#2D2D2D" }}>Free</span>
                          : <PriceText amount={shippingInfo.charge} />
                        : "—"}
                    </span>
                  </div>
                  {pincodeChecked && customerDetails.pinCode.length === 6 && (
                    <p className="text-[11px]" style={{ color: "#9A6E50" }}>
                      {shippingInfo.estimatedDays} business days via {shippingInfo.courierPartner}
                      {shippingInfo.zone && <span className="ml-1">· {shippingInfo.zone} zone</span>}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2 mt-2" style={{ borderTop: "1px solid #E0D0B8" }}>
                    <span className="text-base font-bold">Total</span>
                    <span className="text-lg font-bold"><PriceText amount={finalTotal} /></span>
                  </div>
                </div>
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={!isFormValid() || orderStatus === "processing" || !razorpayLoaded}
                className="w-full mt-4 py-3.5 text-sm font-bold tracking-wide rounded-xl transition-all"
                style={{
                  backgroundColor: isFormValid() && razorpayLoaded && orderStatus !== "processing" ? "#D2693F" : "#E0D0B8",
                  color: isFormValid() && razorpayLoaded && orderStatus !== "processing" ? "#fff" : "#9A6E50",
                  cursor: isFormValid() && razorpayLoaded && orderStatus !== "processing" ? "pointer" : "not-allowed",
                }}
              >
                {orderStatus === "processing"
                  ? "Processing..."
                  : `Pay Rs.${formatCurrency(finalTotal)}`}
              </button>

              {!razorpayLoaded && (
                <p className="text-[11px] mt-2 text-center" style={{ color: "#9A6E50" }}>
                  Initializing secure payment...
                </p>
              )}

              <div className="flex items-center justify-center gap-2 mt-3">
                <svg className="w-3.5 h-3.5" style={{ color: "#9A6E50" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <span className="text-[11px]" style={{ color: "#9A6E50" }}>Payments via Razorpay · 256-bit SSL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#F9F6F0", color: "#2D2D2D" }}
        >
          Loading...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
