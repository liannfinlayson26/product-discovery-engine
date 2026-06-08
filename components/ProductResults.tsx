import type { ProductResult } from "@/lib/types";
import ProductCard from "./ProductCard";

interface Props {
  products: ProductResult[];
}

export default function ProductResults({ products }: Props) {
  return (
    <section className="animate-fade-up">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-display text-xl text-ink">Where to buy</h3>
        <span className="text-sm text-muted">
          {products.length} {products.length === 1 ? "source" : "sources"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((p, i) => (
          <div
            key={p.id}
            className="animate-fade-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
