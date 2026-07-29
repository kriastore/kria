"use client";

import React, { useState, useEffect } from "react";
import { useContactInfo, type ContactInfo } from "@/hooks/useContactInfo";

const INPUT_CLS = "w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition-all";
const TEXTAREA_CLS = "w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition-all min-h-[100px]";

export default function ContactInfoManager() {
  const { info, loading, saveContactInfo } = useContactInfo();
  const [draft, setDraft] = useState<ContactInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (info && !draft) setDraft({ ...info });
  }, [info]);

  if (loading || !draft) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#D2693F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const update = (field: keyof ContactInfo, value: string) => {
    setDraft({ ...draft, [field]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveContactInfo(draft);
      setMessage("Contact info saved successfully!");
    } catch (e: any) {
      setMessage("Error saving: " + (e?.message || e));
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Contact Info</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-[#D2693F] text-white text-sm font-medium rounded-lg hover:bg-[#b85a35] disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save All"}
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.includes("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone</label>
              <input type="text" value={draft.phone} onChange={(e) => update("phone", e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</label>
              <input type="text" value={draft.email} onChange={(e) => update("email", e.target.value)} className={INPUT_CLS} />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Address</label>
            <textarea value={draft.address} onChange={(e) => update("address", e.target.value)} className={TEXTAREA_CLS} rows={4} />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Business Hours</label>
            <input type="text" value={draft.hours} onChange={(e) => update("hours", e.target.value)} className={INPUT_CLS} />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Social Links</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Instagram — Terracotta Jewellery</label>
              <input type="url" value={draft.instagramJewellery} onChange={(e) => update("instagramJewellery", e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Instagram — Home Decor</label>
              <input type="url" value={draft.instagramHomeDecor} onChange={(e) => update("instagramHomeDecor", e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Facebook — Terracotta Jewellery</label>
              <input type="url" value={draft.facebookJewellery} onChange={(e) => update("facebookJewellery", e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Facebook — Home Decor</label>
              <input type="url" value={draft.facebookHomeDecor} onChange={(e) => update("facebookHomeDecor", e.target.value)} className={INPUT_CLS} />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">GST Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">GSTIN</label>
              <input type="text" value={draft.gstin} onChange={(e) => update("gstin", e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Legal Name</label>
              <input type="text" value={draft.legalName} onChange={(e) => update("legalName", e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Trade Name</label>
              <input type="text" value={draft.tradeName} onChange={(e) => update("tradeName", e.target.value)} className={INPUT_CLS} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
