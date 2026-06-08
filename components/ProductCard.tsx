import type { ProductResult } from "@/lib/types";

interface Props {
  product: ProductResult;
}

export default function ProductCard({ product }: Props) {
  return (
    <a
      href={product.buyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper-raised shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-1 hover:border-line-strong hover:shadow-[0_24px_44px_-26px_rgba(28,24,20,0.5)]"
    >
      <div className="relative flex h-48 items-center justify-center overflow-hidden bg-paper-sunken">
        {product.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.thumbnailUrl}
            alt={product.name}
            className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <svg
            className="h-10 w-10 text-line-strong"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M2.25 15.75l5.16-5.16a2.25 2.25 0 013.18 0l5.16 5.16m-1.5-1.5l1.41-1.41a2.25 2.25 0 013.18 0l2.91 2.91M3 21h18M3 3h18"
            />
          </svg>
        )}
        {product.store && (
          <span className="absolute left-3 top-3 rounded-full bg-paper-raised/90 px-2.5 py-1 text-[0.7rem] font-medium text-ink-soft backdrop-blur-sm">
            {product.store}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h4 className="line-clamp-2 text-[0.95rem] font-medium leading-snug text-ink">
          {product.name}
        </h4>
        <p className="mt-2 font-display text-2xl text-ink">{product.price}</p>

        <span className="mt-4 flex items-center justify-center gap-1.5 rounded-full border border-ink/15 py-2.5 text-sm font-medium text-ink transition-colors group-hover:border-transparent group-hover:bg-ink group-hover:text-paper">
          Buy
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
              d="M13.5 6H18m0 0v4.5M18 6l-7.5 7.5M9 6H6.75A1.75 1.75 0 005 7.75v9.5C5 18.216 5.784 19 6.75 19h9.5A1.75 1.75 0 0018 17.25V15"
            />
          </svg>
        </span>
      </div>
    </a>
  );
}
