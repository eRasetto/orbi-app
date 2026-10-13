import { NextRequest, NextResponse } from "next/server";
import { getOrbiDb } from "@/lib/orbi";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const contador = body?.contador;

    if (typeof contador !== "number" || !Number.isFinite(contador)) {
      return NextResponse.json(
        { error: "El contador enviado no es válido" },
        { status: 400 }
      );
    }

    const db = await getOrbiDb();
    await db.collection("actual").updateOne(
      {},
      { $set: { contador } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, contador });
  } catch (error) {
    console.error("Error al actualizar contador:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el contador" },
      { status: 500 }
    );
  }
}
