import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import type { Articulo, Cuenta, Familia } from "../tipos";
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

export interface Sucursales {
  codigo: string;
  nombre: string;
  activa: boolean;
}

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

/** Carga los 5 CSV de maestros una sola vez por proceso servidor (~37.500 filas). */
export function cargarMaestros(): MaestrosCargados {
  if (globalThis.__budgetMaestrosCargados) return globalThis.__budgetMaestrosCargados;

  const filasArticulos = leerCsv<Record<string, string>>("03_articulos.csv");
  const filasFamilias = leerCsv<Record<string, string>>("02_familias.csv");
  const filasCuentas = leerCsv<Record<string, string>>("04_cuentas.csv");
  const filasSucursales = leerCsv<Record<string, string>>("01_sucursales.csv");
  const filasPrecios = leerCsv<Record<string, string>>("05_precios.csv");

  const nombrePorFamilia = new Map(filasFamilias.map((f) => [f.codigo, f.nombre]));

  const articulos: Articulo[] = filasArticulos.map((f) => ({
    codigo: f.codigo,
    descripcion: f.descripcion,
    unidadMedida: f.unidad_medida,
    familia: f.familia,
    familiaNombre: nombrePorFamilia.get(f.familia) ?? f.familia,
    tipoLinea: (f.tipo_linea as Articulo["tipoLinea"]) || "",
    activo: f.activo === "true",
    nSucursalesConPrecio: Number(f.n_sucursales_con_precio || 0),
  }));

  const familias: Familia[] = filasFamilias.map((f) => ({
    codigo: f.codigo,
    nombre: f.nombre,
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

  globalThis.__budgetMaestrosCargados = { articulos, cuentas, familias, sucursales, precios };
  return globalThis.__budgetMaestrosCargados;
}
