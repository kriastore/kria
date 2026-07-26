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
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-xl max-w-lg w-full p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#2D2D2D]">Edit Image</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <div ref={containerRef} className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="border border-gray-300 cursor-grab active:cursor-grabbing"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          />
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Zoom</label>
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
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Rotate</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRotation((r) => r - 90)}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                ↺ -90°
              </button>
              <span className="text-xs text-gray-500 min-w-[40px] text-center">{rotation}°</span>
              <button
                type="button"
                onClick={() => setRotation((r) => r + 90)}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
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
            Reset
          </button>
        </div>

        <p className="text-[10px] text-gray-400">Drag to reposition. Zoom out for portrait images to fit inside the square.</p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-2.5 text-sm font-semibold bg-[#D2693F] text-white rounded-lg hover:bg-[#B85A34] transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
