import type { Decimal } from "./decimal";
import type { Nivel } from "./codigo";

export type Sucursal =
  | "BUCARAMANGA"
  | "BOGOTA"
  | "BARRANQUILLA"
  | "CARTAGENA"
  | "CALI"
  | "ZIPAQUIRA"
  | "SANTA_MARTA";

export type EstadoPresupuesto = "BORRADOR" | "EN_REVISION" | "APROBADO" | "SUPERSEDIDO";

export type PlantillaPresupuesto =
  | "EDIFICACION"
  | "URBANISMO_INTERNO"
  | "URBANISMO_EXTERNO"
  | "MIXTA";

export type TipoApu = "" | "M.O" | "T.C" | "MAT" | "EQ";

export type TipoRecurso = "MAT" | "MO" | "EQ" | "TC";

export type OrigenPrecio = "CATALOGO" | "MANUAL" | "SUCURSAL_REFERENCIA" | "SIN_PRECIO";

export type Severidad = "ERROR" | "AVISO" | "INFO";

export type EstadoHallazgo = "ABIERTO" | "JUSTIFICADO" | "CORREGIDO";

export interface Insumo {
  codigo: string;
  descripcionObra: string;
  descripcionCatalogo?: string;
  unidad: string;
  tipo: TipoRecurso;
  rendimiento: Decimal;
  precio: Decimal;
  origenPrecio: OrigenPrecio;
  parcial: Decimal;
}

export interface LineaPresupuesto {
  codigo: string;
  nivel: Nivel;
  padre: string | null;
  descripcion: string;
  unidad: string;
  /** N10: cantidad de obra. N4/N5/N8: MULTIPLICADOR (repeticiones). */
  cantidad: Decimal;
  tipo: TipoApu;
  /** Calculado. Solo escribe el motor. */
  valorUnitario: Decimal;
  /** Calculado. Solo escribe el motor. */
  valorTotal: Decimal;
  /** Calculado: valorTotal / total * 100. */
  incidenciaPct: Decimal;
  /** Solo presente en líneas N10. */
  insumos?: Insumo[];
}

export interface MetaPresupuesto {
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
  /** Calculado. */
  total: Decimal;
  /** Calculado. */
  valorInmueble: Decimal;
  /** Calculado. */
  valorM2: Decimal;
}

export interface Obra {
  meta: MetaPresupuesto;
  lineas: LineaPresupuesto[];
}

export interface Hallazgo {
  id: string;
  severidad: Severidad;
  regla: string;
  codigo: string;
  mensaje: string;
  estado: EstadoHallazgo;
  justificacion: string | null;
}

export interface FilaExplosion {
  codigo: string;
  descripcion: string;
  unidad: string;
  tipo: TipoRecurso;
  cantidad: Decimal;
  precio: Decimal;
  importe: Decimal;
  incidenciaPct: Decimal;
  acumuladoPct: Decimal;
  apariciones: number;
  preciosDistintos: string[];
}
