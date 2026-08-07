import type { Sucursal } from "@/dominio/tipos";

export type Rol =
  | "PRESUPUESTADOR"
  | "DIRECTOR_CPC"
  | "ADMIN_MAESTROS"
  | "DIRECCION"
  | "AUDITORIA";

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

export function veTodo(ctx: ContextoAcceso): boolean {
  return ctx.roles.includes("DIRECCION") || ctx.roles.includes("AUDITORIA");
}

export function puedeEditarMaestros(ctx: ContextoAcceso): boolean {
  return ctx.roles.includes("ADMIN_MAESTROS");
}
