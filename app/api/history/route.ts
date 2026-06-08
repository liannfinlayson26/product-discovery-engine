import { NextRequest, NextResponse } from "next/server";
import { listSearches, insertSearch } from "@/lib/db";
import type { Identification, ProductResult } from "@/lib/types";

export async function GET() {
  const records = listSearches(20);
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  let body: {
    thumbData?: string;
    identification?: Identification;
    products?: ProductResult[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { thumbData, identification, products = [] } = body;
  if (!identification || !identification.productName) {
    return NextResponse.json(
      { error: "identification is required" },
      { status: 400 }
    );
  }

  try {
    const id = insertSearch({
      thumbData,
      productName: identification.productName,
      brand: identification.brand,
      category: identification.category,
      resultsJson: JSON.stringify({ identification, products }),
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: `Could not save search: ${String(err)}` },
      { status: 500 }
    );
  }
}
