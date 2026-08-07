import "server-only";
import { cookies } from "next/headers";
import { CONTEXTO_POR_DEFECTO, USUARIOS_DEMO } from "./usuarios";
import type { ContextoAcceso } from "../contexto";
import type { Sucursal } from "@/dominio/tipos";

export const COOKIE_USUARIO = "budget_usuario_id";
export const COOKIE_SUCURSAL = "budget_sucursal_activa";
export const COOKIE_ANIO = "budget_anio_activo";

/**
 * No hay autenticación real todavía (Fase 2+): el usuario elige un perfil en
 * `(autenticacion)/ingresar` y esa elección se guarda en una cookie de sesión.
 * El día que exista Supabase Auth, esta función es la única que cambia — lee
 * el JWT en vez de la cookie — y ningún Server Component que la llama se toca.
 */
export async function obtenerContextoActual(): Promise<ContextoAcceso> {
  const almacen = await cookies();
  const id = almacen.get(COOKIE_USUARIO)?.value;
  return USUARIOS_DEMO.find((u) => u.usuarioId === id) ?? CONTEXTO_POR_DEFECTO;
}

/**
 * Sucursal + año de precios activos — la restricción que congela el catálogo
 * (ver `(autenticacion)/contexto`). Se usa como valor por defecto al crear un
 * presupuesto nuevo y al navegar el maestro de precios.
 */
export async function obtenerContextoPrecioActual(): Promise<{ sucursal: Sucursal | null; anio: number | null }> {
  const almacen = await cookies();
  const sucursal = (almacen.get(COOKIE_SUCURSAL)?.value as Sucursal | undefined) ?? null;
  const anioTexto = almacen.get(COOKIE_ANIO)?.value;
  return { sucursal, anio: anioTexto ? Number(anioTexto) : null };
}
