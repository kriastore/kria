"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
};

const TOOLBAR_CLS = "p-1.5 border border-gray-200 bg-gray-50 rounded-t-lg flex items-center gap-0.5 flex-wrap";
const BTN_CLS = "p-1.5 rounded hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors min-w-[30px] flex items-center justify-center";
const ACTIVE_BTN_CLS = "p-1.5 rounded bg-gray-200 text-gray-900 text-sm font-medium min-w-[30px] flex items-center justify-center";
const EDITOR_CLS = "border border-t-0 border-gray-200 rounded-b-lg px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition-all overflow-y-auto";

export default function RichTextEditor({ value, onChange, minHeight = 180 }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isPreview, setIsPreview] = useState(false);

  // Set initial content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleLink = useCallback(() => {
    if (showLinkInput && linkUrl) {
      exec("createLink", linkUrl);
      setShowLinkInput(false);
      setLinkUrl("");
    } else {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        setShowLinkInput(true);
      }
    }
  }, [showLinkInput, linkUrl, exec]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <div className={TOOLBAR_CLS}>
          <button
            type="button"
            title="Bold"
            className={BTN_CLS}
            onMouseDown={(e) => { e.preventDefault(); exec("bold"); }}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            title="Italic"
            className={BTN_CLS}
            onMouseDown={(e) => { e.preventDefault(); exec("italic"); }}
          >
            <em>I</em>
          </button>
          <span className="w-px h-5 bg-gray-300 mx-1" />
          <button
            type="button"
            title="Bullet List"
            className={BTN_CLS}
            onMouseDown={(e) => { e.preventDefault(); exec("insertUnorderedList"); }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="w-px h-5 bg-gray-300 mx-1" />
          <button
            type="button"
            title="Insert Link"
            className={showLinkInput ? ACTIVE_BTN_CLS : BTN_CLS}
            onClick={handleLink}
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
                className="w-32 px-2 py-1 text-xs border border-gray-300 rounded"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleLink(); if (e.key === "Escape") setShowLinkInput(false); }}
              />
              <button type="button" className="text-xs px-2 py-1 bg-[#D2693F] text-white rounded" onClick={handleLink}>OK</button>
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          {isPreview ? "Edit" : "Preview"}
        </button>
      </div>

      {isPreview ? (
        <div
          className={`${EDITOR_CLS} min-h-[${minHeight}px]`}
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
          className={`${EDITOR_CLS} min-h-[${minHeight}px] cursor-text`}
          style={{ minHeight }}
        />
      )}
    </div>
  );
}
