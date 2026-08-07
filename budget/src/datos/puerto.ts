/**
 * El contrato entre las pantallas y la fuente de datos. Es la pieza que
 * decide si conectar Supabase más adelante es sustituir un módulo o
 * reescribir la app — por eso cinco reglas se aplican a TODA función de
 * este archivo, sin excepción:
 *
 * 1. Todo importe es Decimal (string). Ninguna firma expone `number` para dinero.
 * 2. Los errores de negocio son valores de retorno (`{ ok: false, motivo }`),
 *    nunca excepciones — así la UI ya maneja hoy "aprobado, no editable" y
 *    "tiene ERRORES, no aprobable", que es justo lo que RLS y los triggers
 *    de Supabase impondrán después.
 * 3. Todo listado se pagina explícitamente. No existe `listarTodosLosArticulos()`.
 * 4. Toda función recibe `ContextoAcceso`. Hoy el mock filtra con él; mañana
 *    Supabase lo deriva de la sesión y RLS hace el trabajo — las firmas no cambian.
 * 5. El módulo que selecciona la implementación (`index.ts`) importa
 *    'server-only': el fixture de BAIKAL no puede acabar en el bundle del cliente.
 */
import type { Insumo, LineaPresupuesto, FilaExplosion } from "@/dominio/tipos";
import type { ContextoAcceso } from "./contexto";
import type {
  Articulo,
  CabeceraPresupuesto,
  ConsultaArticulos,
  ConsultaCuentas,
  Cuenta,
  Familia,
  FiltroExplosion,
  FiltroPresupuestos,
  FilaComparacion,
  FilaResumen,
  Hallazgo,
  IdPresupuesto,
  LoteCambios,
  MarcaVersion,
  Pagina,
  PrecioResuelto,
  ResultadoGuardado,
  ResultadoRepricing,
  ResultadoTransicion,
  ResumenPresupuesto,
  Sucursal,
  Usuario,
} from "./tipos";

export interface RepositorioPresupuestos {
  listar(ctx: ContextoAcceso, filtro: FiltroPresupuestos): Promise<Pagina<ResumenPresupuesto>>;
  obtenerCabecera(ctx: ContextoAcceso, id: IdPresupuesto): Promise<CabeceraPresupuesto | null>;
  /** El árbol SIN insumos — los insumos se piden por línea vía obtenerApu(). */
  obtenerArbol(
    ctx: ContextoAcceso,
    id: IdPresupuesto,
  ): Promise<{ lineas: LineaPresupuesto[]; marcaVersion: MarcaVersion } | null>;
  obtenerApu(ctx: ContextoAcceso, id: IdPresupuesto, codigoLinea: string): Promise<Insumo[]>;
  guardarCambios(ctx: ContextoAcceso, id: IdPresupuesto, lote: LoteCambios): Promise<ResultadoGuardado>;
  crearVersion(ctx: ContextoAcceso, id: IdPresupuesto, motivo: string): Promise<IdPresupuesto>;
  /** Genera una versión BORRADOR nueva con los insumos repreciados al destino — nunca edita en sitio. */
  generarVersionRepreciada(
    ctx: ContextoAcceso,
    id: IdPresupuesto,
    destino: { sucursal: Sucursal; anio: number },
  ): Promise<IdPresupuesto>;
  cambiarEstado(
    ctx: ContextoAcceso,
    id: IdPresupuesto,
    nuevoEstado: "EN_REVISION" | "APROBADO" | "SUPERSEDIDO" | "BORRADOR",
  ): Promise<ResultadoTransicion>;
}

export interface RepositorioAnalisis {
  resumen(ctx: ContextoAcceso, id: IdPresupuesto, nivel: 4 | 5): Promise<FilaResumen[]>;
  explosion(
    ctx: ContextoAcceso,
    id: IdPresupuesto,
    filtro: FiltroExplosion,
  ): Promise<{ filas: FilaExplosion[]; corteParetoIndice: number }>;
  hallazgos(ctx: ContextoAcceso, id: IdPresupuesto): Promise<Hallazgo[]>;
  justificarHallazgo(
    ctx: ContextoAcceso,
    id: IdPresupuesto,
    hallazgoId: string,
    justificacion: string,
  ): Promise<{ ok: true } | { ok: false; motivo: "SIN_PERMISO" | "JUSTIFICACION_INSUFICIENTE" }>;
  comparar(
    ctx: ContextoAcceso,
    idA: IdPresupuesto,
    idB: IdPresupuesto,
    nivel: 4 | 5 | 8 | 10,
  ): Promise<FilaComparacion[]>;
  previsualizarRepricing(
    ctx: ContextoAcceso,
    id: IdPresupuesto,
    destino: { sucursal: Sucursal; anio: number },
  ): Promise<ResultadoRepricing>;
}

export interface RepositorioMaestros {
  buscarArticulos(ctx: ContextoAcceso, consulta: ConsultaArticulos): Promise<Pagina<Articulo>>;
  resolverPrecio(
    ctx: ContextoAcceso,
    codigoArticulo: string,
    sucursal: Sucursal,
    anio: number,
  ): Promise<PrecioResuelto | null>;
  listarCuentas(ctx: ContextoAcceso, consulta: ConsultaCuentas): Promise<Pagina<Cuenta>>;
  /**
   * El árbol completo (sin paginar) de una plantilla, para construir la vista
   * plegable — construir un árbol correcto exige tener todos sus nodos, algo
   * que no se puede paginar. Igual que `obtenerArbol` de presupuestos.
   */
  listarArbolCuentas(ctx: ContextoAcceso, plantilla?: Cuenta["plantilla"]): Promise<Cuenta[]>;
  /** Código y `codigoPadre` nunca son editables aquí: se derivan del código, nunca se digitan. */
  actualizarCuenta(
    ctx: ContextoAcceso,
    codigo: string,
    cambios: { descripcion?: string; unidadMedida?: string; activa?: boolean },
  ): Promise<{ ok: true; cuenta: Cuenta } | { ok: false; motivo: "SIN_PERMISO" | "CUENTA_INEXISTENTE" }>;
  listarFamilias(ctx: ContextoAcceso): Promise<Familia[]>;
  listarSucursales(ctx: ContextoAcceso): Promise<Sucursal[]>;
}

export interface RepositorioSesion {
  usuarioActual(): Promise<Usuario | null>;
  sucursalesPermitidas(ctx: ContextoAcceso): Promise<Sucursal[]>;
}
