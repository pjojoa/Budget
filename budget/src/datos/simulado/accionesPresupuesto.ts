"use server";

import { revalidatePath } from "next/cache";
import { repositorioPresupuestos } from "@/datos";
import { obtenerContextoActual } from "./sesion";
import type { LoteCambios, ResultadoGuardado, ResultadoTransicion } from "@/datos/tipos";

export async function guardarCambiosArbol(
  presupuestoId: string,
  lote: LoteCambios,
): Promise<ResultadoGuardado> {
  const ctx = await obtenerContextoActual();
  const resultado = await repositorioPresupuestos.guardarCambios(ctx, presupuestoId, lote);
  if (resultado.ok) {
    revalidatePath(`/presupuestos/${presupuestoId}`);
  }
  return resultado;
}

export async function cambiarEstadoAccion(
  presupuestoId: string,
  nuevoEstado: "EN_REVISION" | "APROBADO" | "SUPERSEDIDO" | "BORRADOR",
): Promise<ResultadoTransicion> {
  const ctx = await obtenerContextoActual();
  const resultado = await repositorioPresupuestos.cambiarEstado(ctx, presupuestoId, nuevoEstado);
  if (resultado.ok) {
    revalidatePath(`/presupuestos/${presupuestoId}`, "layout");
  }
  return resultado;
}
