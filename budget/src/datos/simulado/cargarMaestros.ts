import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import type { ActividadManoObra, Articulo, Cuenta, Familia, SucursalCatalogo } from "../tipos";
import type { Nivel } from "@/dominio/codigo";
import type { Decimal } from "@/dominio/decimal";
import type { PlantillaPresupuesto, Sucursal } from "@/dominio/tipos";

// process.cwd(), no import.meta.dirname: Next.js empaqueta este módulo y
// mueve el archivo de sitio en el build de servidor, así que una ruta
// relativa al propio archivo se rompe en producción. El cwd del proceso
// Next (dev y start) es siempre la raíz del proyecto (budget/).
const RAIZ_MOCK = path.join(process.cwd(), "datos-mock", "maestros");

function leerCsv<T extends Record<string, string>>(nombreArchivo: string): T[] {
  const ruta = path.join(RAIZ_MOCK, nombreArchivo);
  const texto = readFileSync(ruta, "utf-8");
  return parse(texto, { columns: true, skip_empty_lines: true, bom: true });
}

export type Sucursales = SucursalCatalogo;

export interface FilaPrecio {
  articulo: string;
  sucursal: Sucursal;
  anioBase: number;
  precioAnio: [Decimal | null, Decimal | null, Decimal | null, Decimal | null];
}

interface MaestrosCargados {
  articulos: Articulo[];
  cuentas: Cuenta[];
  familias: Familia[];
  sucursales: Sucursales[];
  /** clave `${articulo}|${sucursal}` -> fila de precio (única por (articulo, sucursal)). */
  precios: Map<string, FilaPrecio>;
  /**
   * Overrides fijados por Admin Maestros vía `fijarPrecioManual`, clave
   * `${articulo}|${sucursal}|${anio}`. Se consultan ANTES que `precios`: un
   * precio manual gana siempre al catálogo, y a diferencia de `precios`
   * (formato ancho, un `anioBase` fijo por fila) puede cubrir un año fuera
   * del rango del catálogo.
   */
  preciosManuales: Map<string, Decimal>;
  manoObra: ActividadManoObra[];
}

// `globalThis`, no un `let` de módulo: en `next dev` cada ruta puede
// compilarse como una entrada bajo demanda con su PROPIO registro de
// módulos, así que un `let` no sobrevive de forma fiable entre rutas
// distintas (una edición de cuenta hecha aquí puede "desaparecer" al
// navegar a una ruta recién compilada). Mismo fix que en
// `repositorioSimulado.ts`'s `obtenerAlmacen()`. Ahora que `cuentas` es
// editable (`actualizarCuenta`), el mismo riesgo aplica aquí.
declare global {
  var __budgetMaestrosCargados: MaestrosCargados | undefined;
}

/** Carga los 6 CSV de maestros una sola vez por proceso servidor (~38.300 filas). */
export function cargarMaestros(): MaestrosCargados {
  if (globalThis.__budgetMaestrosCargados) return globalThis.__budgetMaestrosCargados;

  const filasArticulos = leerCsv<Record<string, string>>("03_articulos.csv");
  const filasFamilias = leerCsv<Record<string, string>>("02_familias.csv");
  const filasCuentas = leerCsv<Record<string, string>>("04_cuentas.csv");
  const filasSucursales = leerCsv<Record<string, string>>("01_sucursales.csv");
  const filasPrecios = leerCsv<Record<string, string>>("05_precios.csv");
  const filasManoObra = leerCsv<Record<string, string>>("06_mano_obra_precios.csv");

  const nombrePorFamilia = new Map(filasFamilias.map((f) => [f.codigo, f.nombre]));

  const articulos: Articulo[] = filasArticulos.map((f) => {
    // "nan" en el maestro real no es una familia: es la ausencia de una
    // (823 artículos). Mostrar el nombre real evita que un usuario vea
    // literalmente el texto "nan" como si fuera un nombre de familia.
    const sinFamilia = !f.familia || f.familia === "nan";
    return {
      codigo: f.codigo,
      descripcion: f.descripcion,
      unidadMedida: f.unidad_medida,
      familia: f.familia,
      familiaNombre: sinFamilia ? "Sin familia" : (nombrePorFamilia.get(f.familia) ?? f.familia),
      tipoLinea: (f.tipo_linea as Articulo["tipoLinea"]) || "",
      activo: f.activo === "true",
      nSucursalesConPrecio: Number(f.n_sucursales_con_precio || 0),
    };
  });

  const articuloPorCodigo = new Map(articulos.map((a) => [a.codigo, a]));

  const familias: Familia[] = filasFamilias.map((f) => ({
    codigo: f.codigo,
    nombre: f.nombre,
    tipo: f.tipo || "",
    nArticulos: Number(f.n_articulos || 0),
  }));

  const cuentas: Cuenta[] = filasCuentas.map((f) => ({
    codigo: f.codigo,
    nivel: Number(f.nivel) as Nivel,
    codigoPadre: f.codigo_padre || null,
    descripcion: f.descripcion,
    unidadMedida: f.unidad_medida,
    plantilla: f.plantilla as PlantillaPresupuesto | "ESPECIAL",
    activa: f.activa === "true",
  }));

  const sucursales: Sucursales[] = filasSucursales.map((f) => ({
    codigo: f.codigo,
    nombre: f.nombre,
    activa: f.activa === "true",
  }));

  function precioONull(v: string): Decimal | null {
    return v && v.trim() !== "" ? (v as Decimal) : null;
  }

  const precios = new Map<string, FilaPrecio>();
  for (const f of filasPrecios) {
    precios.set(`${f.articulo}|${f.sucursal}`, {
      articulo: f.articulo,
      sucursal: f.sucursal as Sucursal,
      anioBase: Number(f.anio_base),
      precioAnio: [
        precioONull(f.precio_anio_1),
        precioONull(f.precio_anio_2),
        precioONull(f.precio_anio_3),
        precioONull(f.precio_anio_4),
      ],
    });
  }

  const SUCURSALES_MANO_OBRA: Sucursal[] = [
    "BARRANQUILLA",
    "BOGOTA",
    "BUCARAMANGA",
    "CALI",
    "CARTAGENA",
    "RICAURTE",
    "ZIPAQUIRA",
  ];

  const manoObra: ActividadManoObra[] = filasManoObra.map((f) => {
    const precios: Partial<Record<Sucursal, Decimal>> = {};
    for (const s of SUCURSALES_MANO_OBRA) {
      const v = f[`precio_${s.toLowerCase()}`];
      if (v && v.trim() !== "") precios[s] = v as Decimal;
    }
    const noInventariable = f.no_inventariable && f.no_inventariable.trim() !== "" ? f.no_inventariable : null;
    const articuloRef = noInventariable ? articuloPorCodigo.get(noInventariable) : undefined;
    return {
      codigo: f.codigo,
      descripcion: f.descripcion,
      capituloCodigo: f.capitulo_codigo,
      capitulo: f.capitulo,
      familia: f.familia,
      unidad: f.unidad,
      anio: Number(f.anio),
      precios,
      noInventariable,
      articuloVinculado: articuloRef
        ? { descripcion: articuloRef.descripcion, familiaCodigo: articuloRef.familia, familiaNombre: articuloRef.familiaNombre }
        : null,
    };
  });

  globalThis.__budgetMaestrosCargados = {
    articulos,
    cuentas,
    familias,
    sucursales,
    precios,
    preciosManuales: new Map(),
    manoObra,
  };
  return globalThis.__budgetMaestrosCargados;
}
