"use server";

import { revalidatePath } from "next/cache";
import { repositorioMaestros } from "@/datos";
import { obtenerContextoActual } from "./sesion";
import type { Cuenta } from "@/datos/tipos";

export async function actualizarCuentaAccion(
  codigo: string,
  cambios: { descripcion?: string; unidadMedida?: string; activa?: boolean },
): Promise<{ ok: true; cuenta: Cuenta } | { ok: false; motivo: "SIN_PERMISO" | "CUENTA_INEXISTENTE" }> {
  const ctx = await obtenerContextoActual();
  const resultado = await repositorioMaestros.actualizarCuenta(ctx, codigo, cambios);
  if (resultado.ok) revalidatePath("/maestros/cuentas");
  return resultado;
}
