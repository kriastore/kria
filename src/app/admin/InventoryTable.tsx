"use client";

import React, { useEffect, useState, useCallback } from "react";
import { db } from "@/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc as firestoreDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { uploadProductImage } from "@/utils/uploadImage";
import { resolvePricing } from "@/utils/pricing";
import ProductImage from "@/components/ProductImage";
import { useCategories } from "@/hooks/useCategories";
import ImageEditor from "@/components/ImageEditor";

type Item = { id: string; [k: string]: any };

export type FormState = {
  ProductName: string;
  Description: string;
  Instructions: string;
  ID: string;
  ImageUrl1: string;
  ImageUrl1Medium: string;
  ImageUrl1Thumb: string;
  ImageUrl2: string;
  ImageUrl2Medium: string;
  ImageUrl2Thumb: string;
  ImageUrl3: string;
  ImageUrl3Medium: string;
  ImageUrl3Thumb: string;
  Price: string;
  Category: string;
  OriginalPrice: string;
  Stock: string;
  StockType: string;
  IsCustomizable: boolean;
  CustomizationNote: string;
  DeliveryTime: string;
  DiscountPercent: string;
  IsFeatured: boolean;
  PricingMode: "price" | "discount";
  Colors: string;
  Sizes: string;
  Care: string;
};

const INPUT_CLS = "w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition-all";
const LABEL_CLS = "block text-xs font-semibold text-slate-600 mb-1.5 tracking-wide uppercase";
const SECTION_TITLE_CLS = "text-xs font-bold text-[#D2693F] uppercase tracking-widest pb-2 border-b border-slate-100";

function ImageUploadField({
  label,
  fieldName,
  value,
  isUploading,
  onUpload,
  onRemove,
  onFileSelect,
}: {
  label: string;
  fieldName: "ImageUrl1" | "ImageUrl2" | "ImageUrl3";
  value: string;
  isUploading: boolean;
  onUpload: (file: File, fieldName: "ImageUrl1" | "ImageUrl2" | "ImageUrl3") => void;
  onRemove: (fieldName: "ImageUrl1" | "ImageUrl2" | "ImageUrl3") => void;
  onFileSelect: (file: File, fieldName: "ImageUrl1" | "ImageUrl2" | "ImageUrl3") => void;
}) {
  return (
    <div className="flex flex-col">
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      <label className="relative flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-[#C5A059] hover:bg-[#F9F6F0]/40 transition-all overflow-hidden group">
        {isUploading ? (
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-5 h-5 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] text-[#D2693F] font-medium">Uploading…</span>
          </div>
        ) : value ? (
          <>
            <img src={value} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[10px] text-white font-medium bg-black/50 px-2 py-1 rounded">Change</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-slate-400 group-hover:text-[#C5A059] transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="text-[10px] font-medium">Upload</span>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect(file, fieldName);
            e.target.value = '';
          }}
        />
      </label>
      {value && (
        <button
          type="button"
          onClick={() => onRemove(fieldName)}
          className="mt-1.5 text-[10px] text-red-500 hover:text-red-700 font-medium transition-colors"
        >
          Remove
        </button>
      )}
    </div>
  );
}

function ProductForm({
  mode,
  form,
  updateForm,
  categories,
  uploadingField,
  onUpload,
  onFileSelect,
  onSubmit,
  onCancel,
}: {
  mode: "add" | "edit";
  form: FormState;
  updateForm: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  categories: string[];
  uploadingField: "ImageUrl1" | "ImageUrl2" | "ImageUrl3" | null;
  onUpload: (file: File, fieldName: "ImageUrl1" | "ImageUrl2" | "ImageUrl3") => void;
  onFileSelect: (file: File, fieldName: "ImageUrl1" | "ImageUrl2" | "ImageUrl3") => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-7 py-5 space-y-7">

        {/* ── Basic Info ── */}
        <section className="space-y-4">
          <h4 className={SECTION_TITLE_CLS}>Basic Info</h4>
          <div>
            <label className={LABEL_CLS}>Category</label>
            <select className={INPUT_CLS} value={form.Category} onChange={(e) => updateForm('Category', e.target.value)}>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL_CLS}>Product Name</label>
            <input className={INPUT_CLS} value={form.ProductName} onChange={(e) => updateForm('ProductName', e.target.value)} placeholder="e.g. Terracotta Lotus Earrings" />
          </div>
          <div>
            <label className={LABEL_CLS}>Description</label>
            <textarea rows={3} className={INPUT_CLS + " resize-none"} value={form.Description} onChange={(e) => updateForm('Description', e.target.value)} placeholder="Detailed product description…" />
          </div>
          <div>
            <label className={LABEL_CLS}>Instructions</label>
            <textarea className={INPUT_CLS + " min-h-[80px]"} value={form.Instructions} onChange={(e) => updateForm('Instructions', e.target.value)} placeholder={"e.g. Hand wash gently\nStore in a dry place"} />
          </div>
          <div>
            <label className={LABEL_CLS}>Care</label>
            <textarea className={INPUT_CLS + " min-h-[80px]"} value={form.Care} onChange={(e) => updateForm('Care', e.target.value)} placeholder={"e.g. Avoid contact with water\nStore in a cool dry place"} />
          </div>
        </section>

        {/* ── Images ── */}
        <section className="space-y-4">
          <h4 className={SECTION_TITLE_CLS}>Images</h4>
          <div className="grid grid-cols-3 gap-4">
            <ImageUploadField label="Main" fieldName="ImageUrl1" value={form.ImageUrl1} isUploading={uploadingField === "ImageUrl1"} onUpload={onUpload} onRemove={(f) => { updateForm(f, ""); updateForm("ImageUrl1Medium" as any, ""); updateForm("ImageUrl1Thumb" as any, ""); }} onFileSelect={onFileSelect} />
            <ImageUploadField label="Gallery 1" fieldName="ImageUrl2" value={form.ImageUrl2} isUploading={uploadingField === "ImageUrl2"} onUpload={onUpload} onRemove={(f) => { updateForm(f, ""); updateForm("ImageUrl2Medium" as any, ""); updateForm("ImageUrl2Thumb" as any, ""); }} onFileSelect={onFileSelect} />
            <ImageUploadField label="Gallery 2" fieldName="ImageUrl3" value={form.ImageUrl3} isUploading={uploadingField === "ImageUrl3"} onUpload={onUpload} onRemove={(f) => { updateForm(f, ""); updateForm("ImageUrl3Medium" as any, ""); updateForm("ImageUrl3Thumb" as any, ""); }} onFileSelect={onFileSelect} />
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="space-y-4">
          <h4 className={SECTION_TITLE_CLS}>Pricing</h4>
          <div>
            <label className={LABEL_CLS}>Original Price (MRP) Rs.</label>
            <input type="number" className={INPUT_CLS} value={form.OriginalPrice} onChange={(e) => updateForm('OriginalPrice', e.target.value)} placeholder="e.g. 999" />
          </div>
          <div>
            <label className={LABEL_CLS}>Set Price By</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { updateForm('PricingMode', 'price'); updateForm('DiscountPercent', ''); }}
                className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                  form.PricingMode === "price"
                    ? "border-[#D2693F] bg-[#D2693F]/5 text-[#D2693F]"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                Selling Price
              </button>
              <button
                type="button"
                onClick={() => { updateForm('PricingMode', 'discount'); updateForm('Price', ''); }}
                className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                  form.PricingMode === "discount"
                    ? "border-[#D2693F] bg-[#D2693F]/5 text-[#D2693F]"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                Discount %
              </button>
            </div>
          </div>
          {form.PricingMode === "price" ? (
            <div>
              <label className={LABEL_CLS}>Selling Price (Rs.)</label>
              <input type="number" className={INPUT_CLS} value={form.Price} onChange={(e) => updateForm('Price', e.target.value)} placeholder="e.g. 799" />
            </div>
          ) : (
            <div>
              <label className={LABEL_CLS}>Discount (%)</label>
              <div className="relative">
                <input type="number" min="1" max="90" className={INPUT_CLS + " pr-8"} value={form.DiscountPercent} onChange={(e) => updateForm('DiscountPercent', e.target.value)} placeholder="e.g. 20" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
              </div>
            </div>
          )}
          {form.OriginalPrice && (
            <div className="rounded-lg bg-[#F9F6F0] border border-[#E0D0B8] px-4 py-3">
              <p className="text-xs font-semibold text-[#D2693F] uppercase tracking-wide mb-1">Customer Sees</p>
              <div className="flex items-baseline gap-3">
                <span className="text-lg font-bold text-[#D2693F]">
                  Rs.{form.PricingMode === "price" && form.Price
                    ? Number(form.Price).toLocaleString("en-IN")
                    : form.PricingMode === "discount" && form.DiscountPercent
                      ? Math.round(Number(form.OriginalPrice) * (1 - Number(form.DiscountPercent) / 100)).toLocaleString("en-IN")
                      : Number(form.OriginalPrice).toLocaleString("en-IN")
                  }
                </span>
                {((form.PricingMode === "price" && form.Price && Number(form.Price) < Number(form.OriginalPrice)) ||
                  (form.PricingMode === "discount" && form.DiscountPercent)) && (
                  <>
                    <span className="text-sm text-slate-400 line-through">Rs.{Number(form.OriginalPrice).toLocaleString("en-IN")}</span>
                    <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      {form.PricingMode === "discount"
                        ? `${form.DiscountPercent}% OFF`
                        : `${Math.round(((Number(form.OriginalPrice) - Number(form.Price)) / Number(form.OriginalPrice)) * 100)}% OFF`
                      }
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ── Stock ── */}
        <section className="space-y-4">
          <h4 className={SECTION_TITLE_CLS}>Stock & Availability</h4>
          <div>
            <label className={LABEL_CLS}>Stock Type</label>
            <div className="grid grid-cols-2 gap-3">
              {(["ready_stock", "made_to_order"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => updateForm('StockType', t)}
                  className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    form.StockType === t
                      ? "border-[#D2693F] bg-[#D2693F]/5 text-[#D2693F]"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {t === "ready_stock" ? "Ready Stock" : "Made to Order"}
                </button>
              ))}
            </div>
          </div>
          {form.StockType === "ready_stock" && (
            <div>
              <label className={LABEL_CLS}>Quantity in Stock</label>
              <input type="number" min="0" className={INPUT_CLS} value={form.Stock} onChange={(e) => updateForm('Stock', e.target.value)} placeholder="0" />
            </div>
          )}
          <div>
            <label className={LABEL_CLS}>Delivery Time</label>
            <input className={INPUT_CLS} value={form.DeliveryTime} onChange={(e) => updateForm('DeliveryTime', e.target.value)} placeholder="e.g. 2-4 days" />
            <p className="text-xs text-slate-400 mt-1">Displayed to customers on the product page</p>
          </div>
        </section>

        {/* ── Options ── */}
        <section className="space-y-4">
          <h4 className={SECTION_TITLE_CLS}>Options</h4>
          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={form.IsCustomizable}
                  onChange={(e) => updateForm('IsCustomizable', e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 rounded border-2 border-slate-300 peer-checked:border-[#D2693F] peer-checked:bg-[#D2693F] transition-all flex items-center justify-center">
                  {form.IsCustomizable && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Customizable</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={form.IsFeatured}
                  onChange={(e) => updateForm('IsFeatured', e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 rounded border-2 border-slate-300 peer-checked:border-[#C5A059] peer-checked:bg-[#C5A059] transition-all flex items-center justify-center">
                  {form.IsFeatured && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Featured</span>
            </label>
          </div>
          {form.IsCustomizable && (
            <div>
              <label className={LABEL_CLS}>Customisation Note</label>
              <input className={INPUT_CLS} value={form.CustomizationNote} onChange={(e) => updateForm('CustomizationNote', e.target.value)} placeholder="e.g. Available in custom colors and sizes" />
            </div>
          )}
          <div>
            <label className={LABEL_CLS}>Colour Options</label>
            <input className={INPUT_CLS} value={form.Colors} onChange={(e) => updateForm('Colors', e.target.value)} placeholder="e.g. Red, Green, Blue (comma-separated, leave blank if none)" />
            <p className="text-xs text-slate-400 mt-1">Leave empty if product has no colour variants</p>
          </div>
          <div>
            <label className={LABEL_CLS}>Size Options</label>
            <input className={INPUT_CLS} value={form.Sizes} onChange={(e) => updateForm('Sizes', e.target.value)} placeholder="e.g. S, M, L, XL (comma-separated, leave blank if none)" />
            <p className="text-xs text-slate-400 mt-1">Leave empty if product has no size variants</p>
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-end gap-3 px-7 py-4 border-t border-slate-100 bg-slate-50/50">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 rounded-lg bg-[#D2693F] text-white text-sm font-semibold hover:bg-[#B85A34] shadow-sm transition-all active:scale-[0.98]"
        >
          {mode === "add" ? "Add Product" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function formatValue(val: any) {
  if (val === null || val === undefined) return "";
  if (typeof val === "object" && typeof (val?.toDate) === "function") {
    try {
      return new Date(val.toDate()).toLocaleString();
    } catch (e) {
      return String(val);
    }
  }
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

export default function InventoryTable() {
  const { categories: firestoreCategories } = useCategories();
  const CATEGORIES = firestoreCategories.map((c) => c.name);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorFile, setEditorFile] = useState<File | null>(null);
  const [editorFieldName, setEditorFieldName] = useState<"ImageUrl1" | "ImageUrl2" | "ImageUrl3" | null>(null);

  const emptyForm: FormState = {
    ProductName: "",
    Description: "",
    Instructions: "",
    ID: "",
    ImageUrl1: "",
    ImageUrl1Medium: "",
    ImageUrl1Thumb: "",
    ImageUrl2: "",
    ImageUrl2Medium: "",
    ImageUrl2Thumb: "",
    ImageUrl3: "",
    ImageUrl3Medium: "",
    ImageUrl3Thumb: "",
    Price: "",
    Category: CATEGORIES[0] || "",
    OriginalPrice: "",
    Stock: "0",
    StockType: "ready_stock",
    IsCustomizable: false,
    CustomizationNote: "",
    DeliveryTime: "",
    DiscountPercent: "",
    IsFeatured: false,
    PricingMode: "price",
    Colors: "",
    Sizes: "",
    Care: "",
  };

  const [form, setForm] = useState<FormState>(emptyForm);
  const [uploadingField, setUploadingField] = useState<"ImageUrl1" | "ImageUrl2" | "ImageUrl3" | null>(null);

  function updateForm<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  const handleFileUpload = useCallback(async (
    file: File,
    fieldName: "ImageUrl1" | "ImageUrl2" | "ImageUrl3"
  ) => {
    setUploadingField(fieldName);
    try {
      const productId = editingId || `new-${Date.now()}`;
      const slot = fieldName === "ImageUrl1" ? 1 : fieldName === "ImageUrl2" ? 2 : 3;
      const result = await uploadProductImage(file, productId, slot as 1 | 2 | 3);
      updateForm(fieldName, result.url);
      const mediumKey = `${fieldName}Medium` as keyof FormState;
      const thumbKey = `${fieldName}Thumb` as keyof FormState;
      updateForm(mediumKey as any, result.mediumUrl);
      updateForm(thumbKey as any, result.thumbUrl);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setUploadingField(null);
    }
  }, [editingId]);

  useEffect(() => {
    if (!db) return;
    setLoading(true);
    const colRef = collection(db!, "inventory");
    const unsub = onSnapshot(colRef, (snap) => {
      const rows: Item[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Item));
      setAllItems(rows);
      setLoading(false);
    }, (e) => {
      const msg = String((e as any)?.message ?? e);
      if ((e as any)?.code === "permission-denied" || msg.toLowerCase().includes("permission")) {
        setError("Permission denied reading the inventory collection.");
      } else setError(msg);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const lowerSearch = (search || "").trim().toLowerCase();
  const filteredItems = lowerSearch
    ? allItems.filter((it) => {
        const productName = (it?.ProductName ?? "").toString().toLowerCase();
        const description = (it?.Description ?? "").toString().toLowerCase();
        return productName.includes(lowerSearch) || description.includes(lowerSearch);
      })
    : allItems;

  async function handleDelete(docId?: string) {
    if (!docId) return setError('Document id missing');
    if (!confirm('Delete this item?')) return;
    try {
      await deleteDoc(firestoreDoc(db!, 'inventory', docId));
      setError(null);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  async function handleAddSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!db) return setError('Firestore not initialized');
    try {
      const existingIds = allItems.map((it) => Number(it?.ID ?? it?.id)).filter((n) => !isNaN(n));
      const maxId = existingIds.length ? Math.max(...existingIds) : 0;
      const nextId = maxId + 1;

      const payload: any = {
        ProductName: form.ProductName || "",
        Description: form.Description || "",
        Instructions: form.Instructions || "",
        ID: nextId,
        ImageUrl1: form.ImageUrl1 || "",
        ImageUrl1Medium: form.ImageUrl1Medium || "",
        ImageUrl1Thumb: form.ImageUrl1Thumb || "",
        ImageUrl2: form.ImageUrl2 || "",
        ImageUrl2Medium: form.ImageUrl2Medium || "",
        ImageUrl2Thumb: form.ImageUrl2Thumb || "",
        ImageUrl3: form.ImageUrl3 || "",
        ImageUrl3Medium: form.ImageUrl3Medium || "",
        ImageUrl3Thumb: form.ImageUrl3Thumb || "",
        Price: form.PricingMode === "price" && form.Price ? Number(form.Price) : undefined,
        Category: form.Category || "",
        OriginalPrice: form.OriginalPrice ? Number(form.OriginalPrice) : undefined,
        createdAt: serverTimestamp(),
        Stock: form.StockType === "ready_stock" ? (form.Stock ? Number(form.Stock) : 0) : undefined,
        StockType: form.StockType || "ready_stock",
        DeliveryTime: form.DeliveryTime || "",
        IsCustomizable: form.IsCustomizable || false,
        CustomizationNote: form.CustomizationNote || "",
        DiscountPercent: form.PricingMode === "discount" && form.DiscountPercent ? Number(form.DiscountPercent) : undefined,
        IsFeatured: form.IsFeatured || false,
        Colors: form.Colors ? form.Colors.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        Sizes: form.Sizes ? form.Sizes.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        Care: form.Care || "",
      };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      await addDoc(collection(db!, 'inventory'), payload);
      setShowAddModal(false);
      setForm({ ...emptyForm, Category: CATEGORIES[0] || "" });
      setError(null);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  function openEditModal(item: Item) {
    setEditingId(item.id ?? null);
    setForm({
      ProductName: item.ProductName ?? item.Description ?? "",
      Description: item.Description ?? "",
      Instructions: item.Instructions ?? "",
      ID: item.ID ? String(item.ID) : (item.id ?? ""),
      ImageUrl1: item.ImageUrl1 ?? "",
      ImageUrl1Medium: item.ImageUrl1Medium ?? "",
      ImageUrl1Thumb: item.ImageUrl1Thumb ?? "",
      ImageUrl2: item.ImageUrl2 ?? "",
      ImageUrl2Medium: item.ImageUrl2Medium ?? "",
      ImageUrl2Thumb: item.ImageUrl2Thumb ?? "",
      ImageUrl3: item.ImageUrl3 ?? "",
      ImageUrl3Medium: item.ImageUrl3Medium ?? "",
      ImageUrl3Thumb: item.ImageUrl3Thumb ?? "",
      Price: item.Price ? String(item.Price) : "",
      Category: item.Category ?? item.Product ?? CATEGORIES[0] ?? "",
      OriginalPrice: item.OriginalPrice ? String(item.OriginalPrice) : "",
      Stock: item.Stock !== undefined ? String(item.Stock) : "0",
      StockType: item.StockType ?? "ready_stock",
      IsCustomizable: item.IsCustomizable ?? false,
      CustomizationNote: item.CustomizationNote ?? "",
      DeliveryTime: item.DeliveryTime ?? "",
      DiscountPercent: item.DiscountPercent ? String(item.DiscountPercent) : "",
      IsFeatured: item.IsFeatured ?? false,
      PricingMode: item.Price != null && item.Price !== 0 ? "price" : "discount",
      Colors: Array.isArray(item.Colors) ? item.Colors.join(", ") : (item.Colors ?? ""),
      Sizes: Array.isArray(item.Sizes) ? item.Sizes.join(", ") : (item.Sizes ?? ""),
      Care: item.Care ?? "",
    });
    setShowEditModal(true);
  }

  async function handleEditSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!db) return setError('Firestore not initialized');
    if (!editingId) return setError('No document selected for edit');
    try {
      const payload: any = {
        ProductName: form.ProductName || "",
        Description: form.Description || "",
        Instructions: form.Instructions || "",
        ID: form.ID ? Number(form.ID) : undefined,
        ImageUrl1: form.ImageUrl1 || "",
        ImageUrl1Medium: form.ImageUrl1Medium || "",
        ImageUrl1Thumb: form.ImageUrl1Thumb || "",
        ImageUrl2: form.ImageUrl2 || "",
        ImageUrl2Medium: form.ImageUrl2Medium || "",
        ImageUrl2Thumb: form.ImageUrl2Thumb || "",
        ImageUrl3: form.ImageUrl3 || "",
        ImageUrl3Medium: form.ImageUrl3Medium || "",
        ImageUrl3Thumb: form.ImageUrl3Thumb || "",
        Price: form.PricingMode === "price" && form.Price ? Number(form.Price) : null,
        Category: form.Category || "",
        OriginalPrice: form.OriginalPrice ? Number(form.OriginalPrice) : undefined,
        Stock: form.StockType === "ready_stock" ? (form.Stock ? Number(form.Stock) : 0) : undefined,
        StockType: form.StockType || "ready_stock",
        DeliveryTime: form.DeliveryTime || "",
        IsCustomizable: form.IsCustomizable || false,
        CustomizationNote: form.CustomizationNote || "",
        DiscountPercent: form.PricingMode === "discount" && form.DiscountPercent ? Number(form.DiscountPercent) : null,
        IsFeatured: form.IsFeatured || false,
        Colors: form.Colors ? form.Colors.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        Sizes: form.Sizes ? form.Sizes.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        Care: form.Care || "",
      };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      await updateDoc(firestoreDoc(db!, 'inventory', editingId), payload);
      setShowEditModal(false);
      setEditingId(null);
      setError(null);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  const formProps = {
    form,
    updateForm,
    categories: CATEGORIES,
    uploadingField,
    onUpload: handleFileUpload,
    onFileSelect: (file: File, fieldName: "ImageUrl1" | "ImageUrl2" | "ImageUrl3") => {
      setEditorFile(file);
      setEditorFieldName(fieldName);
    },
  };

  return (
    <div className="space-y-6">
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="relative">
        <div className="mb-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-amber-800">Inventory <span className="text-xs text-slate-500">({filteredItems.length})</span></h3>
            <button
              onClick={() => { setForm({ ...emptyForm, Category: CATEGORIES[0] || "" }); setShowAddModal(true); }}
              className="rounded-lg bg-[#D2693F] text-white px-4 py-2 text-sm font-medium hover:bg-[#B85A34] transition-colors"
            >
              + Add Product
            </button>
          </div>
          <div className="mt-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by product name or description" className="w-full max-w-sm rounded border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E0D0B8] text-black" />
          </div>
        </div>

        {lowerSearch && filteredItems.length === 0 ? (
          <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">No records found for "{search}"</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {filteredItems.map((it) => {
              const img = it?.ImageUrl1 || it?.ImageUrl2 || it?.ImageUrl3 || "/favicon.ico";
              return (
              <div key={it.id ?? it.ID ?? it.Product} className="group relative bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative aspect-[4/3] bg-slate-100">
                  <ProductImage
                    src={it?.ImageUrl1}
                    srcMedium={it?.ImageUrl1Medium}
                    srcThumb={it?.ImageUrl1Thumb}
                    size="thumb"
                    alt={it?.Product ?? "item"}
                    className="w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); openEditModal(it); }} aria-label="Edit item" className="rounded-lg px-3 py-1.5 text-xs font-medium text-white bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/20 transition-colors">Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(it.id); }} aria-label="Delete item" className="rounded-lg px-3 py-1.5 text-xs font-medium text-white bg-red-500/80 backdrop-blur-sm hover:bg-red-500 transition-colors">Delete</button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-[#2D2D2D] leading-tight line-clamp-2">{it?.ProductName ?? it?.Description ?? "Untitled"}</h4>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">#{it?.ID ?? ""}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2.5">{it?.Category ?? it?.Product}</p>
                  <div className="flex items-baseline gap-2 mb-3">
                    {(() => { const p = resolvePricing({ Price: it?.Price, OriginalPrice: it?.OriginalPrice, DiscountPercent: it?.DiscountPercent }); return (
                      <>
                        <span className="text-base font-bold text-[#D2693F]">Rs.{p.selling.toLocaleString("en-IN")}</span>
                        {p.discount > 0 && (
                          <span className="text-xs text-slate-400 line-through">Rs.{p.original.toLocaleString("en-IN")}</span>
                        )}
                        {p.discount > 0 && (
                          <span className="text-[10px] font-semibold text-red-600">{p.discount}% OFF</span>
                        )}
                      </>
                    ); })()}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F9F6F0] text-[#9A6E50] border border-[#E8E0D8]">{it.StockType === "made_to_order" ? "Made to Order" : "Ready Stock"}</span>
                    {it.IsCustomizable && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F9F6F0] text-[#D2693F] border border-[#E0D0B8]">Customisable</span>}
                    {it.IsFeatured && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Featured</span>}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Add modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-2xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-7 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-[#2D2D2D]">Add New Product</h3>
                <p className="text-xs text-slate-400 mt-0.5">Fill in the details below</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <ProductForm {...formProps} mode="add" onSubmit={handleAddSubmit} onCancel={() => setShowAddModal(false)} />
          </div>
        </div>
      )}
      {/* Edit modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => { setShowEditModal(false); setEditingId(null); }}>
          <div className="w-full max-w-2xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-7 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-[#2D2D2D]">Edit Product</h3>
                <p className="text-xs text-slate-400 mt-0.5">Update product details</p>
              </div>
              <button onClick={() => { setShowEditModal(false); setEditingId(null); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <ProductForm {...formProps} mode="edit" onSubmit={handleEditSubmit} onCancel={() => { setShowEditModal(false); setEditingId(null); }} />
          </div>
        </div>
      )}
      {editorFile && editorFieldName && (
        <ImageEditor
          file={editorFile}
          onApply={(editedFile) => {
            handleFileUpload(editedFile, editorFieldName);
            setEditorFile(null);
            setEditorFieldName(null);
          }}
          onCancel={() => {
            setEditorFile(null);
            setEditorFieldName(null);
          }}
        />
      )}
    </div>
  );
}
