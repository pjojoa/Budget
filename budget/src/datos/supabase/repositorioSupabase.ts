import "server-only";
import type {
  RepositorioAnalisis,
  RepositorioMaestros,
  RepositorioPresupuestos,
  RepositorioSesion,
} from "../puerto";

/**
 * Implementación real, pendiente de la capa Supabase (esquema SQL + RLS +
 * Supabase Auth). Las firmas ya están fijadas por `../puerto`; cuando se
 * conecte, solo cambia `FUENTE_DATOS` en `../index.ts` — ninguna pantalla
 * debería necesitar tocarse.
 */
function pendiente(): never {
  throw new Error("Repositorio Supabase pendiente de implementar.");
}

export const repositorioPresupuestos: RepositorioPresupuestos = {
  listar: pendiente,
  obtenerCabecera: pendiente,
  obtenerArbol: pendiente,
  obtenerApu: pendiente,
  guardarCambios: pendiente,
  crearVersion: pendiente,
  generarVersionRepreciada: pendiente,
  cambiarEstado: pendiente,
};

export const repositorioAnalisis: RepositorioAnalisis = {
  resumen: pendiente,
  explosion: pendiente,
  hallazgos: pendiente,
  justificarHallazgo: pendiente,
  comparar: pendiente,
  previsualizarRepricing: pendiente,
};

export const repositorioMaestros: RepositorioMaestros = {
  buscarArticulos: pendiente,
  resolverPrecio: pendiente,
  listarCuentas: pendiente,
  listarArbolCuentas: pendiente,
  actualizarCuenta: pendiente,
  crearCuenta: pendiente,
  eliminarCuenta: pendiente,
  listarFamilias: pendiente,
  crearFamilia: pendiente,
  actualizarFamilia: pendiente,
  eliminarFamilia: pendiente,
  crearArticulo: pendiente,
  actualizarArticulo: pendiente,
  eliminarArticulo: pendiente,
  listarSucursales: pendiente,
  listarCatalogoSucursales: pendiente,
  actualizarSucursal: pendiente,
  fijarPrecioManual: pendiente,
  eliminarPrecioManual: pendiente,
  listarManoObra: pendiente,
  buscarMateriales: pendiente,
};

export const repositorioSesion: RepositorioSesion = {
  usuarioActual: pendiente,
  sucursalesPermitidas: pendiente,
};
