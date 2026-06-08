"use client";

import { useCallback, useRef, useState } from "react";

interface Props {
  onImageSelected: (file: File, previewUrl: string) => void;
  onRemove: () => void;
  previewUrl: string | null;
}

export default function UploadZone({
  onImageSelected,
  onRemove,
  previewUrl,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const openPicker = () => inputRef.current?.click();

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      onImageSelected(file, url);
    },
    [onImageSelected]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ""; // allow re-selecting the same file
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onInputChange}
      />

      {previewUrl ? (
        <div className="rounded-[var(--radius-card)] border border-line bg-paper-raised p-3 shadow-[0_1px_0_rgba(0,0,0,0.02),0_18px_40px_-28px_rgba(28,24,20,0.45)]">
          <div className="relative overflow-hidden rounded-xl bg-paper-sunken">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Selected product"
              className="mx-auto max-h-80 w-full object-contain"
            />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-sm text-muted">Ready to identify</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openPicker}
                className="rounded-full border border-line-strong bg-paper-raised px-4 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-accent"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`group flex min-h-72 w-full flex-col items-center justify-center gap-4 rounded-[var(--radius-card)] border-2 border-dashed px-8 py-12 text-center transition-all duration-200 ${
            dragging
              ? "border-accent bg-accent-soft/60 scale-[1.005]"
              : "border-line-strong bg-paper-raised hover:border-ink/40 hover:bg-paper-raised"
          }`}
        >
          <span
            className={`flex h-16 w-16 items-center justify-center rounded-2xl border transition-colors ${
              dragging
                ? "border-accent/40 bg-paper-raised text-accent"
                : "border-line bg-paper text-ink-soft group-hover:text-accent"
            }`}
          >
            <svg
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </span>
          <span className="space-y-1">
            <span className="block font-display text-xl text-ink">
              Drop a product photo
            </span>
            <span className="block text-sm text-muted">
              or click to browse — PNG, JPG or WEBP
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
