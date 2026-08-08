import type { Decimal } from "@/dominio/decimal";
import type { Nivel } from "@/dominio/codigo";
import type {
  EstadoPresupuesto,
  Hallazgo,
  Insumo,
  LineaPresupuesto,
  PlantillaPresupuesto,
  Severidad,
  Sucursal,
  TipoRecurso,
} from "@/dominio/tipos";

export type IdPresupuesto = string;
/** Optimistic-concurrency token: cambia con cada guardado exitoso. */
export type MarcaVersion = string;

// ---------------------------------------------------------------------------
// Paginación — ningún listado de maestros se expone sin ella (20.784 artículos)
// ---------------------------------------------------------------------------

export interface Pagina<T> {
  filas: T[];
  total: number;
  pagina: number;
  porPagina: number;
}

// ---------------------------------------------------------------------------
// Presupuestos
// ---------------------------------------------------------------------------

export interface ResumenPresupuesto {
  id: IdPresupuesto;
  proyecto: string;
  version: string;
  estado: EstadoPresupuesto;
  sucursal: Sucursal;
  anioPrecios: number;
  total: Decimal;
  valorM2: Decimal;
  actualizadoEn: string;
}

export interface CabeceraPresupuesto {
  id: IdPresupuesto;
  proyecto: string;
  version: string;
  estado: EstadoPresupuesto;
  sucursal: Sucursal;
  anioPrecios: number;
  plantilla: PlantillaPresupuesto;
  nInmuebles: number;
  areaInmuebleM2: Decimal;
  elaboro: string;
  aprobo: string | null;
  fecha: string;
  total: Decimal;
  valorInmueble: Decimal;
  valorM2: Decimal;
  nHallazgosAbiertos: { error: number; aviso: number; info: number };
  marcaVersion: MarcaVersion;
}

export interface FiltroPresupuestos {
  sucursal?: Sucursal;
  estado?: EstadoPresupuesto;
  texto?: string;
  pagina?: number;
  porPagina?: number;
}

export type CambioCelda =
  | { op: "actualizar_cantidad"; codigo: string; cantidad: Decimal }
  | { op: "actualizar_insumo"; codigo: string; insumoCodigo: string; campo: "rendimiento" | "precio"; valor: Decimal };

export interface LoteCambios {
  marcaVersion: MarcaVersion;
  cambios: CambioCelda[];
}

export type ResultadoGuardado =
  | {
      ok: true;
      marcaVersion: MarcaVersion;
      lineas: LineaPresupuesto[];
      total: Decimal;
      valorInmueble: Decimal;
      valorM2: Decimal;
    }
  | { ok: false; motivo: "CONFLICTO_VERSION" | "PRESUPUESTO_INMUTABLE" | "SIN_PERMISO" };

export type ResultadoTransicion =
  | { ok: true; nuevoEstado: EstadoPresupuesto }
  | { ok: false; motivo: "ERRORES_ABIERTOS" | "SIN_PERMISO" | "TRANSICION_INVALIDA"; detalle?: string };

// ---------------------------------------------------------------------------
// Análisis
// ---------------------------------------------------------------------------

export interface FilaResumen {
  codigo: string;
  nivel: Nivel;
  descripcion: string;
  valorTotal: Decimal;
  incidenciaPct: Decimal;
  valorM2: Decimal;
}

export interface FiltroExplosion {
  tipoRecurso?: TipoRecurso;
  texto?: string;
}

export interface FilaComparacion {
  codigo: string;
  descripcion: string;
  valorA: Decimal;
  valorB: Decimal;
  delta: Decimal;
  deltaPct: Decimal | null;
}

export interface ResultadoRepricing {
  insumosActualizados: number;
  sinPrecio: number;
  totalAnterior: Decimal;
  totalNuevo: Decimal;
  variacionPct: Decimal;
}

// ---------------------------------------------------------------------------
// Maestros
// ---------------------------------------------------------------------------

export interface Articulo {
  codigo: string;
  descripcion: string;
  unidadMedida: string;
  /** Código de familia — usar `familiaNombre` para mostrar en pantalla. */
  familia: string;
  familiaNombre: string;
  tipoLinea: "S" | "B" | "";
  activo: boolean;
  nSucursalesConPrecio: number;
}

export interface ConsultaArticulos {
  texto?: string;
  familia?: string;
  tipoRecurso?: TipoRecurso;
  soloConPrecioEn?: Sucursal;
  soloActivos?: boolean;
  pagina?: number;
  porPagina?: number;
}

export interface Cuenta {
  codigo: string;
  nivel: Nivel;
  codigoPadre: string | null;
  descripcion: string;
  unidadMedida: string;
  plantilla: PlantillaPresupuesto | "ESPECIAL";
  activa: boolean;
}

export interface ConsultaCuentas {
  texto?: string;
  nivel?: Nivel;
  plantilla?: string;
  pagina?: number;
  porPagina?: number;
}

export interface Familia {
  codigo: string;
  nombre: string;
  /** "Material" | "Mano de obra" | vacío — tal como viene del maestro. */
  tipo: string;
  nArticulos: number;
  /**
   * Multiplicador para proyectar el precio de esta familia al año
   * siguiente (p. ej. 1.065 = +6,5%). La proyección de precios sucede
   * por familia, no por artículo individual: `precio_anio_siguiente =
   * precio_anio_actual * factorAjusteAnual`. `null` = la familia no
   * tiene un factor definido en el maestro de ajustes (p. ej. códigos
   * especiales como OAD, 441, 523560).
   */
  factorAjusteAnual: Decimal | null;
}

export interface PrecioResuelto {
  precio: Decimal;
  origen: "CATALOGO" | "MANUAL" | "SUCURSAL_REFERENCIA" | "SIN_PRECIO";
  unidad?: string;
  descripcionCatalogo?: string;
}

/** Registro del catálogo de sucursales (distinto del `Sucursal` de dominio: ese es el literal fijo de 7 valores usado en todo el resto de la app; este es el registro editable del maestro). */
export interface SucursalCatalogo {
  codigo: string;
  nombre: string;
  activa: boolean;
}

/**
 * Actividad de mano de obra "no inventariable": un ítem de jornal/comisión
 * que se cotiza por sucursal (p. ej. "Comisión día de topografía"), a
 * diferencia de los `Articulo` del maestro de materiales — no tiene
 * insumos propios ni se referencia como MO/TC/EQ dentro de un APU. `familia`
 * aquí es la agrupación propia de este catálogo (viene del maestro de
 * origen como "subcapítulo"), no el código de `Familia` del maestro de
 * artículos — son taxonomías distintas aunque compartan algunos nombres.
 *
 * El código se reformatea desde el original del maestro (p. ej. "A1" ->
 * "A01") para que el orden alfabético coincida con el numérico; el ancho
 * del relleno de ceros es el mínimo necesario POR capítulo (la mayoría usa
 * 2 dígitos, pero ESTRUCTURA e INSTALACIONES HIDRAULICAS Y SANITARIAS pasan
 * de 99 actividades y usan 3).
 */
export interface ActividadManoObra {
  codigo: string;
  descripcion: string;
  /** Letra (A-P) — coincide 1:1 con `capitulo`, es la raíz del árbol. */
  capituloCodigo: string;
  capitulo: string;
  familia: string;
  unidad: string;
  anio: number;
  /** Precio CON IVA por sucursal. Ausente = sin dato, nunca 0. */
  precios: Partial<Record<Sucursal, Decimal>>;
  /**
   * Código del artículo "no inventariable" vinculado en el maestro de
   * actividades de origen (hoja `09_actividad`, columna `num_inventario`).
   * `null` si la actividad no tiene vínculo declarado.
   */
  noInventariable: string | null;
  /**
   * Resuelto cruzando `noInventariable` contra el maestro de artículos
   * (`03_articulos.csv`) — `null` tanto si no hay `noInventariable` como si
   * el código no existe hoy en ese maestro (hueco de datos real, ya
   * conocido para un puñado de artículos huérfanos; no se inventa).
   */
  articuloVinculado: { descripcion: string; familiaCodigo: string; familiaNombre: string } | null;
}

/**
 * Años cubiertos por el catálogo de materiales (`ZPRECIOS OG MARVAL`):
 * 2023-2026 son precios reales donde existen (o proyectados desde el
 * último año real usando el factor de la familia); 2027-2030 son siempre
 * proyección compuesta sobre el precio de 2026 ya validado.
 */
export type AnioCatalogoMaterial = 2023 | 2024 | 2025 | 2026 | 2027 | 2028 | 2029 | 2030;

/**
 * Catálogo de materiales para consulta al armar un APU — un registro por
 * código, con el precio resuelto por (sucursal, año). A diferencia de
 * `Precio` (formato ancho anio_base+4), aquí cada año es explícito porque
 * la fuente ya trae 2023-2030 calculados; no hay `anio_base` que resolver.
 */
export interface MaterialCatalogo {
  codigo: string;
  descripcion: string;
  familia: string;
  familiaNombre: string;
  unidad: string;
  /** "CADUCADO": la fuente ya no lo cotiza — se muestra, nunca se oculta. */
  estado: "EXISTENTE" | "CADUCADO";
  /** precios[sucursal][año] — ausente = sin dato para esa combinación, nunca 0. */
  precios: Partial<Record<Sucursal, Partial<Record<AnioCatalogoMaterial, Decimal>>>>;
}

export interface ConsultaMateriales {
  texto?: string;
  familia?: string;
  soloExistentes?: boolean;
  pagina?: number;
  porPagina?: number;
}

export interface Usuario {
  id: string;
  nombre: string;
}

export type { Hallazgo, Severidad, Sucursal, LineaPresupuesto, Insumo };
