"use server";

import { repositorioMaestros, repositorioPresupuestos } from "@/datos";
import { obtenerContextoActual } from "./sesion";
import type { ConsultaArticulos, Pagina, Articulo } from "@/datos/tipos";
import type { Insumo } from "@/dominio/tipos";

export async function obtenerApuAccion(presupuestoId: string, codigoLinea: string): Promise<Insumo[]> {
  const ctx = await obtenerContextoActual();
  return repositorioPresupuestos.obtenerApu(ctx, presupuestoId, codigoLinea);
}

export async function buscarArticulosAccion(consulta: ConsultaArticulos): Promise<Pagina<Articulo>> {
  const ctx = await obtenerContextoActual();
  return repositorioMaestros.buscarArticulos(ctx, consulta);
}
