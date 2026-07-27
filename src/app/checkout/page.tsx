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
import { calculateShipping, lookupPincode, type ShippingResult } from "@/utils/shipping";

type CartItem = {
  docId?: string;
  ID: number | string;
  Quantity: number;
  Size?: string;
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

  useEffect(() => {
    if (customerDetails.pinCode.length === 6) {
      setPincodeChecked(true);
      const totalItems = items.reduce((sum, it) => sum + Number(it.Quantity || 0), 0);
      const result = calculateShipping(totalItems, grandTotal, customerDetails.pinCode);
      setShippingInfo(result);
      lookupPincode(customerDetails.pinCode).then((info) => {
        if (info && !customerDetails.stateCity.trim()) {
          setCustomerDetails((prev) => ({
            ...prev,
            stateCity: `${info.city}, ${info.state}`,
          }));
        }
      });
    } else {
      setPincodeChecked(false);
      setShippingInfo({ available: true, charge: 0, estimatedDays: "5-7", courierPartner: "DTDC", zone: "" });
    }
  }, [customerDetails.pinCode, grandTotal, items]);

  const handleInputChange = (field: keyof CustomerDetails, value: string) => {
    if (field === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    if (field === "pinCode") {
      value = value.replace(/\D/g, "").slice(0, 6);
    }
    setCustomerDetails((prev) => ({ ...prev, [field]: value }));
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
      const size = (item.Size || "").toUpperCase();
      if (size === "S") sizeStock = prod.StockS;
      else if (size === "M") sizeStock = prod.StockM;
      else if (size === "L") sizeStock = prod.StockL;
      else if (size === "XL") sizeStock = prod.StockXL;
      const maxAllowed =
        (typeof sizeStock === "number" ? sizeStock : undefined) ??
        (typeof prod.Stock === "number" ? prod.Stock : undefined);
      if (typeof maxAllowed === "number" && qty > maxAllowed) {
        const label = prod.ProductName || prod.Description || prod.Product || `Item ${item.ID}`;
        stockIssues.push(`${label} (${size || ""}) - only ${maxAllowed} left`);
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
            const sizeFieldMap: Record<string, string> = {
              S: "StockS",
              M: "StockM",
              L: "StockL",
              XL: "StockXL",
            };

            await Promise.all(
              items.map(async (item) => {
                const prod: any = inventoryMap[String(item.ID)];
                if (!prod?._docId) return;
                const qty = Number(item.Quantity || 0);
                if (!qty || qty <= 0) return;
                const updates: Record<string, number> = {};
                if (item.Size) {
                  const sizeKey = sizeFieldMap[String(item.Size).toUpperCase()];
                  if (sizeKey && typeof prod[sizeKey] === "number") {
                    const current = Number(prod[sizeKey] || 0);
                    updates[sizeKey] = Math.max(0, current - qty);
                  }
                }
                if (typeof prod.Stock === "number") {
                  const currentTotal = Number(prod.Stock || 0);
                  updates.Stock = Math.max(0, currentTotal - qty);
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
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#F9F6F0", color: "#2D2D2D" }}
      >
        <div className="text-center px-8 py-10 max-w-md w-full" style={{ border: "1px solid #E0D0B8" }}>
          <div className="relative">
            <div
              className="animate-spin h-14 w-14 mx-auto mb-5"
              style={{ border: "3px solid #E0D0B8", borderTopColor: "#D2693F" }}
            />
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: "'Tenor Sans', serif", color: "#2D2D2D" }}>
            Loading Checkout
          </h2>
          <p className="text-sm" style={{ color: "#9A6E50" }}>
            Please wait while we prepare your order...
          </p>
        </div>
      </div>
    );
  }

  if (orderStatus === "success") {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ backgroundColor: "#F9F6F0", color: "#2D2D2D" }}
      >
        <div
          className="max-w-md w-full px-8 py-10 text-center"
          style={{ border: "1px solid #E0D0B8" }}
        >
          <div
            className="w-20 h-20 mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: "#F3EDE4", border: "2px solid #D2693F" }}
          >
            <svg className="w-10 h-10" style={{ color: "#D2693F" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1
            className="text-2xl lg:text-3xl font-bold mb-3"
            style={{ fontFamily: "'Tenor Sans', serif", color: "#2D2D2D" }}
          >
            Order Confirmed!
          </h1>

          <p className="text-sm mb-6" style={{ color: "#9A6E50" }}>
            Thank you for shopping with Kria
          </p>

          <div
            className="mb-6 px-4 py-4"
            style={{ backgroundColor: "#F3EDE4", border: "1px solid #E0D0B8" }}
          >
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#9A6E50" }}>
              Order ID
            </p>
            <p className="text-sm font-semibold" style={{ color: "#2D2D2D" }}>
              #{orderDetails?.orderId}
            </p>
          </div>

          {orderDetails?.estimatedDelivery && (
            <p className="text-sm mb-6" style={{ color: "#9A6E50" }}>
              Estimated delivery: <span className="font-semibold" style={{ color: "#2D2D2D" }}>{orderDetails.estimatedDelivery} business days</span>
            </p>
          )}

          <p className="text-sm mb-6" style={{ color: "#9A6E50" }}>
            A confirmation has been sent to your email.
          </p>

          <div
            className="mb-8 px-4 py-4"
            style={{ backgroundColor: "#F3EDE4", border: "1px solid #E0D0B8" }}
          >
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#9A6E50" }}>
              Need Help?
            </p>
            <a
              href="https://wa.me/919894414445"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: "#D2693F" }}
            >
              <span
                className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold"
                style={{ backgroundColor: "#D2693F", color: "#fff" }}
              >
                W
              </span>
              Chat on WhatsApp
            </a>
          </div>

          <button
            onClick={() => router.push("/")}
            className="w-full py-3 text-sm font-semibold tracking-wide transition-colors"
            style={{ backgroundColor: "#D2693F", color: "#fff" }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (orderStatus === "failed") {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ backgroundColor: "#F9F6F0", color: "#2D2D2D" }}
      >
        <div
          className="max-w-md w-full px-8 py-10 text-center"
          style={{ border: "1px solid #E0D0B8" }}
        >
          <div
            className="w-20 h-20 mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: "#F3EDE4", border: "2px solid #D2693F" }}
          >
            <svg
              className="w-10 h-10"
              style={{ color: "#D2693F" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1
            className="text-2xl lg:text-3xl font-bold mb-4"
            style={{ fontFamily: "'Tenor Sans', serif", color: "#2D2D2D" }}
          >
            Payment Unsuccessful
          </h1>
          <p className="text-sm mb-8" style={{ color: "#9A6E50" }}>
            Your payment could not be processed. Please try again or contact support for assistance.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setOrderStatus("checkout")}
              className="py-3 text-sm font-semibold tracking-wide transition-colors"
              style={{ backgroundColor: "#D2693F", color: "#fff" }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Try Again
            </button>
            <button
              onClick={() => router.push("/")}
              className="py-3 text-sm font-semibold tracking-wide transition-colors"
              style={{ backgroundColor: "#F3EDE4", color: "#2D2D2D", border: "1px solid #E0D0B8" }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#E0D0B8")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#F3EDE4")}
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ backgroundColor: "#F9F6F0", color: "#2D2D2D" }}
      >
        <div
          className="max-w-md w-full px-8 py-10 text-center"
          style={{ border: "1px solid #E0D0B8" }}
        >
          <div
            className="w-24 h-24 mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: "#F3EDE4", border: "1px solid #E0D0B8" }}
          >
            <svg
              className="w-12 h-12"
              style={{ color: "#9A6E50" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <h1
            className="text-2xl lg:text-3xl font-bold mb-4"
            style={{ fontFamily: "'Tenor Sans', serif", color: "#2D2D2D" }}
          >
            Your Cart is Empty
          </h1>
          <p className="text-sm mb-8 max-w-xs mx-auto" style={{ color: "#9A6E50" }}>
            Looks like you haven't added any items to your cart yet. Start shopping to see your items here.
          </p>
          <button
            onClick={() => router.push("/")}
            className="py-3 px-8 text-sm font-semibold tracking-wide transition-colors"
            style={{ backgroundColor: "#D2693F", color: "#fff" }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10 md:px-10 md:py-14 flex justify-center" style={{ backgroundColor: "#F9F6F0", color: "#2D2D2D" }}>
      <div className="w-full max-w-md px-4 py-6" style={{ border: "1px solid #E0D0B8" }}>
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Tenor Sans', serif" }}>
            Checkout
          </h1>
          <span className="text-xs" style={{ color: "#9A6E50" }}>
            {items.length} item{items.length === 1 ? "" : "s"}
          </span>
        </header>

        <section className="mb-6" style={{ border: "1px solid #E0D0B8" }}>
          <div
            className="px-4 py-3 text-sm font-semibold tracking-wide uppercase"
            style={{ borderBottom: "1px solid #E0D0B8", color: "#9A6E50" }}
          >
            Shipping Details
          </div>
          <div className="px-4 py-4 space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#9A6E50" }}>
                Full Name
              </label>
              <input
                type="text"
                value={customerDetails.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 text-sm"
                style={{ border: "1px solid #E0D0B8", backgroundColor: "#F9F6F0", color: "#2D2D2D" }}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#9A6E50" }}>
                Email
              </label>
              <input
                type="email"
                value={customerDetails.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-3 py-2 text-sm"
                style={{ border: "1px solid #E0D0B8", backgroundColor: "#F9F6F0", color: "#2D2D2D" }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#9A6E50" }}>
                Phone
              </label>
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-2 text-xs select-none"
                  style={{ border: "1px solid #E0D0B8", backgroundColor: "#F3EDE4", color: "#9A6E50" }}
                >
                  +91
                </span>
                <input
                  type="tel"
                  value={customerDetails.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: "1px solid #E0D0B8", backgroundColor: "#F9F6F0", color: "#2D2D2D" }}
                  placeholder="10 digit mobile number"
                  maxLength={10}
                  pattern="[0-9]{10}"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#9A6E50" }}>
                Address
              </label>
              <textarea
                value={customerDetails.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="w-full px-3 py-2 text-sm resize-none"
                style={{ border: "1px solid #E0D0B8", backgroundColor: "#F9F6F0", color: "#2D2D2D" }}
                rows={2}
                placeholder="Street, area, city"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold mb-1" style={{ color: "#9A6E50" }}>
                  PIN Code
                </label>
                <input
                  type="text"
                  value={customerDetails.pinCode}
                  onChange={(e) => handleInputChange("pinCode", e.target.value)}
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: "1px solid #E0D0B8", backgroundColor: "#F9F6F0", color: "#2D2D2D" }}
                  placeholder="6 digit PIN"
                  maxLength={6}
                  pattern="[0-9]{6}"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold mb-1" style={{ color: "#9A6E50" }}>
                  State / City
                </label>
                <input
                  type="text"
                  value={customerDetails.stateCity}
                  onChange={(e) => handleInputChange("stateCity", e.target.value)}
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: "1px solid #E0D0B8", backgroundColor: "#F9F6F0", color: "#2D2D2D" }}
                  placeholder="State / City"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6" style={{ border: "1px solid #E0D0B8" }}>
          <div
            className="px-4 py-3 text-sm font-semibold tracking-wide uppercase"
            style={{ borderBottom: "1px solid #E0D0B8", color: "#9A6E50" }}
          >
            Order Summary
          </div>
          <div className="px-4 py-3 text-sm">
            <ul className="mb-3" style={{ borderBottom: "1px solid #E0D0B8" }}>
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
                  <li
                    key={String(item.docId ?? item.ID)}
                    className="py-2 flex items-center justify-between gap-4"
                    style={{ borderBottom: "1px solid #E0D0B8" }}
                  >
                    <div className="flex-1">
                      <p className="text-sm" style={{ color: "#2D2D2D" }}>
                        {prod?.ProductName ?? prod?.Description ?? ""}
                        {item.Quantity > 1 ? ` x ${item.Quantity}` : ""}
                      </p>
                      {item.Size && (
                        <p className="text-xs" style={{ color: "#9A6E50" }}>
                          Size: {item.Size}
                        </p>
                      )}
                    </div>
                    <div className="text-sm font-medium" style={{ color: "#2D2D2D" }}>
                      <PriceText amount={linePrice} />
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between mb-1">
              <span style={{ color: "#9A6E50" }}>Subtotal</span>
              <span className="font-medium">
                <PriceText amount={grandTotal} />
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex items-center justify-between mb-1 text-xs">
                <span style={{ color: "#9A6E50" }}>Discount ({discountPercent}%)</span>
                <span className="font-medium" style={{ color: "#D2693F" }}>
                  - <PriceText amount={discountAmount} />
                </span>
              </div>
            )}
            <div className="flex items-center justify-between mb-1">
              <span style={{ color: "#9A6E50" }}>Shipping</span>
              <span className="font-medium">
                {pincodeChecked && customerDetails.pinCode.length === 6
                  ? shippingInfo.charge === 0
                    ? "Free"
                    : `Rs.${formatCurrency(shippingInfo.charge)}`
                  : "—"}
              </span>
            </div>
            {pincodeChecked && customerDetails.pinCode.length === 6 && (
              <div className="flex items-center justify-between mb-1 text-xs">
                <span style={{ color: "#9A6E50" }}>Delivery estimate</span>
                <span style={{ color: "#9A6E50" }}>
                  {shippingInfo.zone && <>{shippingInfo.zone} · </>}
                  {shippingInfo.estimatedDays} business days via DTDC
                </span>
              </div>
            )}
            <div
              className="flex items-center justify-between text-base font-semibold mt-2 pt-2"
              style={{ borderTop: "1px solid #E0D0B8" }}
            >
              <span>Total</span>
              <span>
                <PriceText amount={finalTotal} />
              </span>
            </div>
          </div>
        </section>

        <button
          onClick={handlePayment}
          disabled={!isFormValid() || orderStatus === "processing" || !razorpayLoaded}
          className="w-full py-3 text-sm font-semibold tracking-wide transition-colors"
          style={{
            backgroundColor: isFormValid() && razorpayLoaded && orderStatus !== "processing" ? "#D2693F" : "#E0D0B8",
            color: isFormValid() && razorpayLoaded && orderStatus !== "processing" ? "#fff" : "#9A6E50",
            cursor: isFormValid() && razorpayLoaded && orderStatus !== "processing" ? "pointer" : "not-allowed",
          }}
        >
          {orderStatus === "processing"
            ? "Processing..."
            : `Place Order • Rs.${formatCurrency(finalTotal)}`}
        </button>

        {!razorpayLoaded && (
          <p className="text-[11px] mt-2 text-center" style={{ color: "#9A6E50" }}>
            Initializing secure payment...
          </p>
        )}
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
