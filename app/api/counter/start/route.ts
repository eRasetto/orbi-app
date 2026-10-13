import { NextResponse } from "next/server";
import { getOrbiDb } from "@/lib/orbi";

export async function POST() {
  try {
    const db = await getOrbiDb();
    const now = new Date();

    await db.collection("actual").updateOne(
      {},
      {
        $set: {
          fechaInicio: now,
          contador: 0,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, fechaInicio: now });
  } catch (error) {
    console.error("Error al iniciar contador:", error);
    return NextResponse.json(
      { error: "No se pudo iniciar la sesión" },
      { status: 500 }
    );
  }
}
