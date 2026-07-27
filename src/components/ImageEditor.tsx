"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

interface ImageEditorProps {
  file: File;
  onApply: (file: File) => void;
  onCancel: () => void;
}

export default function ImageEditor({ file, onApply, onCancel }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState(400);

  const CANVAS_SIZE = canvasSize;

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setCanvasSize(Math.min(w, 500));
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = CANVAS_SIZE;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    const baseScale = Math.min(size / img.width, size / img.height);
    const totalScale = baseScale * zoom;
    const w = img.width * totalScale;
    const h = img.height * totalScale;

    ctx.drawImage(img, -w / 2 + offset.x, -h / 2 + offset.y, w, h);
    ctx.restore();
  }, [zoom, rotation, offset, CANVAS_SIZE]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const outSize = 1200;
    const out = document.createElement("canvas");
    out.width = outSize;
    out.height = outSize;
    const ctx = out.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(canvas, 0, 0, outSize, outSize);

    out.toBlob((blob) => {
      if (blob) {
        const f = new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
          type: "image/webp",
        });
        onApply(f);
      }
    }, "image/webp", 0.92);
  };

  const reset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center sm:p-4" onClick={onCancel}>
      <div
        className="bg-white w-full sm:max-w-md sm:shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
          <h3 className="text-sm font-bold text-[#2D2D2D]">Edit Image</h3>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Canvas */}
          <div ref={containerRef} className="flex justify-center px-5 pt-5 pb-3">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="border border-gray-200 cursor-grab active:cursor-grabbing w-full max-w-[350px] aspect-square"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
            />
          </div>

          <p className="text-center text-[10px] text-gray-400 px-5 pb-4">Drag to reposition. Zoom out for portrait images to fit inside the square.</p>

          {/* Controls */}
          <div className="px-5 pb-5 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-600">Zoom</label>
                <span className="text-[10px] text-gray-400">{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-[#D2693F]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-600">Rotate</label>
                <span className="text-[10px] text-gray-400">{rotation}°</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRotation((r) => r - 90)}
                  className="flex-1 py-2 text-xs font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  ↺ -90°
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => r + 90)}
                  className="flex-1 py-2 text-xs font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  ↻ +90°
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={reset}
              className="text-xs text-[#D2693F] hover:underline font-medium"
            >
              Reset all
            </button>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="flex gap-3 px-5 py-3.5 border-t border-gray-100 shrink-0 bg-white">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-2.5 text-sm font-semibold bg-[#D2693F] text-white hover:bg-[#B85A34] transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
