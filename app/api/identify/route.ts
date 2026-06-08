import { NextRequest, NextResponse } from "next/server";
import type { IdentifyResult } from "@/lib/types";

// Try the preferred flash model first, falling back to the latest flash models
// if it is unavailable (404 / model-not-found on a given key or region).
const MODELS = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"];

const PROMPT = `You are a product identification expert. Look at the image and identify the single main product.
Respond with the product's name, brand, category, material, style, and a one- to two-sentence description.
Also write "searchQuery": a concise online shopping query someone would type to find this exact product for sale, ending with the word "buy" (e.g. "tan leather minimalist desk lamp buy").
If a field is unknown, use a short best guess or "Unknown". Do not invent a brand if none is visible.`;

// Structured-output schema so Gemini returns clean JSON (no markdown fences).
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    productName: { type: "string" },
    brand: { type: "string" },
    category: { type: "string" },
    material: { type: "string" },
    style: { type: "string" },
    description: { type: "string" },
    searchQuery: { type: "string" },
  },
  required: [
    "productName",
    "brand",
    "category",
    "material",
    "style",
    "description",
    "searchQuery",
  ],
};

// Splits a data URL or raw base64 string into mime type + raw base64 payload.
function parseImage(input: string): { mimeType: string; data: string } {
  const match = input.match(/^data:(.+?);base64,([\s\S]*)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return { mimeType: "image/jpeg", data: input };
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server misconfigured: GEMINI_API_KEY is not set" },
      { status: 500 }
    );
  }

  let body: { image?: string; thumb?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const raw = body.image ?? body.thumb;
  if (!raw || typeof raw !== "string") {
    return NextResponse.json(
      { error: "No image provided" },
      { status: 400 }
    );
  }

  const { mimeType, data } = parseImage(raw);
  if (!data) {
    return NextResponse.json(
      { error: "Image data is empty" },
      { status: 400 }
    );
  }

  const requestBody = {
    contents: [
      {
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: mimeType, data } },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  let lastError = "Gemini request failed";
  for (const model of MODELS) {
    let res: Response;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify(requestBody),
        }
      );
    } catch (err) {
      lastError = `Network error contacting Gemini: ${String(err)}`;
      continue;
    }

    if (res.status === 429) {
      return NextResponse.json(
        { error: "Gemini rate limit reached, please try again shortly" },
        { status: 429 }
      );
    }

    if (res.status === 404) {
      // Model not available on this key — try the next one in the fallback list.
      lastError = `Model ${model} not available`;
      continue;
    }

    if (!res.ok) {
      lastError = `Gemini returned ${res.status}`;
      continue;
    }

    let payload: {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    try {
      payload = await res.json();
    } catch {
      lastError = "Could not parse Gemini response";
      continue;
    }

    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      lastError = "Gemini returned no content";
      continue;
    }

    let parsed: IdentifyResult;
    try {
      parsed = JSON.parse(text) as IdentifyResult;
    } catch {
      return NextResponse.json(
        { error: "Gemini returned malformed JSON" },
        { status: 502 }
      );
    }

    const result: IdentifyResult = {
      productName: parsed.productName ?? "Unknown",
      brand: parsed.brand ?? "Unknown",
      category: parsed.category ?? "Unknown",
      material: parsed.material ?? "Unknown",
      style: parsed.style ?? "Unknown",
      description: parsed.description ?? "",
      searchQuery: parsed.searchQuery ?? parsed.productName ?? "",
    };

    return NextResponse.json(result);
  }

  return NextResponse.json(
    { error: lastError },
    { status: 502 }
  );
}
