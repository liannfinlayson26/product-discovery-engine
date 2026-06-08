"use client";

import type { SearchRecord } from "@/lib/types";

interface Props {
  records: SearchRecord[];
  onSelect?: (id: number) => void;
  activeId?: number | null;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function SearchHistory({ records, onSelect, activeId }: Props) {
  return (
    <aside className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg text-ink">Recent searches</h2>
        {records.length > 0 && (
          <span className="text-xs text-muted">{records.length}</span>
        )}
      </div>

      {records.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong bg-paper-raised/60 px-5 py-8 text-center">
          <p className="text-sm text-muted">
            Your past searches will appear here.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {records.map((r) => {
            const active = activeId === r.id;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onSelect?.(r.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-all duration-150 ${
                    active
                      ? "border-accent/40 bg-accent-soft/50 shadow-[inset_0_0_0_1px_rgba(182,74,43,0.25)]"
                      : "border-line bg-paper-raised hover:border-line-strong hover:bg-paper-raised"
                  }`}
                >
                  {r.thumbData ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.thumbData}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-xl border border-line object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-paper-sunken">
                      <svg
                        className="h-5 w-5 text-line-strong"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M2.25 15.75l5.16-5.16a2.25 2.25 0 013.18 0l5.16 5.16M3 21h18M3 3h18"
                        />
                      </svg>
                    </span>
                  )}

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">
                      {r.productName}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {[r.brand, r.category].filter(Boolean).join(" · ")}
                    </span>
                    <span className="mt-0.5 block text-[0.7rem] text-muted/70">
                      {timeAgo(r.createdAt)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
