"use client";

import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { orderGstBreakdown } from "@/utils/gst";
import { generateInvoice } from "@/utils/generateInvoice";

type Order = {
  id: string;
  createdAt: any;
  userEmail: string;
  status?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    pinCode?: string;
    stateCity?: string;
  };
  total: number;
  shippingCharge?: number;
  items: any[];
};

type RangeKey = "today" | "month" | "lastmonth" | "quarter" | "fyear" | "all";

const RANGE_PRESETS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "month", label: "This Month" },
  { key: "lastmonth", label: "Last Month" },
  { key: "quarter", label: "This Quarter" },
  { key: "fyear", label: "Financial Year" },
  { key: "all", label: "All Time" },
];

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function presetRange(key: RangeKey): { from: string; to: string } {
  const now = new Date();
  switch (key) {
    case "today":
      return { from: toDateStr(now), to: toDateStr(now) };
    case "month":
      return {
        from: toDateStr(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: toDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      };
    case "lastmonth":
      return {
        from: toDateStr(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: toDateStr(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3);
      return {
        from: toDateStr(new Date(now.getFullYear(), q * 3, 1)),
        to: toDateStr(new Date(now.getFullYear(), q * 3 + 3, 0)),
      };
    }
    case "fyear": {
      const fyStart = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
      return {
        from: toDateStr(new Date(fyStart, 3, 1)),
        to: toDateStr(now),
      };
    }
    default:
      return { from: "", to: "" };
  }
}

const fmt = (n: number | undefined | null) =>
  (Number(n || 0)).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const fmtDate = (ts: any) =>
  ts?.toDate
    ? ts.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : ts
      ? new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : "";

export default function FinancesTab({ orders }: { orders: Order[] }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activePreset, setActivePreset] = useState<RangeKey | null>(null);
  const [status, setStatus] = useState<string>("all");

  const applyPreset = (key: RangeKey) => {
    const r = presetRange(key);
    setFrom(r.from);
    setTo(r.to);
    setActivePreset(key);
  };

  const filtered = useMemo(() => {
    const fromMs = from ? new Date(from + "T00:00:00").getTime() : null;
    const toMs = to ? new Date(to + "T23:59:59.999").getTime() : null;
    return orders
      .filter((o) => {
        const ts = o.createdAt?.toDate ? o.createdAt.toDate().getTime() : o.createdAt ? new Date(o.createdAt).getTime() : null;
        if (ts === null) return false;
        if (fromMs !== null && ts < fromMs) return false;
        if (toMs !== null && ts > toMs) return false;
        return true;
      })
      .filter((o) => status === "all" || (o.status || "placed") === status)
      .sort((a, b) => {
        const at = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bt = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return at - bt;
      });
  }, [orders, from, to, status]);

  const summary = useMemo(() => {
    let invoiceCount = 0;
    let taxable = 0;
    let cgst = 0;
    let sgst = 0;
    let gst = 0;
    let shippingTax = 0;
    let shipping = 0;
    let revenue = 0;
    filtered.forEach((o) => {
      const b = orderGstBreakdown(o);
      invoiceCount += 1;
      taxable += b.taxableValue;
      cgst += b.cgst;
      sgst += b.sgst;
      gst += b.gst;
      shippingTax += b.shippingGst;
      shipping += Number(o.shippingCharge ?? 0);
      revenue += Number(o.total ?? 0);
    });
    return {
      invoiceCount,
      taxable: Math.round(taxable * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      gst: Math.round(gst * 100) / 100,
      shippingTax: Math.round(shippingTax * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      revenue: Math.round(revenue * 100) / 100,
    };
  }, [filtered]);

  const exportToExcel = () => {
    const rows = filtered.map((o, i) => {
      const b = orderGstBreakdown(o);
      const c = o.customer || {};
      return {
        "#": i + 1,
        "Invoice No": `KRIA-INV-${o.id.slice(-8).toUpperCase()}`,
        "Order ID": o.id,
        Date: fmtDate(o.createdAt),
        Status: o.status || "placed",
        Customer: c.name || "",
        Email: c.email || o.userEmail || "",
        "State/City": c.stateCity || "",
        "Taxable Value": b.taxableValue,
        "CGST": b.cgst,
        "SGST": b.sgst,
        "GST Total": b.gst,
        "Shipping Taxable": b.shippingTaxable,
        "Shipping CGST": b.shippingCgst,
        "Shipping SGST": b.shippingSgst,
        "Shipping": Number(o.shippingCharge ?? 0),
        "Total Tax": b.totalTax,
        "Grand Total": Number(o.total ?? 0),
      };
    });

    const summaryRows = [
      {
        "#": 0,
        "Invoice No": "SUMMARY",
        "Order ID": "",
        Date: `${from || "Start"} to ${to || "End"}`,
        Status: `${filtered.length} invoices`,
        Customer: "",
        Email: "",
        "State/City": "",
        "Taxable Value": summary.taxable,
        "CGST": summary.cgst,
        "SGST": summary.sgst,
        "GST Total": summary.gst,
        "Shipping Taxable": Math.round((summary.shipping - summary.shippingTax) * 100) / 100,
        "Shipping CGST": Math.round(summary.shippingTax / 2 * 100) / 100,
        "Shipping SGST": Math.round(summary.shippingTax / 2 * 100) / 100,
        "Shipping": summary.shipping,
        "Total Tax": Math.round((summary.gst + summary.shippingTax) * 100) / 100,
        "Grand Total": summary.revenue,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(summaryRows.concat(rows));
    ws["!cols"] = [
      { wch: 4 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
      { wch: 20 }, { wch: 26 }, { wch: 18 }, { wch: 14 }, { wch: 10 },
      { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
      { wch: 12 }, { wch: 10 }, { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoice Register");
    XLSX.writeFile(wb, `kria-invoices-${from || "all"}-to-${to || "all"}.xlsx`);
  };

  const stats = [
    { label: "Invoices", value: String(summary.invoiceCount), color: "text-[#D2693F]" },
    { label: "Taxable Value", value: `Rs. ${fmt(summary.taxable)}`, color: "text-gray-900" },
    { label: "CGST", value: `Rs. ${fmt(summary.cgst)}`, color: "text-emerald-600" },
    { label: "SGST", value: `Rs. ${fmt(summary.sgst)}`, color: "text-emerald-600" },
    { label: "Total GST", value: `Rs. ${fmt(summary.gst)}`, color: "text-emerald-700" },
    { label: "Shipping Tax", value: `Rs. ${fmt(summary.shippingTax)}`, color: "text-emerald-600" },
    { label: "Shipping", value: `Rs. ${fmt(summary.shipping)}`, color: "text-gray-700" },
    { label: "Revenue", value: `Rs. ${fmt(summary.revenue)}`, color: "text-blue-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Finances</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Invoice register for tax filing. GST split shown for handicrafts (CGST 1.5% + SGST 1.5%).
          </p>
        </div>
        <button
          onClick={exportToExcel}
          disabled={filtered.length === 0}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-[#D2693F] text-white hover:bg-[#B85A34] disabled:opacity-50 transition-colors"
        >
          Export to Excel
        </button>
      </div>

      {/* Date range */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setActivePreset(null); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D2693F]/30 focus:border-[#D2693F]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setActivePreset(null); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D2693F]/30 focus:border-[#D2693F]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
            >
              <option value="all">All</option>
              <option value="placed">Placed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGE_PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                activePreset === p.key
                  ? "bg-[#D2693F] text-white border-[#D2693F]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-xl font-bold mt-2 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Register table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">No invoices in the selected range.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Invoice No</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">State/City</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Taxable Value</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">CGST</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">SGST</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Total</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">PDF</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const b = orderGstBreakdown(o);
                  return (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-mono text-xs">KRIA-INV-{o.id.slice(-8).toUpperCase()}</td>
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                      <td className="py-3 px-4">{o.customer?.name || o.userEmail}</td>
                      <td className="py-3 px-4 text-gray-500">{o.customer?.stateCity || ""}</td>
                      <td className="py-3 px-4 text-right font-medium">{fmt(b.taxableValue)}</td>
                      <td className="py-3 px-4 text-right">{fmt(b.cgst)}</td>
                      <td className="py-3 px-4 text-right">{fmt(b.sgst)}</td>
                      <td className="py-3 px-4 text-right font-bold">Rs. {fmt(o.total)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => generateInvoice(o)}
                          className="text-xs text-[#D2693F] hover:underline font-medium"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
