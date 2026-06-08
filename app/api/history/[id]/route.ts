import { NextRequest, NextResponse } from "next/server";
import { getSearch } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const found = getSearch(numId);
  if (!found) {
    return NextResponse.json({ error: "Search not found" }, { status: 404 });
  }

  return NextResponse.json(found);
}
