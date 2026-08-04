"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
};

const TOOLBAR_CLS = "p-1.5 border border-gray-200 bg-gray-50 rounded-t-lg flex items-center gap-0.5 flex-wrap";
const BTN_CLS = "p-1.5 rounded hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors min-w-[30px] flex items-center justify-center touch-manipulation";
const ACTIVE_BTN_CLS = "p-1.5 rounded bg-gray-200 text-gray-900 text-sm font-medium min-w-[30px] flex items-center justify-center touch-manipulation";
const EDITOR_CLS = "border border-t-0 border-gray-200 rounded-b-lg px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition-all overflow-y-auto";

export default function RichTextEditor({ value, onChange, minHeight = 180 }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isPreview, setIsPreview] = useState(false);

  // Keep editor in sync when switching sections/pages, without clobbering an in-progress edit
  useEffect(() => {
    const el = editorRef.current;
    if (el && document.activeElement !== el && el.innerHTML !== value) {
      el.innerHTML = value;
    }
  }, [value]);

  // Remember the selection inside the editor so toolbar taps (which would normally
  // steal focus) can still apply formatting where the user selected.
  const saveSelection = useCallback(() => {
    const el = editorRef.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
    if (!el.contains(sel.anchorNode)) return false;
    savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    return true;
  }, []);

  const restoreSelection = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  }, []);

  const exec = useCallback(
    (command: string, val?: string) => {
      restoreSelection();
      document.execCommand(command, false, val);
      if (editorRef.current) onChange(editorRef.current.innerHTML);
      restoreSelection();
    },
    [onChange, restoreSelection]
  );

  const runFormat = useCallback(
    (command: string, val?: string) => (e: React.PointerEvent) => {
      e.preventDefault();
      exec(command, val);
    },
    [exec]
  );

  const handleInput = useCallback(() => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const toggleLink = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      if (showLinkInput) {
        if (linkUrl.trim()) exec("createLink", linkUrl.trim());
        setShowLinkInput(false);
        setLinkUrl("");
      } else {
        if (saveSelection()) {
          setShowLinkInput(true);
          setLinkUrl("");
        }
      }
    },
    [showLinkInput, linkUrl, exec, saveSelection]
  );

  const applyLink = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      if (linkUrl.trim()) exec("createLink", linkUrl.trim());
      setShowLinkInput(false);
      setLinkUrl("");
    },
    [linkUrl, exec]
  );

  const cancelLink = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setShowLinkInput(false);
      setLinkUrl("");
    },
    []
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2">
        <div className={TOOLBAR_CLS}>
          <button
            type="button"
            title="Bold"
            className={BTN_CLS}
            onPointerDown={runFormat("bold")}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            title="Italic"
            className={BTN_CLS}
            onPointerDown={runFormat("italic")}
          >
            <em>I</em>
          </button>
          <button
            type="button"
            title="Bullet List"
            className={BTN_CLS}
            onPointerDown={runFormat("insertUnorderedList")}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /><circle cx="2" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="2" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="2" cy="18" r="1" fill="currentColor" stroke="none" /></svg>
          </button>
          <span className="w-px h-5 bg-gray-300 mx-1" />
          <button
            type="button"
            title="Insert Link"
            className={showLinkInput ? ACTIVE_BTN_CLS : BTN_CLS}
            onPointerDown={toggleLink}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          </button>
          {showLinkInput && (
            <span className="flex items-center gap-1 ml-1">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-40 px-2 py-1 text-xs border border-gray-300 rounded"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); applyLink(e as any); }
                  if (e.key === "Escape") setShowLinkInput(false);
                }}
              />
              <button
                type="button"
                className="text-xs px-2 py-1 bg-[#D2693F] text-white rounded touch-manipulation"
                onPointerDown={applyLink}
              >
                OK
              </button>
              <button
                type="button"
                className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded touch-manipulation"
                onPointerDown={cancelLink}
              >
                ✕
              </button>
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors shrink-0"
        >
          {isPreview ? "Edit" : "Preview"}
        </button>
      </div>

      {isPreview ? (
        <div
          className={EDITOR_CLS}
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={() => onChange(editorRef.current?.innerHTML || "")}
          className={`${EDITOR_CLS} cursor-text`}
          style={{ minHeight }}
        />
      )}
    </div>
  );
}
