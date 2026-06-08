"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import UploadZone from "@/components/UploadZone";
import IdentifyButton from "@/components/IdentifyButton";
import IdentificationCard from "@/components/IdentificationCard";
import ProductResults from "@/components/ProductResults";
import SearchHistory from "@/components/SearchHistory";
import type {
  ApiIdentifyResponse,
  IdentifyResult,
  SavedSearchDetail,
  SearchRecord,
  SearchResponse,
} from "@/lib/types";

type Status = "idle" | "identifying" | "searching" | "done" | "error";

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ApiIdentifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noResults, setNoResults] = useState(false);
  const [history, setHistory] = useState<SearchRecord[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const previewObjectUrl = useRef<string | null>(null);

  const fetchHistory = useCallback(async () => {
    const res = await fetch("/api/history");
    if (res.ok) setHistory(await res.json());
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleImageSelected = (file: File, url: string) => {
    if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current);
    previewObjectUrl.current = url;
    setImageFile(file);
    setPreviewUrl(url);
    setResult(null);
    setError(null);
    setNoResults(false);
    setActiveId(null);
    setStatus("idle");
  };

  const reset = useCallback(() => {
    if (previewObjectUrl.current) {
      URL.revokeObjectURL(previewObjectUrl.current);
      previewObjectUrl.current = null;
    }
    setImageFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setNoResults(false);
    setActiveId(null);
    setStatus("idle");
  }, []);

  const runIdentify = useCallback(async () => {
    if (!imageFile) return;
    setError(null);
    setNoResults(false);
    setResult(null);
    setActiveId(null);
    setStatus("identifying");

    try {
      // 1. Identify the product with Gemini Vision.
      const image = await fileToBase64(imageFile, 1024, 0.85);
      const idRes = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      if (!idRes.ok) {
        throw new Error(
          "We couldn't identify the product in that photo. Try a clearer, well-lit shot of a single item."
        );
      }
      const ident: IdentifyResult = await idRes.json();

      // Show the identification card right away while shopping results load.
      const identification = {
        productName: ident.productName,
        brand: ident.brand,
        category: ident.category,
        material: ident.material,
        style: ident.style,
        description: ident.description,
      };
      setResult({ identification, products: [] });
      setStatus("searching");

      // 2. Find where to buy it with Tavily.
      const searchRes = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchQuery: ident.searchQuery }),
      });
      if (!searchRes.ok) {
        throw new Error(
          `We identified the ${identification.productName}, but the shopping search failed. Please retry.`
        );
      }
      const { results }: SearchResponse = await searchRes.json();

      const completed: ApiIdentifyResponse = { identification, products: results };
      setResult(completed);
      setNoResults(results.length === 0);
      setStatus("done");

      // 3. Persist the completed search to history (server-side SQLite).
      const thumbData = await fileToBase64(imageFile, 80, 0.7);
      await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thumbData, ...completed }),
      });
      fetchHistory();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setStatus("error");
    }
  }, [imageFile, fetchHistory]);

  const selectHistory = useCallback(async (id: number) => {
    const res = await fetch(`/api/history/${id}`);
    if (!res.ok) return;
    const detail: SavedSearchDetail = await res.json();
    setResult({ identification: detail.identification, products: detail.products });
    setNoResults(detail.products.length === 0);
    setError(null);
    setActiveId(id);
    setStatus("done");
    if (detail.thumbData) setPreviewUrl(detail.thumbData);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const loading = status === "identifying" || status === "searching";
  const hasActivity = status !== "idle" || !!result || !!error;
  // We're re-viewing a saved search (came from history, no freshly picked file).
  const viewingHistory = activeId !== null && !imageFile;
  // Show the marketing headline only on a clean, idle screen.
  const showMarketing = !hasActivity && !imageFile;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-line/70 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-2.5"
            aria-label="Lens — start a new search"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-paper">
              <svg
                className="h-4.5 w-4.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
                />
              </svg>
            </span>
            <span className="font-display text-xl font-semibold tracking-tight text-ink">
              Lens
            </span>
          </button>

          {(imageFile || result) && (
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink hover:text-ink"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New search
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
        {/* Hero */}
        <section className="mx-auto max-w-2xl text-center">
          {showMarketing && (
            <>
              <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-line-strong bg-paper-raised px-3.5 py-1.5 text-xs font-medium text-ink-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Visual shopping, powered by AI
              </span>
              <h1
                className="animate-fade-up mt-6 font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl"
                style={{ animationDelay: "60ms" }}
              >
                Find where to buy
                <br className="hidden sm:block" />{" "}
                <span className="italic text-accent">anything</span> you can
                photograph.
              </h1>
              <p
                className="animate-fade-up mx-auto mt-5 max-w-md text-[1.05rem] leading-relaxed text-ink-soft"
                style={{ animationDelay: "120ms" }}
              >
                Drop in a product photo. We identify the item and surface real
                places to buy it — with prices and links.
              </p>
            </>
          )}

          <div
            className={`flex flex-col gap-3 ${showMarketing ? "animate-fade-up mt-8" : ""}`}
            style={showMarketing ? { animationDelay: "180ms" } : undefined}
          >
            {viewingHistory ? (
              <SavedSearchBanner
                previewUrl={previewUrl}
                onNewSearch={reset}
              />
            ) : (
              <>
                <UploadZone
                  onImageSelected={handleImageSelected}
                  onRemove={reset}
                  previewUrl={previewUrl}
                />
                {imageFile && !result && (
                  <IdentifyButton
                    onClick={runIdentify}
                    disabled={!imageFile}
                    loading={loading}
                  />
                )}
              </>
            )}
          </div>
        </section>

        {/* Workspace: results + history */}
        <div className="mt-14 grid grid-cols-1 gap-8 lg:mt-16 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            {error && (
              <div className="animate-fade-up flex items-start gap-3.5 rounded-[var(--radius-card)] border border-accent/30 bg-accent-soft/50 p-5">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed text-accent-ink">
                    {error}
                  </p>
                  {imageFile && (
                    <button
                      onClick={runIdentify}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.5 12a7.5 7.5 0 0113.36-4.67M19.5 12a7.5 7.5 0 01-13.36 4.67M18 4.5V8h-3.5M6 19.5V16h3.5"
                        />
                      </svg>
                      Try again
                    </button>
                  )}
                </div>
              </div>
            )}

            {status === "identifying" && <IdentifySkeleton />}

            {result?.identification && status !== "identifying" && (
              <div className="flex flex-col gap-8">
                <IdentificationCard data={result.identification} />

                {status === "searching" ? (
                  <ProductSkeleton />
                ) : noResults ? (
                  <NoResults onRetry={imageFile ? runIdentify : undefined} />
                ) : (
                  result.products.length > 0 && (
                    <ProductResults products={result.products} />
                  )
                )}
              </div>
            )}

            {!hasActivity && <HowItWorks />}
          </div>

          {/* History rail */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <SearchHistory
              records={history}
              onSelect={selectHistory}
              activeId={activeId}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-line/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-muted sm:flex-row sm:px-8">
          <p>Lens — Product Discovery Engine</p>
          <p>Identification by Gemini Vision · Shopping by Tavily</p>
        </div>
      </footer>
    </div>
  );
}

const STEPS = [
  {
    title: "Upload a photo",
    body: "Drag in or snap a picture of any product you want to find.",
  },
  {
    title: "We identify it",
    body: "Gemini Vision reads the brand, category, material and style.",
  },
  {
    title: "Shop the results",
    body: "Get real purchase links with prices, from across the web.",
  },
];

function SavedSearchBanner({
  previewUrl,
  onNewSearch,
}: {
  previewUrl: string | null;
  onNewSearch: () => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-card)] border border-line bg-paper-raised p-3 text-left">
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Saved search"
          className="h-16 w-16 shrink-0 rounded-xl border border-line object-cover"
        />
      ) : (
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-paper-sunken text-line-strong">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M2.25 15.75l5.16-5.16a2.25 2.25 0 013.18 0l5.16 5.16M3 21h18M3 3h18"
            />
          </svg>
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">
          From your history
        </p>
        <p className="mt-0.5 text-sm text-ink-soft">
          Re-viewing a saved search.
        </p>
      </div>
      <button
        type="button"
        onClick={onNewSearch}
        className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-accent"
      >
        New search
      </button>
    </div>
  );
}

function HowItWorks() {
  return (
    <div className="animate-fade-in rounded-[var(--radius-card)] border border-line bg-paper-raised/60 p-7 sm:p-8">
      <h3 className="font-display text-lg text-ink">How it works</h3>
      <ol className="mt-5 flex flex-col gap-5">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line-strong font-display text-sm text-accent">
              {i + 1}
            </span>
            <div>
              <p className="font-medium text-ink">{step.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function NoResults({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="animate-fade-up rounded-[var(--radius-card)] border border-line bg-paper-raised p-7 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-paper-sunken text-muted">
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.879 7.519A3 3 0 1115 9c0 1.5-1.5 2.25-2.25 2.625M12 15.75h.008M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
          />
        </svg>
      </span>
      <p className="mt-4 font-medium text-ink">No purchase links found</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
        We identified the product but couldn&apos;t find anywhere to buy it
        right now. Try again or upload a clearer photo.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper transition-colors hover:bg-accent"
        >
          Retry search
        </button>
      )}
    </div>
  );
}

function IdentifySkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] bg-ink p-7 sm:p-8">
      <div className="skeleton h-3 w-24 rounded-full opacity-30" />
      <div className="skeleton mt-5 h-8 w-2/3 rounded-lg opacity-30" />
      <div className="skeleton mt-3 h-4 w-28 rounded opacity-30" />
      <div className="mt-6 space-y-2.5">
        <div className="skeleton h-3.5 w-full rounded opacity-20" />
        <div className="skeleton h-3.5 w-5/6 rounded opacity-20" />
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-display text-xl text-ink">Where to buy</h3>
        <span className="skeleton h-4 w-16 rounded" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper-raised"
          >
            <div className="skeleton h-48" />
            <div className="space-y-3 p-5">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-6 w-1/3 rounded" />
              <div className="skeleton mt-1 h-10 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Scales an image down to maxSize (longest edge) and returns a JPEG data URL.
async function fileToBase64(
  file: File,
  maxSize: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas
        .getContext("2d")!
        .drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}
