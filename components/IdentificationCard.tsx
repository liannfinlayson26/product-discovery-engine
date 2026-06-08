import type { Identification } from "@/lib/types";

interface Props {
  data: Identification;
}

const Spec = ({ label, value }: { label: string; value: string }) => (
  <div className="border-t border-white/10 py-3 first:border-t-0 sm:border-t-0 sm:py-0">
    <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper/45">
      {label}
    </dt>
    <dd className="mt-1 text-sm text-paper/90">{value || "—"}</dd>
  </div>
);

export default function IdentificationCard({ data }: Props) {
  return (
    <article className="animate-fade-up overflow-hidden rounded-[var(--radius-card)] bg-ink text-paper shadow-[0_30px_60px_-30px_rgba(28,24,20,0.7)]">
      <div className="relative p-7 sm:p-8">
        {/* Soft accent glow in the corner for depth. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/25 blur-3xl"
        />
        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-paper/55">
              Identified
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">
              <h2 className="font-display text-3xl leading-tight tracking-tight">
                {data.productName}
              </h2>
              {data.brand && (
                <p className="mt-1 text-sm font-medium text-accent-soft">
                  {data.brand}
                </p>
              )}
            </div>
            {data.category && (
              <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-paper/80">
                {data.category}
              </span>
            )}
          </div>

          {data.description && (
            <p className="mt-5 max-w-prose text-[0.95rem] leading-relaxed text-paper/75">
              {data.description}
            </p>
          )}

          <dl className="mt-6 grid grid-cols-1 gap-y-0 border-t border-white/10 pt-5 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-5">
            <Spec label="Material" value={data.material} />
            <Spec label="Style" value={data.style} />
          </dl>
        </div>
      </div>
    </article>
  );
}
