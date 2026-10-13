import { NextResponse } from "next/server";
import { getOrbiDb } from "@/lib/orbi";

export async function POST() {
  try {
    const db = await getOrbiDb();

    await db.collection("actual").updateOne(
      {},
      {
        $set: {
          contador: 0,
          fechaInicio: null,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al reiniciar contador:", error);
    return NextResponse.json(
      { error: "No se pudo detener la sesión" },
      { status: 500 }
    );
  }
}
