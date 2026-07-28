"use client";

import React, { useState, useRef } from "react";
import { useCategories, Category } from "@/hooks/useCategories";
import { convertToWebP } from "@/utils/uploadImage";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { storage } from "@/firebase";

export default function CategoriesManager() {
  const { categories, loading, addCategory, removeCategory, updateCategory, addSubcategory, removeSubcategory, updateSubcategory } = useCategories();
  const [error, setError] = useState<string | null>(null);

  // Add form
  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editOrder, setEditOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Subcategory state
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState("");
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editSubName, setEditSubName] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newName.trim()) {
      setError("Category name is required");
      return;
    }
    if (categories.some((c) => c.name.toLowerCase() === newName.trim().toLowerCase())) {
      setError("Category already exists");
      return;
    }
    try {
      await addCategory(newName.trim(), newImage.trim());
      setNewName("");
      setNewImage("");
    } catch (err: any) {
      setError(err.message || "Failed to add category");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? Products in this category will keep their category label.`)) return;
    try {
      await removeCategory(id);
      if (editingId === id) setEditingId(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete category");
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditImage(cat.image || "");
    setEditOrder(cat.order);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setUploadingImg(false);
  };

  const handleSave = async () => {
    if (!editingId) return;
    setError(null);
    if (!editName.trim()) {
      setError("Category name is required");
      return;
    }
    setSaving(true);
    try {
      await updateCategory(editingId, {
        name: editName.trim(),
        image: editImage.trim(),
        order: editOrder,
      });
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || "Failed to update category");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImg(true);
    try {
      const converted = await convertToWebP(file);
      const path = `categories/${Date.now()}-${file.name.replace(/\.[^.]+$/, "")}.webp`;
      const fileRef = storageRef(storage, path);
      await uploadBytes(fileRef, converted, { contentType: "image/webp" });
      const url = await getDownloadURL(fileRef);
      setEditImage(url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploadingImg(false);
    }
  };

  const handleAddSubcategory = async (categoryId: string) => {
    if (!newSubName.trim()) {
      setError("Subcategory name is required");
      return;
    }
    const cat = categories.find(c => c.id === categoryId);
    if (cat?.subcategories?.some(s => s.name.toLowerCase() === newSubName.trim().toLowerCase())) {
      setError("Subcategory already exists in this category");
      return;
    }
    try {
      await addSubcategory(categoryId, newSubName.trim());
      setNewSubName("");
    } catch (err: any) {
      setError(err.message || "Failed to add subcategory");
    }
  };

  const handleDeleteSubcategory = async (categoryId: string, subIndex: number, name: string) => {
    if (!confirm(`Delete subcategory "${name}"?`)) return;
    try {
      await removeSubcategory(categoryId, subIndex);
      if (editingSubId === `${categoryId}-${subIndex}`) setEditingSubId(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete subcategory");
    }
  };

  const handleSaveSubcategory = async (categoryId: string, subIndex: number) => {
    if (!editingSubId) return;
    setError(null);
    if (!editSubName.trim()) {
      setError("Subcategory name is required");
      return;
    }
    try {
      await updateSubcategory(categoryId, subIndex, editSubName.trim());
      setEditingSubId(null);
    } catch (err: any) {
      setError(err.message || "Failed to update subcategory");
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-2">✕</button>
        </div>
      )}

      {/* Add form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Add New Category</h3>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name"
            className="flex-1 rounded-lg border border-gray-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition-all"
          />
          <input
            type="url"
            value={newImage}
            onChange={(e) => setNewImage(e.target.value)}
            placeholder="Image URL (optional)"
            className="flex-1 rounded-lg border border-gray-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition-all"
          />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-[#D2693F] text-white text-sm font-semibold hover:bg-[#B85A34] shadow-sm transition-all active:scale-[0.98] whitespace-nowrap"
          >
            Add Category
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">
            Categories
            <span className="ml-2 text-xs font-normal text-gray-400">({categories.length})</span>
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#D2693F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">No categories yet.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {categories.map((cat) => {
              const isEditing = editingId === cat.id;

              if (isEditing) {
                return (
                  <li key={cat.id} className="px-6 py-5 bg-[#F9F6F0]/30">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Image */}
                      <div className="flex-shrink-0">
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Image</label>
                        <label className="relative flex items-center justify-center w-20 h-20 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-[#C5A059] hover:bg-[#F9F6F0]/40 transition-all overflow-hidden group">
                          {uploadingImg ? (
                            <div className="w-5 h-5 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
                          ) : editImage ? (
                            <>
                              <img src={editImage} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[10px] text-white font-medium bg-black/50 px-2 py-1 rounded">Change</span>
                              </div>
                            </>
                          ) : (
                            <svg className="w-5 h-5 text-slate-300 group-hover:text-[#C5A059] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) await handleImageUpload(file);
                            }}
                          />
                        </label>
                        {editImage && (
                          <button
                            type="button"
                            onClick={() => setEditImage("")}
                            className="mt-1 text-[10px] text-red-500 hover:text-red-700 font-medium transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {/* Fields */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_80px] gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Name</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Order</label>
                          <input
                            type="number"
                            value={editOrder}
                            onChange={(e) => setEditOrder(Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition-all"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Image URL</label>
                          <input
                            type="url"
                            value={editImage}
                            onChange={(e) => setEditImage(e.target.value)}
                            placeholder="Or paste an image URL"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving || uploadingImg}
                        className="px-5 py-2 rounded-lg bg-[#D2693F] text-white text-sm font-semibold hover:bg-[#B85A34] shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? "Saving…" : "Save Changes"}
                      </button>
                    </div>
                  </li>
                );
              }

              const catSubs = (cat.subcategories || []).sort((a: any, b: any) => a.order - b.order);
              const isExpanded = expandedCategoryId === cat.id;

              return (
                <li key={cat.id} className="group">
                  <div className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/50 transition-colors">
                    <span className="text-xs text-gray-300 font-mono w-4 text-center flex-shrink-0">{cat.order}</span>
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-12 h-12 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-[#F3EDE4] flex items-center justify-center flex-shrink-0">
                        <span className="text-lg text-[#D2693F] font-semibold">{cat.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{cat.name}</p>
                      {catSubs.length > 0 && (
                        <p className="text-[11px] text-gray-400 mt-0.5">{catSubs.length} subcategories</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setExpandedCategoryId(isExpanded ? null : cat.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-[#C5A059] hover:bg-[#F9F6F0] transition-colors"
                        title={isExpanded ? "Hide subcategories" : "Manage subcategories"}
                      >
                        <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-2 rounded-lg text-slate-400 hover:text-[#D2693F] hover:bg-[#F9F6F0] transition-colors"
                        title="Edit category"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete category"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded subcategory panel */}
                  {isExpanded && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="text"
                          value={newSubName}
                          onChange={(e) => setNewSubName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSubcategory(cat.id); } }}
                          placeholder="New subcategory name"
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition-all"
                        />
                        <button
                          onClick={() => handleAddSubcategory(cat.id)}
                          className="px-4 py-2 rounded-lg bg-[#C5A059] text-white text-sm font-semibold hover:bg-[#A88640] shadow-sm transition-all active:scale-[0.98] whitespace-nowrap"
                        >
                          Add
                        </button>
                      </div>

                      {catSubs.length === 0 ? (
                        <p className="text-xs text-gray-400 py-2">No subcategories yet.</p>
                      ) : (
                        <ul className="space-y-1">
                          {catSubs.map((sub: any, subIdx: number) => (
                            <li key={subIdx} className="flex items-center gap-2 py-1.5">
                              {editingSubId === `${cat.id}-${subIdx}` ? (
                                <>
                                  <input
                                    type="text"
                                    value={editSubName}
                                    onChange={(e) => setEditSubName(e.target.value)}
                                    className="flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#C5A059]/40"
                                  />
                                  <button onClick={() => handleSaveSubcategory(cat.id, subIdx)} className="text-xs text-[#D2693F] font-semibold hover:underline">Save</button>
                                  <button onClick={() => setEditingSubId(null)} className="text-xs text-gray-400 hover:underline">Cancel</button>
                                </>
                              ) : (
                                <>
                                  <span className="flex-1 text-sm text-gray-700">{sub.name}</span>
                                  <button
                                    onClick={() => { setEditingSubId(`${cat.id}-${subIdx}`); setEditSubName(sub.name); }}
                                    className="text-xs text-slate-400 hover:text-[#D2693F] transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSubcategory(cat.id, subIdx, sub.name)}
                                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
