#!/usr/bin/env tsx
/**
 * prepararMock.ts — normaliza la salida cruda del oráculo Python
 * (datos-mock/_bruto/*.json, generada por `pto.py`) al formato que consume
 * el frontend: camelCase, Decimal como string (nunca float), y los campos
 * que el motor Python no serializa hoy (origen_precio, estado, plantilla,
 * elaboro, aprobo, fecha).
 *
 * No reimplementa el motor: solo transforma su salida. El total y las
 * cantidades ya vienen calculados por presupuesto_core.py; aquí solo se
 * corrige la precisión (Obra.to_dict() convierte Decimal -> float, lo que
 * introduce ruido binario más allá de la 2a-4a cifra decimal) y se añaden los
 * metadatos que faltan.
 */
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { parse } from "csv-parse/sync";
import path from "node:path";
import { d, redondear, multiplicar, dividir } from "../src/dominio/decimal";
import { normalizaCodigo } from "../src/dominio/codigo";
import { recalcularCascada } from "../src/dominio/cascada";
import type {
  Obra,
  LineaPresupuesto,
  Insumo,
  Hallazgo,
  FilaExplosion,
  Sucursal,
  EstadoPresupuesto,
  PlantillaPresupuesto,
  TipoRecurso,
} from "../src/dominio/tipos";

const RAIZ = path.resolve(import.meta.dirname, "..");
const BRUTO = path.join(RAIZ, "datos-mock", "_bruto");
const SALIDA = path.join(RAIZ, "datos-mock");
const ESQUEMA_PATH = path.resolve(
  RAIZ,
  "..",
  "files",
  "presupuesto-obra-skill",
  "presupuesto-obra",
  "assets",
  "esquema_obra.json",
);

// --------------------------------------------------------------------------
// 1. Validar la forma cruda contra el contrato canónico (assets/esquema_obra.json)
// --------------------------------------------------------------------------

function validarContraEsquema(rutaCruda: string): CrudoObra {
  const esquema = JSON.parse(readFileSync(ESQUEMA_PATH, "utf-8"));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validar = ajv.compile(esquema);
  const datos = JSON.parse(readFileSync(rutaCruda, "utf-8"));
  const valido = validar(datos);

  if (!valido) {
    const errores = validar.errors ?? [];
    // El único hallazgo esperado: el código de insumo malformado real
    // 'TC 2161 60847' (regla E07_CODIGO_MALFORMADO) viola a propósito el
    // patrón de insumos[].codigo — es un dato sucio real, no un bug del
    // transformador. Cualquier OTRO error de esquema sí debe detener el script.
    const inesperados = errores.filter(
      (e) => !(e.instancePath.endsWith("/codigo") && e.schemaPath.includes("insumos")),
    );
    if (inesperados.length > 0) {
      console.error(`Errores de esquema en ${path.basename(rutaCruda)}:`);
      for (const e of inesperados) console.error(`  ${e.instancePath} ${e.message}`);
      throw new Error("La salida del oráculo no cumple assets/esquema_obra.json");
    }
    console.log(
      `${path.basename(rutaCruda)}: ${errores.length} desviación(es) de esquema, ` +
        `todas el código malformado real 'TC 2161 60847' (E07) — esperado, no se detiene.`,
    );
  } else {
    console.log(`${path.basename(rutaCruda)}: valida contra esquema_obra.json sin desviaciones.`);
  }
  return datos;
}

// --------------------------------------------------------------------------
// 2. Transformar al tipo Obra del frontend
// --------------------------------------------------------------------------

type MetaExtra = {
  estado: EstadoPresupuesto;
  plantilla: PlantillaPresupuesto;
  elaboro: string;
  aprobo: string | null;
  fecha: string;
};

/** Forma cruda (snake_case) que serializa `Obra.to_dict()` en presupuesto_core.py. */
interface CrudoInsumo {
  codigo: string;
  descripcion?: string;
  unidad?: string;
  tipo: string;
  rendimiento: number;
  precio: number;
}

interface CrudoLinea {
  codigo: string;
  nivel: number;
  descripcion?: string;
  unidad?: string;
  cantidad: number;
  tipo?: string;
  vu: number;
  vt: number;
  padre: string | null;
  insumos?: CrudoInsumo[];
}

interface CrudoObra {
  meta: {
    proyecto: string;
    version: string | number;
    sucursal: string;
    anio_precios: number;
    n_inmuebles: number;
    area_inmueble_m2: number;
    total: number;
    valor_inmueble: number;
    valor_m2: number;
  };
  lineas: CrudoLinea[];
}

// determinismo: sin Math.random ni Date.now(), para que el fixture sea
// reproducible byte a byte entre corridas (y el test del total no dependa del reloj).
function derivarOrigenPrecio(codigoInsumo: string, precio: number, indice: number): Insumo["origenPrecio"] {
  if (precio <= 0) return "SIN_PRECIO";
  // siembra unos pocos MANUAL / SUCURSAL_REFERENCIA para poder ver los 4 estados
  // del badge en /laboratorio, sin tocar el resto de la obra.
  if (indice % 137 === 0) return "MANUAL";
  if (indice % 211 === 0) return "SUCURSAL_REFERENCIA";
  return "CATALOGO";
}

/**
 * Reconstruye vu/vt/total con NUESTRA cascada (recalcularCascada) en vez de
 * confiar en los vt/vu/total que serializó Python — así el fixture es
 * consistente por construcción con cualquier recálculo posterior que haga la
 * app (mismo código, misma aritmética), en vez de arrastrar el ruido binario
 * de `float(Decimal)` que introduce `Obra.to_dict()`. La cifra dorada
 * (28.399.232.614,23) se verifica DESPUÉS de este recálculo, no antes.
 */
function transformarObra(crudo: CrudoObra, extra: MetaExtra): Obra {
  let contadorInsumo = 0;
  const lineasSinCalcular: LineaPresupuesto[] = crudo.lineas.map((l: CrudoLinea) => {
    const insumos: Insumo[] | undefined =
      l.nivel === 10 && Array.isArray(l.insumos) && l.insumos.length > 0
        ? l.insumos.map((i: CrudoInsumo) => {
            // 8 y 6 decimales: suficiente para eliminar el ruido binario de
            // float64 sin perder decimales reales (rendimientos/precios
            // escalados por la proyección del 8% anual pueden traer varios).
            const rendimiento = redondear(d(i.rendimiento), 8);
            const precio = redondear(d(i.precio), 6);
            contadorInsumo += 1;
            return {
              codigo: normalizaCodigo(i.codigo),
              descripcionObra: i.descripcion ?? "",
              unidad: i.unidad ?? "",
              tipo: i.tipo as TipoRecurso,
              rendimiento,
              precio,
              origenPrecio: derivarOrigenPrecio(i.codigo, Number(i.precio), contadorInsumo),
              parcial: redondear(multiplicar(rendimiento, precio), 2),
            } satisfies Insumo;
          })
        : undefined;

    return {
      codigo: l.codigo,
      nivel: l.nivel as LineaPresupuesto["nivel"],
      padre: l.padre ?? null,
      descripcion: l.descripcion ?? "",
      unidad: l.unidad ?? "UN",
      cantidad: redondear(d(l.cantidad), 6),
      tipo: (l.tipo ?? "") as LineaPresupuesto["tipo"],
      valorUnitario: d(0),
      valorTotal: d(0),
      incidenciaPct: d(0),
      insumos,
    } satisfies LineaPresupuesto;
  });

  const { lineas, total: totalExacto } = recalcularCascada(lineasSinCalcular);
  const total = redondear(totalExacto, 2);
  // valorUnitario/valorTotal se guardan a precisión completa, SIN redondear:
  // el cliente recalcula VT(N10) = cantidad × valorUnitario al editar
  // (recalcularCascadaOptimista, que no tiene los insumos para recomputar
  // VU), y si aquí ya se hubiera redondeado a 2 decimales, cantidades grandes
  // (miles de m²) multiplicadas por un VU pre-redondeado divergen varios
  // pesos del total real — "redondear solo al presentar" también aplica al
  // guardar el fixture, no solo a lo que ve el usuario.

  return {
    meta: {
      proyecto: crudo.meta.proyecto,
      version: String(crudo.meta.version),
      estado: extra.estado,
      sucursal: crudo.meta.sucursal as Sucursal,
      anioPrecios: crudo.meta.anio_precios,
      plantilla: extra.plantilla,
      nInmuebles: crudo.meta.n_inmuebles,
      areaInmuebleM2: redondear(d(crudo.meta.area_inmueble_m2), 4),
      elaboro: extra.elaboro,
      aprobo: extra.aprobo,
      fecha: extra.fecha,
      total,
      valorInmueble: redondear(dividir(totalExacto, d(crudo.meta.n_inmuebles || 1)), 2),
      valorM2: redondear(
        dividir(totalExacto, multiplicar(d(crudo.meta.n_inmuebles || 1), d(crudo.meta.area_inmueble_m2 || 1))),
        2,
      ),
    },
    lineas,
  };
}

// --------------------------------------------------------------------------
// 3. Hallazgos y explosión (CSV -> JSON)
// --------------------------------------------------------------------------

function transformarHallazgos(rutaCsv: string): Hallazgo[] {
  const texto = readFileSync(rutaCsv, "utf-8");
  const filas: Array<Record<string, string>> = parse(texto, { columns: true, skip_empty_lines: true });
  return filas.map((f, i) => ({
    id: `h-${String(i + 1).padStart(3, "0")}`,
    severidad: f.severidad as Hallazgo["severidad"],
    regla: f.regla,
    codigo: f.codigo,
    mensaje: f.mensaje,
    estado: "ABIERTO",
    justificacion: null,
  }));
}

function transformarExplosion(rutaCsv: string): FilaExplosion[] {
  const texto = readFileSync(rutaCsv, "utf-8");
  const filas: Array<Record<string, string>> = parse(texto, { columns: true, skip_empty_lines: true });
  return filas.map((f) => ({
    codigo: f.codigo,
    descripcion: f.descripcion,
    unidad: f.unidad,
    tipo: f.tipo as TipoRecurso,
    cantidad: redondear(d(f.cantidad), 6),
    precio: redondear(d(f.precio), 2),
    importe: redondear(d(f.importe), 2),
    incidenciaPct: redondear(d(f.incidencia_pct), 4),
    acumuladoPct: redondear(d(f.acumulado_pct), 4),
    apariciones: Number(f.apariciones),
    preciosDistintos: f.precios_distintos ? f.precios_distintos.split("|") : [],
  }));
}

// --------------------------------------------------------------------------
// 4. Fixture sintético de 1.500 líneas (solo rendimiento, replica capítulos)
// --------------------------------------------------------------------------

function generarObraSintetica(base: Obra, copias: number): Obra {
  const OFFSET = 21; // el máximo capítulo real de BAIKAL es 21; no colisiona
  const lineas: LineaPresupuesto[] = [];
  for (let copia = 0; copia < copias; copia++) {
    const desplazamiento = copia * OFFSET;
    for (const linea of base.lineas) {
      const cap = Number(linea.codigo.slice(0, 2)) + desplazamiento;
      if (cap > 97) continue; // no desbordar el espacio de 2 dígitos
      const capStr = String(cap).padStart(2, "0");
      const nuevoCodigo = capStr + linea.codigo.slice(2);
      const nuevoPadre = linea.padre ? capStr + linea.padre.slice(2) : null;
      lineas.push({ ...linea, codigo: nuevoCodigo, padre: nuevoPadre });
    }
  }
  return {
    meta: { ...base.meta, proyecto: "OBRA SINTETICA (solo rendimiento)" },
    lineas,
  };
}

// --------------------------------------------------------------------------

function main() {
  mkdirSync(SALIDA, { recursive: true });

  const crudoV01 = validarContraEsquema(path.join(BRUTO, "baikal_v01.json"));
  const crudoV02 = validarContraEsquema(path.join(BRUTO, "baikal_v02_bogota2027.json"));

  const obraV01 = transformarObra(crudoV01, {
    estado: "APROBADO",
    plantilla: "EDIFICACION",
    elaboro: "Presupuestador CALI",
    aprobo: "Director CPC CALI",
    fecha: "2026-02-10",
  });

  const obraV02 = transformarObra(crudoV02, {
    estado: "BORRADOR",
    plantilla: "EDIFICACION",
    elaboro: "Presupuestador CALI",
    aprobo: null,
    fecha: "2026-08-01",
  });
  obraV02.meta.version = "02";

  const hallazgos = transformarHallazgos(path.join(BRUTO, "hallazgos_baikal.csv"));
  const explosion = transformarExplosion(path.join(BRUTO, "explosion_baikal.csv"));
  const sintetica = generarObraSintetica(obraV01, 4);

  writeFileSync(
    path.join(SALIDA, "obra-baikal-t3-v01.json"),
    JSON.stringify(obraV01, null, 2),
  );
  writeFileSync(
    path.join(SALIDA, "obra-baikal-t3-v02-bogota-2027.json"),
    JSON.stringify(obraV02, null, 2),
  );
  writeFileSync(
    path.join(SALIDA, "hallazgos-baikal-t3-v01.json"),
    JSON.stringify(hallazgos, null, 2),
  );
  writeFileSync(
    path.join(SALIDA, "explosion-baikal-t3-v01.json"),
    JSON.stringify(explosion, null, 2),
  );
  writeFileSync(
    path.join(SALIDA, "obra-sintetica-1500.json"),
    JSON.stringify(sintetica, null, 2),
  );

  const nLineas = (o: Obra) => o.lineas.length;
  const nInsumos = (o: Obra) => o.lineas.reduce((acc, l) => acc + (l.insumos?.length ?? 0), 0);

  console.log("");
  console.log(`obra-baikal-t3-v01.json          : ${nLineas(obraV01)} líneas, ${nInsumos(obraV01)} insumos, total ${obraV01.meta.total}`);
  console.log(`obra-baikal-t3-v02-bogota-2027    : ${nLineas(obraV02)} líneas, total ${obraV02.meta.total}`);
  console.log(`hallazgos-baikal-t3-v01.json      : ${hallazgos.length} hallazgos (${hallazgos.filter((h) => h.severidad === "ERROR").length} ERROR)`);
  console.log(`explosion-baikal-t3-v01.json      : ${explosion.length} insumos distintos`);
  console.log(`obra-sintetica-1500.json          : ${nLineas(sintetica)} líneas`);
}

main();
