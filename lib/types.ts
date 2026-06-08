export interface Identification {
  productName: string;
  brand: string;
  category: string;
  material: string;
  style: string;
  description: string;
}

export interface ProductResult {
  id: string;
  name: string;
  price: string;
  store: string;
  buyUrl: string;
  thumbnailUrl?: string;
}

export interface ApiIdentifyResponse {
  identification: Identification;
  products: ProductResult[];
}

// Response of POST /api/identify — product attributes plus a shopping query
// that Gemini writes to find this product for sale.
export interface IdentifyResult extends Identification {
  searchQuery: string;
}

// Response of POST /api/search — buyable results from Tavily.
export interface SearchResponse {
  results: ProductResult[];
}

// Shared error envelope returned by the API routes on failure.
export interface ApiError {
  error: string;
}

// Response of GET /api/history/[id] — a saved search re-hydrated for re-viewing.
export interface SavedSearchDetail extends ApiIdentifyResponse {
  id: number;
  thumbData?: string;
}

export interface SearchRecord {
  id: number;
  createdAt: string;
  thumbData?: string;
  productName: string;
  brand: string;
  category: string;
}
