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
}

export interface PrecioResuelto {
  precio: Decimal;
  origen: "CATALOGO" | "SUCURSAL_REFERENCIA" | "SIN_PRECIO";
  unidad?: string;
  descripcionCatalogo?: string;
}

export interface Usuario {
  id: string;
  nombre: string;
}

export type { Hallazgo, Severidad, Sucursal, LineaPresupuesto, Insumo };
