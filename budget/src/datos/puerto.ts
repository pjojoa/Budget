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
import type { Decimal } from "@/dominio/decimal";
import type { Insumo, LineaPresupuesto, FilaExplosion } from "@/dominio/tipos";
import type { ContextoAcceso } from "./contexto";
import type {
  ActividadManoObra,
  Articulo,
  CabeceraPresupuesto,
  ConsultaArticulos,
  ConsultaCuentas,
  ConsultaMateriales,
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
  MaterialCatalogo,
  Pagina,
  PrecioResuelto,
  ResultadoGuardado,
  ResultadoRepricing,
  ResultadoTransicion,
  ResumenPresupuesto,
  Sucursal,
  SucursalCatalogo,
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
  /**
   * El nivel/plantilla/padre se derivan del código (nunca se digitan aparte);
   * si el código no es N4 el padre debe existir ya en el maestro.
   */
  crearCuenta(
    ctx: ContextoAcceso,
    cuenta: { codigo: string; descripcion: string; unidadMedida: string },
  ): Promise<
    | { ok: true; cuenta: Cuenta }
    | { ok: false; motivo: "SIN_PERMISO" | "CODIGO_INVALIDO" | "CODIGO_DUPLICADO" | "PADRE_INEXISTENTE" }
  >;
  /** Elimina la cuenta y su subárbol. Bloqueada si alguna está referenciada por un presupuesto cargado. */
  eliminarCuenta(
    ctx: ContextoAcceso,
    codigo: string,
  ): Promise<{ ok: true } | { ok: false; motivo: "SIN_PERMISO" | "CUENTA_INEXISTENTE" | "EN_USO" }>;

  listarFamilias(ctx: ContextoAcceso): Promise<Familia[]>;
  crearFamilia(
    ctx: ContextoAcceso,
    familia: { codigo: string; nombre: string; tipo: string },
  ): Promise<{ ok: true; familia: Familia } | { ok: false; motivo: "SIN_PERMISO" | "CODIGO_DUPLICADO" }>;
  actualizarFamilia(
    ctx: ContextoAcceso,
    codigo: string,
    cambios: { nombre?: string; tipo?: string; factorAjusteAnual?: Decimal | null },
  ): Promise<
    | { ok: true; familia: Familia }
    | { ok: false; motivo: "SIN_PERMISO" | "FAMILIA_INEXISTENTE" | "VALOR_INVALIDO" }
  >;
  /** Bloqueada si algún artículo del maestro sigue referenciando esta familia. */
  eliminarFamilia(
    ctx: ContextoAcceso,
    codigo: string,
  ): Promise<{ ok: true } | { ok: false; motivo: "SIN_PERMISO" | "FAMILIA_INEXISTENTE" | "EN_USO" }>;

  crearArticulo(
    ctx: ContextoAcceso,
    articulo: { codigo: string; descripcion: string; unidadMedida: string; familia: string },
  ): Promise<{ ok: true; articulo: Articulo } | { ok: false; motivo: "SIN_PERMISO" | "CODIGO_DUPLICADO" }>;
  actualizarArticulo(
    ctx: ContextoAcceso,
    codigo: string,
    cambios: { descripcion?: string; unidadMedida?: string; familia?: string; activo?: boolean },
  ): Promise<{ ok: true; articulo: Articulo } | { ok: false; motivo: "SIN_PERMISO" | "ARTICULO_INEXISTENTE" }>;
  /** Bloqueada si el artículo aparece como insumo en algún presupuesto cargado. */
  eliminarArticulo(
    ctx: ContextoAcceso,
    codigo: string,
  ): Promise<{ ok: true } | { ok: false; motivo: "SIN_PERMISO" | "ARTICULO_INEXISTENTE" | "EN_USO" }>;

  listarSucursales(ctx: ContextoAcceso): Promise<Sucursal[]>;
  /** Registro completo del catálogo (código corto + nombre + activa), para la pantalla de administración. */
  listarCatalogoSucursales(ctx: ContextoAcceso): Promise<SucursalCatalogo[]>;
  /**
   * Solo `activa` es editable: `nombre` es el mismo valor que el literal
   * `Sucursal` usado en toda la app (presupuestos, precios, contexto de
   * acceso) — renombrarlo aquí dejaría esas referencias apuntando a un valor
   * que ya no existe. Crear/eliminar sucursales tampoco se soporta por la
   * misma razón: `Sucursal` es una unión de 7 literales fija en el dominio,
   * no una tabla libre.
   */
  actualizarSucursal(
    ctx: ContextoAcceso,
    codigo: string,
    cambios: { activa: boolean },
  ): Promise<{ ok: true; sucursal: SucursalCatalogo } | { ok: false; motivo: "SIN_PERMISO" | "SUCURSAL_INEXISTENTE" }>;

  /** Fija un precio manual para (artículo, sucursal, año) — tiene prioridad sobre el catálogo al resolver. */
  fijarPrecioManual(
    ctx: ContextoAcceso,
    entrada: { articulo: string; sucursal: Sucursal; anio: number; precio: Decimal },
  ): Promise<{ ok: true } | { ok: false; motivo: "SIN_PERMISO" | "ARTICULO_INEXISTENTE" | "VALOR_INVALIDO" }>;
  eliminarPrecioManual(
    ctx: ContextoAcceso,
    articulo: string,
    sucursal: Sucursal,
    anio: number,
  ): Promise<{ ok: true } | { ok: false; motivo: "SIN_PERMISO" | "PRECIO_INEXISTENTE" }>;

  /**
   * Catálogo de mano de obra "no inventariable" (jornales/comisiones que se
   * cotizan por sucursal, no artículos del maestro de materiales). Sin
   * paginar como `listarArbolCuentas`/`listarFamilias`: es un catálogo
   * completo del tamaño de un maestro (770 filas), no un listado de líneas
   * de presupuesto.
   */
  listarManoObra(ctx: ContextoAcceso): Promise<ActividadManoObra[]>;

  /**
   * Catálogo de materiales para consulta al armar un APU (`ZPRECIOS OG
   * MARVAL`, 7.869 artículos) — sí se pagina: es del tamaño de un maestro
   * de artículos, no de un catálogo de referencia como mano de obra.
   */
  buscarMateriales(ctx: ContextoAcceso, consulta: ConsultaMateriales): Promise<Pagina<MaterialCatalogo>>;
}

export interface RepositorioSesion {
  usuarioActual(): Promise<Usuario | null>;
  sucursalesPermitidas(ctx: ContextoAcceso): Promise<Sucursal[]>;
}
