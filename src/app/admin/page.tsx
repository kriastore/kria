"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { db } from "@/firebase";
import { resolvePricing } from "@/utils/pricing";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import InventoryTable from "./InventoryTable";
import CategoriesManager from "./CategoriesManager";
import MarqueeManager from "./MarqueeManager";
import ProductImage from "@/components/ProductImage";

type AdminTab = "overview" | "products" | "categories" | "orders" | "marquee";

type OrderStatus = "placed" | "processing" | "shipped" | "done" | "cancelled";

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
  items: any[];
};

const ORDER_STATUSES: OrderStatus[] = ["placed", "processing", "shipped", "done", "cancelled"];

const STATUS_COLORS: Record<OrderStatus, string> = {
  placed: "bg-gray-100 text-gray-700",
  processing: "bg-blue-50 text-blue-700",
  shipped: "bg-[#F9F6F0] text-[#D2693F]",
  done: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin(user);
  const router = useRouter();

  const [tab, setTab] = useState<AdminTab>("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [trackingEdits, setTrackingEdits] = useState<Record<string, string>>({});
  const [updatingTrackingId, setUpdatingTrackingId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/sign-in");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && !adminLoading && user && !isAdmin) router.replace("/");
  }, [user, authLoading, adminLoading, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin || !db) return;

    const q = query(collection(db!, "Orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setFetching(false);
    }, (err) => {
      setError("Failed to fetch orders: " + err.message);
      setFetching(false);
    });

    return () => unsub();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || !db) return;
    getDocs(collection(db!, "inventory")).then((snap) => {
      setProductCount(snap.size);
    });
  }, [isAdmin]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F6F0]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#D2693F] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading admin panel…</span>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await updateDoc(doc(db!, "Orders", orderId), { status: newStatus });
    } catch (err: any) {
      setError("Failed to update order: " + err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleTrackingUpdate = async (orderId: string) => {
    const val = (trackingEdits[orderId] ?? "").trim();
    setUpdatingTrackingId(orderId);
    try {
      await updateDoc(doc(db!, "Orders", orderId), { trackingId: val });
    } catch (err: any) {
      setError("Failed to update tracking: " + err.message);
    } finally {
      setUpdatingTrackingId(null);
    }
  };

  const formatDate = (ts: any) =>
    ts?.toDate
      ? ts.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : "";

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const placedOrders = orders.filter((o) => o.status === "placed").length;
  const deliveredOrders = orders.filter((o) => o.status === "done").length;

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
    },
    {
      id: "products",
      label: "Products",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
    },
    {
      id: "categories",
      label: "Categories",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
    },
    {
      id: "orders",
      label: "Orders",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
    },
    {
      id: "marquee",
      label: "Marquee",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9F6F0] flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-[100dvh] h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 lg:translate-x-0 overflow-y-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-lg font-bold text-[#2D2D2D]" style={{ fontFamily: "var(--font-playfair)" }}>Kria Admin</h1>
          <p className="text-xs text-gray-400 mt-0.5">Dashboard</p>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === item.id
                  ? "bg-[#D2693F] text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <button
            onClick={() => router.push("/")}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors mt-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Store
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 capitalize">{tab}</h2>
          </div>
          <div className="text-xs text-gray-400 hidden sm:block">{user.email}</div>
        </header>

        {/* Error */}
        {error && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-2">✕</button>
          </div>
        )}

        <div className="p-4 sm:p-6 lg:p-8">
          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Revenue", value: formatCurrency(revenue), color: "text-emerald-600" },
                  { label: "Total Orders", value: String(orders.length), color: "text-[#D2693F]" },
                  { label: "Pending Orders", value: String(placedOrders), color: "text-amber-600" },
                  { label: "Products", value: String(productCount), color: "text-blue-600" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                    <p className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Orders</h3>
                {orders.length === 0 ? (
                  <p className="text-sm text-gray-400">No orders yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 pr-4 font-medium text-gray-500">Order</th>
                          <th className="text-left py-2 pr-4 font-medium text-gray-500">Customer</th>
                          <th className="text-left py-2 pr-4 font-medium text-gray-500">Date</th>
                          <th className="text-left py-2 pr-4 font-medium text-gray-500">Status</th>
                          <th className="text-right py-2 font-medium text-gray-500">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map((order) => (
                          <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="py-3 pr-4 font-mono text-xs">{order.id.slice(-8).toUpperCase()}</td>
                            <td className="py-3 pr-4">{order.customer?.name || order.userEmail}</td>
                            <td className="py-3 pr-4 text-gray-500">{formatDate(order.createdAt)}</td>
                            <td className="py-3 pr-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[order.status]}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-3 text-right font-medium">{formatCurrency(order.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {orders.length > 5 && (
                  <button onClick={() => setTab("orders")} className="mt-3 text-xs text-[#D2693F] hover:underline font-medium">
                    View all orders →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── PRODUCTS ── */}
          {tab === "products" && <InventoryTable />}

          {/* ── CATEGORIES ── */}
          {tab === "categories" && <CategoriesManager />}

          {/* ── MARQUEE ── */}
          {tab === "marquee" && <MarqueeManager />}

          {/* ── ORDERS ── */}
          {tab === "orders" && (
            <div className="space-y-4">
              {fetching ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#D2693F] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <p className="text-gray-500">No orders yet.</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm font-mono">#{order.id.slice(-8).toUpperCase()}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[order.status]}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                        {order.customer && (
                          <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                            <p className="font-medium text-gray-900">{order.customer.name}</p>
                            {order.customer.phone && <p>{order.customer.phone}</p>}
                            {order.customer.address && <p>{order.customer.address}, {order.customer.stateCity || ""} {order.customer.pinCode || ""}</p>}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 sm:items-end w-full sm:w-auto">
                        <p className="text-lg font-bold text-[#D2693F]">{formatCurrency(order.total)}</p>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value as OrderStatus)}
                          disabled={updatingOrderId === order.id}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <input
                            type="text"
                            value={trackingEdits[order.id] ?? order.trackingId ?? ""}
                            onChange={(e) => setTrackingEdits((p) => ({ ...p, [order.id]: e.target.value }))}
                            placeholder="Tracking ID"
                            className="flex-1 sm:w-36 border border-gray-200 rounded-lg px-3 py-1.5 text-xs"
                          />
                          <button
                            onClick={() => handleTrackingUpdate(order.id)}
                            disabled={updatingTrackingId === order.id}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3 space-y-2">
                      {order.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 text-xs">
                          <ProductImage
                            src={item.product?.ImageUrl1}
                            size="thumb"
                            alt=""
                            className="w-10 h-10 rounded object-cover bg-gray-100"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.product?.ProductName || item.product?.Description || "Product"} × {item.Quantity}</p>
                            {item.isCustomized && <p className="text-blue-600">Customised</p>}
                          </div>
                          <p className="font-medium">{formatCurrency(resolvePricing({ Price: item.product?.Price, OriginalPrice: item.product?.OriginalPrice, DiscountPercent: item.product?.DiscountPercent }).selling * item.Quantity)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
