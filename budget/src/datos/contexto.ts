import type { Sucursal } from "@/dominio/tipos";

export type Rol =
  | "DIRECTOR_NACIONAL_CPC"
  | "DIRECTOR_SUCURSAL_CPC"
  | "PRESUPUESTADOR"
  | "ADMIN_MAESTROS";

/**
 * Se construye una vez por request a partir de la sesión (hoy simulada,
 * mañana Supabase Auth + RLS) y viaja a TODAS las funciones del repositorio.
 * Con Supabase, RLS hará el trabajo de aislamiento; aquí, en el mock, lo hace
 * el filtro explícito por `sucursales` — así el contrato no cambia al
 * conectar la base de datos real.
 */
export interface ContextoAcceso {
  usuarioId: string;
  nombre: string;
  roles: Rol[];
  /** Sucursales donde el usuario tiene ALGÚN rol de alcance por sucursal. */
  sucursales: Sucursal[];
}

/** Director Nacional CPC ve todas las sucursales. */
export function veTodo(ctx: ContextoAcceso): boolean {
  return ctx.roles.includes("DIRECTOR_NACIONAL_CPC");
}

export function puedeEditarMaestros(ctx: ContextoAcceso): boolean {
  return ctx.roles.includes("ADMIN_MAESTROS");
}

/** Aprobar presupuestos o justificar hallazgos ERROR. */
export function puedeAprobar(ctx: ContextoAcceso): boolean {
  return (
    ctx.roles.includes("DIRECTOR_SUCURSAL_CPC") || ctx.roles.includes("DIRECTOR_NACIONAL_CPC")
  );
}
