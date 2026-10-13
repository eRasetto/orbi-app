import { NextResponse } from "next/server";
import { getOrbiDb } from "@/lib/orbi";

export async function GET() {
  try {
    const db = await getOrbiDb();
    const doc = await db.collection("actual").findOne({});

    if (!doc) {
      return NextResponse.json({ contador: 0, fechaInicio: null });
    }

    return NextResponse.json({
      contador: typeof doc.contador === "number" ? doc.contador : 0,
      fechaInicio: doc.fechaInicio ?? null,
    });
  } catch (error) {
    console.error("Error al obtener contador:", error);
    return NextResponse.json(
      { error: "No se pudo cargar el contador" },
      { status: 500 }
    );
  }
}
