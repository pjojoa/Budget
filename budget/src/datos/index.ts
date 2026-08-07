import "server-only";

/**
 * Único punto de selección de implementación. Hoy siempre "simulado"; el día
 * que exista la capa Supabase, esto se vuelve
 * `process.env.FUENTE_DATOS === "supabase" ? ... : ...` y ninguna pantalla
 * cambia una sola línea — ese es el propósito de `./puerto.ts`.
 */
export {
  repositorioPresupuestos,
  repositorioAnalisis,
  repositorioMaestros,
  repositorioSesion,
} from "./simulado/repositorioSimulado";

export type {
  RepositorioAnalisis,
  RepositorioMaestros,
  RepositorioPresupuestos,
  RepositorioSesion,
} from "./puerto";
export type { ContextoAcceso, Rol } from "./contexto";
export { veTodo, puedeEditarMaestros, puedeAprobar } from "./contexto";
export * from "./tipos";
