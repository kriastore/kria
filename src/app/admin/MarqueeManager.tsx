"use client";

import { useState } from "react";
import { useMarquee } from "@/hooks/useMarquee";

export default function MarqueeManager() {
  const { items, loading, saveItems } = useMarquee();
  const [draft, setDraft] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize draft from loaded items
  if (!initialized && !loading && items.length > 0) {
    setDraft([...items]);
    setInitialized(true);
  }

  const updateItem = (index: number, value: string) => {
    const updated = [...draft];
    updated[index] = value;
    setDraft(updated);
    setSuccess(false);
  };

  const removeItem = (index: number) => {
    setDraft(draft.filter((_, i) => i !== index));
    setSuccess(false);
  };

  const addItem = () => {
    const text = newItem.trim();
    if (!text) return;
    if (draft.includes(text)) {
      setError("This item already exists.");
      setTimeout(() => setError(null), 2000);
      return;
    }
    setDraft([...draft, text]);
    setNewItem("");
    setSuccess(false);
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const updated = [...draft];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updated.length) return;
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    setDraft(updated);
  };

  const handleSave = async () => {
    if (draft.length === 0) {
      setError("Add at least one marquee item.");
      setTimeout(() => setError(null), 2000);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveItems(draft);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#D2693F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Marquee Banner Text</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage the scrolling text banners shown at the top and bottom of the homepage.
        </p>
      </div>

      {/* Current items */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Banner Items</p>

        {draft.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No items yet. Add one below.</p>
        ) : (
          <div className="space-y-2">
            {draft.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveItem(index, "up")}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveItem(index, "down")}
                    disabled={index === draft.length - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateItem(index, e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D2693F]/30 focus:border-[#D2693F]"
                />
                <button
                  onClick={() => removeItem(index)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new item */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Add New Item</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => { setNewItem(e.target.value); setSuccess(false); }}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="e.g. Free Shipping on orders above Rs.1000"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D2693F]/30 focus:border-[#D2693F]"
          />
          <button
            onClick={addItem}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          Marquee text saved successfully.
        </div>
      )}

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#D2693F] text-white text-sm font-medium rounded-lg hover:bg-[#B85A34] disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Preview */}
      {draft.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Preview</p>
          <div className="bg-[#2D2D2D] py-2.5 overflow-hidden rounded">
            <div className="animate-marquee text-xs sm:text-sm text-[#F9F6F0] tracking-wider font-medium">
              {[...draft, ...draft].map((text, i) => (
                <span key={i} className="mx-6 sm:mx-8 inline-block whitespace-nowrap">✦ {text}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
