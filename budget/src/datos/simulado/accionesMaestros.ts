"use server";

import { revalidatePath } from "next/cache";
import { repositorioMaestros } from "@/datos";
import { obtenerContextoActual } from "./sesion";
import type { Decimal } from "@/dominio/decimal";
import type { Sucursal } from "@/dominio/tipos";
import type { Articulo, Cuenta, Familia, SucursalCatalogo } from "@/datos/tipos";

// ---------------------------------------------------------------------------
// Cuentas
// ---------------------------------------------------------------------------

export async function actualizarCuentaAccion(
  codigo: string,
  cambios: { descripcion?: string; unidadMedida?: string; activa?: boolean },
): Promise<{ ok: true; cuenta: Cuenta } | { ok: false; motivo: "SIN_PERMISO" | "CUENTA_INEXISTENTE" }> {
  const ctx = await obtenerContextoActual();
  const resultado = await repositorioMaestros.actualizarCuenta(ctx, codigo, cambios);
  if (resultado.ok) revalidatePath("/maestros/cuentas");
  return resultado;
}

export async function crearCuentaAccion(cuenta: {
  codigo: string;
  descripcion: string;
  unidadMedida: string;
}): Promise<
  | { ok: true; cuenta: Cuenta }
  | { ok: false; motivo: "SIN_PERMISO" | "CODIGO_INVALIDO" | "CODIGO_DUPLICADO" | "PADRE_INEXISTENTE" }
> {
  const ctx = await obtenerContextoActual();
  const resultado = await repositorioMaestros.crearCuenta(ctx, cuenta);
  if (resultado.ok) revalidatePath("/maestros/cuentas");
  return resultado;
}

export async function eliminarCuentaAccion(
  codigo: string,
): Promise<{ ok: true } | { ok: false; motivo: "SIN_PERMISO" | "CUENTA_INEXISTENTE" | "EN_USO" }> {
  const ctx = await obtenerContextoActual();
  const resultado = await repositorioMaestros.eliminarCuenta(ctx, codigo);
  if (resultado.ok) revalidatePath("/maestros/cuentas");
  return resultado;
}

// ---------------------------------------------------------------------------
// Familias
// ---------------------------------------------------------------------------

export async function crearFamiliaAccion(familia: {
  codigo: string;
  nombre: string;
  tipo: string;
}): Promise<{ ok: true; familia: Familia } | { ok: false; motivo: "SIN_PERMISO" | "CODIGO_DUPLICADO" }> {
  const ctx = await obtenerContextoActual();
  const resultado = await repositorioMaestros.crearFamilia(ctx, familia);
  if (resultado.ok) revalidatePath("/maestros/familias");
  return resultado;
}

export async function actualizarFamiliaAccion(
  codigo: string,
  cambios: { nombre?: string; tipo?: string; factorAjusteAnual?: Decimal | null },
): Promise<
  | { ok: true; familia: Familia }
  | { ok: false; motivo: "SIN_PERMISO" | "FAMILIA_INEXISTENTE" | "VALOR_INVALIDO" }
> {
  const ctx = await obtenerContextoActual();
  const resultado = await repositorioMaestros.actualizarFamilia(ctx, codigo, cambios);
  if (resultado.ok) {
    revalidatePath("/maestros/familias");
    revalidatePath("/maestros/articulos");
  }
  return resultado;
}

export async function eliminarFamiliaAccion(
  codigo: string,
): Promise<{ ok: true } | { ok: false; motivo: "SIN_PERMISO" | "FAMILIA_INEXISTENTE" | "EN_USO" }> {
  const ctx = await obtenerContextoActual();
  const resultado = await repositorioMaestros.eliminarFamilia(ctx, codigo);
  if (resultado.ok) revalidatePath("/maestros/familias");
  return resultado;
}

// ---------------------------------------------------------------------------
// Artículos
// ---------------------------------------------------------------------------

export async function crearArticuloAccion(articulo: {
  codigo: string;
  descripcion: string;
  unidadMedida: string;
  familia: string;
}): Promise<{ ok: true; articulo: Articulo } | { ok: false; motivo: "SIN_PERMISO" | "CODIGO_DUPLICADO" }> {
  const ctx = await obtenerContextoActual();
  const resultado = await repositorioMaestros.crearArticulo(ctx, articulo);
  if (resultado.ok) revalidatePath("/maestros/articulos");
  return resultado;
}

export async function actualizarArticuloAccion(
  codigo: string,
  cambios: { descripcion?: string; unidadMedida?: string; familia?: string; activo?: boolean },
): Promise<{ ok: true; articulo: Articulo } | { ok: false; motivo: "SIN_PERMISO" | "ARTICULO_INEXISTENTE" }> {
  const ctx = await obtenerContextoActual();
  const resultado = await repositorioMaestros.actualizarArticulo(ctx, codigo, cambios);
  if (resultado.ok) {
    revalidatePath("/maestros/articulos");
    revalidatePath(`/maestros/articulos/${codigo}`);
  }
  return resultado;
}

export async function eliminarArticuloAccion(
  codigo: string,
): Promise<{ ok: true } | { ok: false; motivo: "SIN_PERMISO" | "ARTICULO_INEXISTENTE" | "EN_USO" }> {
  const ctx = await obtenerContextoActual();
  const resultado = await repositorioMaestros.eliminarArticulo(ctx, codigo);
  if (resultado.ok) revalidatePath("/maestros/articulos");
  return resultado;
}

// ---------------------------------------------------------------------------
// Sucursales
// ---------------------------------------------------------------------------

export async function actualizarSucursalAccion(
  codigo: string,
  cambios: { activa: boolean },
): Promise<{ ok: true; sucursal: SucursalCatalogo } | { ok: false; motivo: "SIN_PERMISO" | "SUCURSAL_INEXISTENTE" }> {
  const ctx = await obtenerContextoActual();
  const resultado = await repositorioMaestros.actualizarSucursal(ctx, codigo, cambios);
  if (resultado.ok) revalidatePath("/maestros/sucursales");
  return resultado;
}

// ---------------------------------------------------------------------------
// Precios manuales
// ---------------------------------------------------------------------------

export async function fijarPrecioManualAccion(entrada: {
  articulo: string;
  sucursal: Sucursal;
  anio: number;
  precio: Decimal;
}): Promise<{ ok: true } | { ok: false; motivo: "SIN_PERMISO" | "ARTICULO_INEXISTENTE" | "VALOR_INVALIDO" }> {
  const ctx = await obtenerContextoActual();
  const resultado = await repositorioMaestros.fijarPrecioManual(ctx, entrada);
  if (resultado.ok) {
    revalidatePath("/maestros/precios");
    revalidatePath(`/maestros/articulos/${entrada.articulo}`);
  }
  return resultado;
}

export async function eliminarPrecioManualAccion(
  articulo: string,
  sucursal: Sucursal,
  anio: number,
): Promise<{ ok: true } | { ok: false; motivo: "SIN_PERMISO" | "PRECIO_INEXISTENTE" }> {
  const ctx = await obtenerContextoActual();
  const resultado = await repositorioMaestros.eliminarPrecioManual(ctx, articulo, sucursal, anio);
  if (resultado.ok) {
    revalidatePath("/maestros/precios");
    revalidatePath(`/maestros/articulos/${articulo}`);
  }
  return resultado;
}
