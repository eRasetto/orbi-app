import { NextResponse } from "next/server";
import { getOrbiDb } from "@/lib/orbi";

export async function GET() {
  try {
    const db = await getOrbiDb();
    const registros = await db
      .collection("historial")
      .find({})
      .sort({ fechaFin: -1 })
      .toArray();

    return NextResponse.json({ success: true, registros });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    return NextResponse.json(
      { error: "No se pudo cargar el historial" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const db = await getOrbiDb();
    const actual = db.collection("actual");
    const datosActuales = await actual.findOne({});

    if (!datosActuales?.fechaInicio) {
      return NextResponse.json(
        { error: "No hay una sesión activa para guardar" },
        { status: 400 }
      );
    }

    const fechaFin = new Date();

    await db.collection("historial").insertOne({
      contador:
        typeof datosActuales.contador === "number" ? datosActuales.contador : 0,
      fechaInicio: datosActuales.fechaInicio,
      fechaFin,
    });

    await actual.updateOne(
      {},
      {
        $set: {
          contador: 0,
          fechaInicio: null,
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al guardar historial:", error);
    return NextResponse.json(
      { error: "No se pudo guardar la sesión" },
      { status: 500 }
    );
  }
}
