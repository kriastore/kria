"use client";

import React, { useState, useRef } from "react";
import { useReviews, type Review } from "@/hooks/useReviews";
import ImageEditor from "@/components/ImageEditor";
import { uploadReviewImage } from "@/utils/uploadImage";
import ProductImage from "@/components/ProductImage";

function ReviewThumb({ review }: { review: Review }) {
  const hasImage = !!(review.image || review.imageThumb);
  return (
    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0 relative">
      {hasImage ? (
        <ProductImage
          src={review.image}
          srcThumb={review.imageThumb}
          size="thumb"
          alt={review.name}
          className="w-full h-full"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-300">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
      )}
    </div>
  );
}

function MoveButtons({
  index,
  total,
  onMove,
}: {
  index: number;
  total: number;
  onMove: (index: number, dir: "up" | "down") => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => onMove(index, "up")}
        disabled={index === 0}
        className="p-1 sm:p-0 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Move up"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <button
        onClick={() => onMove(index, "down")}
        disabled={index === total - 1}
        className="p-1 sm:p-0 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Move down"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
      title="Remove review"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

function PhotoButtons({
  index,
  uploading,
  hasImage,
  onPick,
  onRemove,
}: {
  index: number;
  uploading: boolean;
  hasImage: boolean;
  onPick: (index: number) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <>
      <button
        onClick={() => onPick(index)}
        disabled={uploading}
        className="text-[11px] px-3 py-1.5 sm:px-2 sm:py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-[#D2693F] hover:text-[#D2693F] transition-colors whitespace-nowrap disabled:opacity-50"
      >
        {uploading ? "Uploading…" : hasImage ? "Change Photo" : "Add Photo"}
      </button>
      {hasImage && (
        <button
          onClick={() => onRemove(index)}
          className="text-[11px] text-red-400 hover:text-red-600 transition-colors"
        >
          Remove
        </button>
      )}
    </>
  );
}

export default function ReviewsManager() {
  const { reviews, loading, saveReviews } = useReviews();
  const [draft, setDraft] = useState<Review[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [editorFile, setEditorFile] = useState<File | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!initialized && !loading) {
    setDraft(reviews.map((r) => ({ ...r })));
    setInitialized(true);
  }

  const updateField = (index: number, field: keyof Review, value: string) => {
    setDraft((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
    setSuccess(false);
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= draft.length) return;
    setDraft((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSuccess(false);
  };

  const removeItem = (index: number) => {
    if (!confirm("Remove this review?")) return;
    setDraft((prev) => prev.filter((_, i) => i !== index));
    setSuccess(false);
  };

  const removeImage = (index: number) => {
    setDraft((prev) =>
      prev.map((r, i) => (i === index ? { ...r, image: "", imageThumb: "" } : r))
    );
    setSuccess(false);
  };

  const addReview = () => {
    setDraft((prev) => [...prev, { name: "", text: "" }]);
    setSuccess(false);
  };

  const openImagePicker = (index: number) => {
    setEditingIndex(index);
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || editingIndex === null) return;
    setEditorFile(file);
    e.target.value = "";
  };

  const handleImageApply = async (editedFile: File) => {
    if (editingIndex === null) return;
    const index = editingIndex;
    setUploadingIndex(index);
    setUploadProgress(0);
    setError(null);
    try {
      const result = await uploadReviewImage(editedFile, `review-${Date.now()}`, (f) =>
        setUploadProgress(Math.round(f * 100))
      );
      setDraft((prev) =>
        prev.map((r, i) =>
          i === index ? { ...r, image: result.url, imageThumb: result.thumbUrl } : r
        )
      );
    } catch (err: any) {
      setError("Failed to upload image: " + (err?.message || err));
    } finally {
      setUploadingIndex(null);
      setEditingIndex(null);
      setEditorFile(null);
      setUploadProgress(null);
    }
  };

  const handleSave = async () => {
    const valid = draft.filter((r) => r.name.trim() || r.text.trim());
    if (valid.length === 0) {
      setError("Add at least one review.");
      setTimeout(() => setError(null), 2500);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveReviews(valid);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError("Failed to save: " + (err?.message || err));
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
        <h2 className="text-lg font-semibold text-gray-900">Customer Reviews</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage the customer reviews shown on the homepage. Add a photo, review text and the
          customer&apos;s name. Photos are cropped to a uniform square and optimised as WebP.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Current reviews */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Reviews ({draft.length})
          </p>
          <button
            onClick={addReview}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
          >
            + Add Review
          </button>
        </div>

        {draft.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No reviews yet. Add one above.</p>
        ) : (
          <div className="space-y-3">
            {draft.map((review, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3 sm:flex-row sm:gap-4"
              >
                {/* Mobile: header row with arrows + thumb + delete */}
                <div className="flex items-center gap-2 sm:hidden">
                  <MoveButtons index={index} total={draft.length} onMove={moveItem} />
                  <ReviewThumb review={review} />
                  <div className="ml-auto">
                    <DeleteButton onClick={() => removeItem(index)} />
                  </div>
                </div>

                {/* Desktop: arrows */}
                <div className="hidden sm:block">
                  <MoveButtons index={index} total={draft.length} onMove={moveItem} />
                </div>

                {/* Desktop: thumb + photo controls */}
                <div className="hidden sm:flex sm:flex-col sm:items-center sm:gap-2">
                  <ReviewThumb review={review} />
                  <PhotoButtons
                    index={index}
                    uploading={uploadingIndex === index}
                    hasImage={!!review.image}
                    onPick={openImagePicker}
                    onRemove={removeImage}
                  />
                </div>

                {/* Fields */}
                <div className="flex-1 min-w-0 space-y-2">
                  <input
                    type="text"
                    value={review.name}
                    onChange={(e) => updateField(index, "name", e.target.value)}
                    placeholder="Customer name"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition-all"
                  />
                  <textarea
                    value={review.text}
                    onChange={(e) => updateField(index, "text", e.target.value)}
                    placeholder="Their review..."
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition-all resize-none"
                  />
                  {/* Mobile: photo controls */}
                  <div className="flex flex-wrap items-center gap-2 sm:hidden">
                    <PhotoButtons
                      index={index}
                      uploading={uploadingIndex === index}
                      hasImage={!!review.image}
                      onPick={openImagePicker}
                      onRemove={removeImage}
                    />
                  </div>
                </div>

                {/* Desktop: delete */}
                <div className="hidden sm:flex self-start">
                  <DeleteButton onClick={() => removeItem(index)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      {draft.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Preview</p>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {draft.map((review, i) => (
              <div key={i} className="flex-shrink-0 w-[220px]">
                <div className="h-full bg-[#F9F6F0] border border-[#E8E0D8] shadow-sm flex flex-col overflow-hidden">
                  <div className="relative w-full aspect-square overflow-hidden bg-white border-b border-[#E8E0D8]">
                    {review.image ? (
                      <ProductImage
                        src={review.image}
                        size="full"
                        alt={review.name}
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#D2693F]/10 text-[#D2693F] font-semibold text-4xl">
                        {(review.name || "K").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-[#2D2D2D] text-xs leading-relaxed flex-1">
                      &ldquo;{review.text || "Review text..."}&rdquo;
                    </p>
                    <span className="text-[#D2693F] font-semibold text-xs mt-2">
                      — {review.name || "Name"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          Reviews saved successfully.
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      {uploadProgress !== null && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#2D2D2D]">Uploading Photo</h3>
              <span className="text-xs font-semibold text-[#D2693F]">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#D2693F] rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">
              {uploadProgress < 40
                ? "Processing & optimising image…"
                : "Uploading to storage…"}
            </p>
          </div>
        </div>
      )}
      {editorFile && editingIndex !== null && (
        <ImageEditor
          file={editorFile}
          onApply={handleImageApply}
          onCancel={() => {
            setEditorFile(null);
            setEditingIndex(null);
          }}
        />
      )}
    </div>
  );
}
