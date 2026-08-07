import "server-only";
import { cargarExplosionBaikal, cargarObras } from "./cargarObras";
import { cargarMaestros } from "./cargarMaestros";
import { latencia } from "./latencia";
import { recalcularCascada } from "@/dominio/cascada";
import { corteParetoIndice, explosionDeInsumos } from "@/dominio/explosion";
import { claveCatalogo } from "@/dominio/codigo";
import {
  CERO,
  comparar,
  d,
  dividir,
  esCero,
  multiplicar,
  redondear,
  restar,
} from "@/dominio/decimal";
import type { EstadoPresupuesto, LineaPresupuesto, Obra } from "@/dominio/tipos";
import { puedeEditarMaestros, puedeAprobar, veTodo } from "../contexto";
import type { ContextoAcceso } from "../contexto";
import type {
  RepositorioAnalisis,
  RepositorioMaestros,
  RepositorioPresupuestos,
  RepositorioSesion,
} from "../puerto";
import type {
  FilaComparacion,
  FiltroExplosion,
  FiltroPresupuestos,
  Hallazgo,
  IdPresupuesto,
  LoteCambios,
  Pagina,
  ResultadoGuardado,
  ResultadoRepricing,
  ResultadoTransicion,
  ResumenPresupuesto,
  Sucursal,
} from "../tipos";

// ---------------------------------------------------------------------------
// Almacén en memoria — mutable a propósito, para que guardarCambios,
// crearVersion y cambiarEstado se comporten como el backend real se
// comportará. Vive mientras viva el proceso del servidor Next (dev/start).
// ---------------------------------------------------------------------------

interface EntradaPresupuesto {
  id: IdPresupuesto;
  obra: Obra;
  hallazgos: Hallazgo[];
  marcaVersion: number;
}

// En `next dev` cada ruta puede compilarse como una entrada bajo demanda
// independiente, con su PROPIO registro de módulos — un `let` a nivel de
// módulo no sobrevive de forma fiable entre rutas distintas (una versión
// creada aquí puede "desaparecer" al navegar a una ruta recién compilada).
// `globalThis` sí es compartido por todo el proceso de Node, sea cual sea
// el registro de módulos que lo lea — el mismo patrón que usa Prisma para
// sobrevivir al Fast Refresh. En producción (`next start`) esto es un no-op:
// solo hay un registro de módulos.
declare global {
  var __budgetAlmacenPresupuestos: Map<IdPresupuesto, EntradaPresupuesto> | undefined;
}

function obtenerAlmacen(): Map<IdPresupuesto, EntradaPresupuesto> {
  if (!globalThis.__budgetAlmacenPresupuestos) {
    const almacen = new Map<IdPresupuesto, EntradaPresupuesto>();
    for (const { id, obra, hallazgos } of cargarObras()) {
      almacen.set(id, { id, obra: structuredClone(obra), hallazgos: structuredClone(hallazgos), marcaVersion: 1 });
    }
    globalThis.__budgetAlmacenPresupuestos = almacen;
  }
  return globalThis.__budgetAlmacenPresupuestos;
}

function tieneAccesoSucursal(ctx: ContextoAcceso, sucursal: Sucursal): boolean {
  return veTodo(ctx) || ctx.sucursales.includes(sucursal);
}

/** Resuelve los precios de los insumos N10 contra el catálogo de `destino`. No recalcula la cascada. */
function aplicarRepricing(
  lineasOriginales: LineaPresupuesto[],
  destino: { sucursal: Sucursal; anio: number },
): { lineas: LineaPresupuesto[]; actualizados: number; sinPrecio: number } {
  const { precios } = cargarMaestros();
  const lineas = structuredClone(lineasOriginales);
  let actualizados = 0;
  let sinPrecio = 0;

  for (const linea of lineas) {
    if (linea.nivel !== 10 || !linea.insumos) continue;
    for (const insumo of linea.insumos) {
      const clave = claveCatalogo(insumo.codigo);
      const fila = precios.get(`${clave}|${destino.sucursal}`);
      if (!fila) {
        sinPrecio++;
        continue;
      }
      const offset = destino.anio - fila.anioBase;
      const nuevoPrecio = offset >= 0 && offset <= 3 ? fila.precioAnio[offset] : null;
      if (nuevoPrecio === null) {
        sinPrecio++;
        continue;
      }
      if (comparar(nuevoPrecio, insumo.precio) !== 0) actualizados++;
      insumo.precio = nuevoPrecio;
      insumo.parcial = redondear(multiplicar(insumo.rendimiento, insumo.precio), 2);
    }
  }

  return { lineas, actualizados, sinPrecio };
}

const TRANSICIONES_VALIDAS: Record<EstadoPresupuesto, EstadoPresupuesto[]> = {
  BORRADOR: ["EN_REVISION"],
  EN_REVISION: ["APROBADO", "BORRADOR"],
  APROBADO: ["SUPERSEDIDO"],
  SUPERSEDIDO: [],
};

// ---------------------------------------------------------------------------
// RepositorioPresupuestos
// ---------------------------------------------------------------------------

export const repositorioPresupuestos: RepositorioPresupuestos = {
  async listar(ctx, filtro: FiltroPresupuestos): Promise<Pagina<ResumenPresupuesto>> {
    await latencia();
    let entradas = [...obtenerAlmacen().values()].filter((e) => tieneAccesoSucursal(ctx, e.obra.meta.sucursal));

    if (filtro.sucursal) entradas = entradas.filter((e) => e.obra.meta.sucursal === filtro.sucursal);
    if (filtro.estado) entradas = entradas.filter((e) => e.obra.meta.estado === filtro.estado);
    if (filtro.texto) {
      const t = filtro.texto.toLowerCase();
      entradas = entradas.filter((e) => e.obra.meta.proyecto.toLowerCase().includes(t));
    }

    const pagina = filtro.pagina ?? 1;
    const porPagina = filtro.porPagina ?? 20;
    const inicio = (pagina - 1) * porPagina;
    const filas: ResumenPresupuesto[] = entradas.slice(inicio, inicio + porPagina).map((e) => ({
      id: e.id,
      proyecto: e.obra.meta.proyecto,
      version: e.obra.meta.version,
      estado: e.obra.meta.estado,
      sucursal: e.obra.meta.sucursal,
      anioPrecios: e.obra.meta.anioPrecios,
      total: e.obra.meta.total,
      valorM2: e.obra.meta.valorM2,
      actualizadoEn: e.obra.meta.fecha,
    }));

    return { filas, total: entradas.length, pagina, porPagina };
  },

  async obtenerCabecera(ctx, id) {
    await latencia();
    const e = obtenerAlmacen().get(id);
    if (!e || !tieneAccesoSucursal(ctx, e.obra.meta.sucursal)) return null;

    const abiertos = e.hallazgos.filter((h) => h.estado === "ABIERTO");
    return {
      id: e.id,
      proyecto: e.obra.meta.proyecto,
      version: e.obra.meta.version,
      estado: e.obra.meta.estado,
      sucursal: e.obra.meta.sucursal,
      anioPrecios: e.obra.meta.anioPrecios,
      plantilla: e.obra.meta.plantilla,
      nInmuebles: e.obra.meta.nInmuebles,
      areaInmuebleM2: e.obra.meta.areaInmuebleM2,
      elaboro: e.obra.meta.elaboro,
      aprobo: e.obra.meta.aprobo,
      fecha: e.obra.meta.fecha,
      total: e.obra.meta.total,
      valorInmueble: e.obra.meta.valorInmueble,
      valorM2: e.obra.meta.valorM2,
      nHallazgosAbiertos: {
        error: abiertos.filter((h) => h.severidad === "ERROR").length,
        aviso: abiertos.filter((h) => h.severidad === "AVISO").length,
        info: abiertos.filter((h) => h.severidad === "INFO").length,
      },
      marcaVersion: String(e.marcaVersion),
    };
  },

  async obtenerArbol(ctx, id) {
    await latencia();
    const e = obtenerAlmacen().get(id);
    if (!e || !tieneAccesoSucursal(ctx, e.obra.meta.sucursal)) return null;
    const lineas = e.obra.lineas.map((l) => ({ ...l, insumos: undefined }));
    return { lineas, marcaVersion: String(e.marcaVersion) };
  },

  async obtenerApu(ctx, id, codigoLinea) {
    await latencia();
    const e = obtenerAlmacen().get(id);
    if (!e || !tieneAccesoSucursal(ctx, e.obra.meta.sucursal)) return [];
    return e.obra.lineas.find((l) => l.codigo === codigoLinea)?.insumos ?? [];
  },

  async guardarCambios(ctx, id, lote: LoteCambios): Promise<ResultadoGuardado> {
    await latencia();
    const e = obtenerAlmacen().get(id);
    if (!e || !tieneAccesoSucursal(ctx, e.obra.meta.sucursal) || !ctx.roles.includes("PRESUPUESTADOR")) {
      return { ok: false, motivo: "SIN_PERMISO" };
    }
    if (e.obra.meta.estado !== "BORRADOR") {
      return { ok: false, motivo: "PRESUPUESTO_INMUTABLE" };
    }
    if (String(e.marcaVersion) !== lote.marcaVersion) {
      return { ok: false, motivo: "CONFLICTO_VERSION" };
    }

    const lineas = structuredClone(e.obra.lineas);
    const porCodigo = new Map(lineas.map((l) => [l.codigo, l]));

    for (const cambio of lote.cambios) {
      if (cambio.op === "actualizar_cantidad") {
        const l = porCodigo.get(cambio.codigo);
        if (l) l.cantidad = cambio.cantidad;
      } else if (cambio.op === "actualizar_insumo") {
        const l = porCodigo.get(cambio.codigo);
        const ins = l?.insumos?.find((i) => i.codigo === cambio.insumoCodigo);
        if (ins) {
          ins[cambio.campo] = cambio.valor;
          ins.parcial = redondear(multiplicar(ins.rendimiento, ins.precio), 2);
        }
      }
    }

    // valorUnitario/valorTotal se conservan a precisión completa (sin
    // redondear): el cliente los usa para el recálculo optimista de rama
    // (VT(N10) = cantidad × valorUnitario) y redondear aquí a 2 decimales
    // desalinea ese recálculo del total real cuando la cantidad es grande.
    const { lineas: lineasFinal, total } = recalcularCascada(lineas);

    const totalRedondeado = redondear(total, 2);
    const divisor = multiplicar(d(e.obra.meta.nInmuebles || 1), e.obra.meta.areaInmuebleM2);
    const valorInmueble = redondear(dividir(total, d(e.obra.meta.nInmuebles || 1)), 2);
    const valorM2 = esCero(divisor) ? CERO : redondear(dividir(total, divisor), 2);

    e.obra.lineas = lineasFinal;
    e.obra.meta.total = totalRedondeado;
    e.obra.meta.valorInmueble = valorInmueble;
    e.obra.meta.valorM2 = valorM2;
    e.marcaVersion += 1;

    return {
      ok: true,
      marcaVersion: String(e.marcaVersion),
      lineas: lineasFinal.map((l) => ({ ...l, insumos: undefined })),
      total: totalRedondeado,
      valorInmueble,
      valorM2,
    };
  },

  async crearVersion(ctx, id, motivo) {
    await latencia();
    const alm = obtenerAlmacen();
    const e = alm.get(id);
    if (!e) throw new Error(`Presupuesto ${id} no encontrado`);
    // El mock no persiste el motivo (Obra no tiene ese campo todavía); se
    // deja como punto de extensión explícito para cuando exista Hallazgo de
    // auditoría de versionado.
    void motivo;

    const nuevaVersionNum = Number(e.obra.meta.version) + 1;
    const idBase = id.replace(/-v\d+.*$/, "");
    const nuevoId = `${idBase}-v${String(nuevaVersionNum).padStart(2, "0")}`;

    const nuevaObra: Obra = structuredClone(e.obra);
    nuevaObra.meta.version = String(nuevaVersionNum).padStart(2, "0");
    nuevaObra.meta.estado = "BORRADOR";
    nuevaObra.meta.aprobo = null;

    alm.set(nuevoId, { id: nuevoId, obra: nuevaObra, hallazgos: [], marcaVersion: 1 });
    e.obra.meta.estado = "SUPERSEDIDO";
    return nuevoId;
  },

  async generarVersionRepreciada(ctx, id, destino) {
    await latencia();
    const alm = obtenerAlmacen();
    const e = alm.get(id);
    if (!e) throw new Error(`Presupuesto ${id} no encontrado`);

    const { lineas: repreciadas } = aplicarRepricing(e.obra.lineas, destino);
    const { lineas: lineasFinal, total } = recalcularCascada(repreciadas);
    const totalRedondeado = redondear(total, 2);
    const divisor = multiplicar(d(e.obra.meta.nInmuebles || 1), e.obra.meta.areaInmuebleM2);
    const valorInmueble = redondear(dividir(total, d(e.obra.meta.nInmuebles || 1)), 2);
    const valorM2 = esCero(divisor) ? CERO : redondear(dividir(total, divisor), 2);

    const nuevaVersionNum = Number(e.obra.meta.version) + 1;
    const idBase = id.replace(/-v\d+.*$/, "");
    const nuevoId = `${idBase}-v${String(nuevaVersionNum).padStart(2, "0")}`;

    // No se marca la fuente como SUPERSEDIDO: repreciar crea una versión para
    // otra sucursal/año, no una revisión de la misma — la original conserva
    // su estado (típicamente APROBADO) como registro histórico de su propio
    // contexto de precios.
    const nuevaObra: Obra = structuredClone(e.obra);
    nuevaObra.lineas = lineasFinal;
    nuevaObra.meta.version = String(nuevaVersionNum).padStart(2, "0");
    nuevaObra.meta.estado = "BORRADOR";
    nuevaObra.meta.aprobo = null;
    nuevaObra.meta.sucursal = destino.sucursal;
    nuevaObra.meta.anioPrecios = destino.anio;
    nuevaObra.meta.total = totalRedondeado;
    nuevaObra.meta.valorInmueble = valorInmueble;
    nuevaObra.meta.valorM2 = valorM2;

    alm.set(nuevoId, { id: nuevoId, obra: nuevaObra, hallazgos: [], marcaVersion: 1 });
    return nuevoId;
  },

  async cambiarEstado(ctx, id, nuevoEstado): Promise<ResultadoTransicion> {
    await latencia();
    const e = obtenerAlmacen().get(id);
    if (!e) return { ok: false, motivo: "TRANSICION_INVALIDA" };
    if (!tieneAccesoSucursal(ctx, e.obra.meta.sucursal)) return { ok: false, motivo: "SIN_PERMISO" };

    const actual = e.obra.meta.estado;
    if (!TRANSICIONES_VALIDAS[actual].includes(nuevoEstado)) {
      return { ok: false, motivo: "TRANSICION_INVALIDA" };
    }

    // El Presupuestador envía su propio trabajo a revisión; devolverlo a
    // borrador (rechazarlo) es una acción de filtro de cualquiera de los
    // dos directores, igual que justificar un hallazgo.
    if (nuevoEstado === "EN_REVISION" && !ctx.roles.includes("PRESUPUESTADOR")) {
      return { ok: false, motivo: "SIN_PERMISO" };
    }
    if (nuevoEstado === "BORRADOR" && !puedeAprobar(ctx)) {
      return { ok: false, motivo: "SIN_PERMISO" };
    }

    if (nuevoEstado === "APROBADO") {
      // Director Sucursal CPC revisa y filtra (puedeAprobar cubre esa etapa,
      // p. ej. justificar hallazgos), pero la aprobación FINAL es exclusiva
      // de Director Nacional CPC — es la única cuenta con veTodo().
      if (!veTodo(ctx)) {
        return { ok: false, motivo: "SIN_PERMISO" };
      }
      const errores = e.hallazgos.filter((h) => h.severidad === "ERROR" && h.estado === "ABIERTO");
      if (errores.length > 0) {
        return {
          ok: false,
          motivo: "ERRORES_ABIERTOS",
          detalle: `${errores.length} hallazgo(s) ERROR abiertos bloquean la aprobación`,
        };
      }
      e.obra.meta.aprobo = ctx.nombre;
    }

    e.obra.meta.estado = nuevoEstado;
    return { ok: true, nuevoEstado };
  },
};

// ---------------------------------------------------------------------------
// RepositorioAnalisis
// ---------------------------------------------------------------------------

export const repositorioAnalisis: RepositorioAnalisis = {
  async resumen(ctx, id, nivel) {
    await latencia();
    const e = obtenerAlmacen().get(id);
    if (!e || !tieneAccesoSucursal(ctx, e.obra.meta.sucursal)) return [];
    const divisor = multiplicar(d(e.obra.meta.nInmuebles || 1), e.obra.meta.areaInmuebleM2);
    return e.obra.lineas
      .filter((l) => l.nivel <= nivel)
      .map((l) => ({
        codigo: l.codigo,
        nivel: l.nivel,
        descripcion: l.descripcion,
        valorTotal: l.valorTotal,
        incidenciaPct: l.incidenciaPct,
        valorM2: esCero(divisor) ? CERO : redondear(dividir(l.valorTotal, divisor), 2),
      }));
  },

  async explosion(ctx, id, filtro: FiltroExplosion) {
    await latencia();
    const e = obtenerAlmacen().get(id);
    if (!e || !tieneAccesoSucursal(ctx, e.obra.meta.sucursal)) return { filas: [], corteParetoIndice: 0 };

    // La obra piloto (BAIKAL V01) usa la explosión ya calculada por el
    // oráculo Python — es el mismo resultado que produciría explosionDeInsumos
    // (verificado en __tests__/explosion.test.ts), pero evita recalcular en
    // cada request. El resto de obras (versiones repreciadas, nuevas) se
    // calculan con el puerto TypeScript.
    let filas = id === "baikal-t3-v01" ? cargarExplosionBaikal() : explosionDeInsumos(e.obra.lineas);

    if (filtro.tipoRecurso) filas = filas.filter((f) => f.tipo === filtro.tipoRecurso);
    if (filtro.texto) {
      const t = filtro.texto.toLowerCase();
      filas = filas.filter((f) => f.codigo.toLowerCase().includes(t) || f.descripcion.toLowerCase().includes(t));
    }

    return { filas, corteParetoIndice: corteParetoIndice(filas) };
  },

  async hallazgos(ctx, id) {
    await latencia();
    const e = obtenerAlmacen().get(id);
    if (!e || !tieneAccesoSucursal(ctx, e.obra.meta.sucursal)) return [];
    return e.hallazgos;
  },

  async justificarHallazgo(ctx, id, hallazgoId, justificacion) {
    await latencia();
    if (!puedeAprobar(ctx)) {
      return { ok: false, motivo: "SIN_PERMISO" };
    }
    if (justificacion.trim().length < 20) {
      return { ok: false, motivo: "JUSTIFICACION_INSUFICIENTE" };
    }
    const e = obtenerAlmacen().get(id);
    const h = e?.hallazgos.find((x) => x.id === hallazgoId);
    if (h) {
      h.estado = "JUSTIFICADO";
      h.justificacion = justificacion;
    }
    return { ok: true };
  },

  async comparar(ctx, idA, idB, nivel) {
    await latencia();
    const a = obtenerAlmacen().get(idA);
    const b = obtenerAlmacen().get(idB);
    if (!a || !b) return [];
    if (!tieneAccesoSucursal(ctx, a.obra.meta.sucursal) || !tieneAccesoSucursal(ctx, b.obra.meta.sucursal)) return [];

    const ma = new Map(a.obra.lineas.filter((l) => l.nivel <= nivel).map((l) => [l.codigo, l]));
    const mb = new Map(b.obra.lineas.filter((l) => l.nivel <= nivel).map((l) => [l.codigo, l]));
    const codigos = new Set([...ma.keys(), ...mb.keys()]);

    const filas: FilaComparacion[] = [];
    for (const codigo of codigos) {
      const la = ma.get(codigo);
      const lb = mb.get(codigo);
      const valorA = la?.valorTotal ?? CERO;
      const valorB = lb?.valorTotal ?? CERO;
      if (comparar(valorA, valorB) === 0) continue;
      const delta = restar(valorB, valorA);
      const deltaPct = esCero(valorA) ? null : redondear(multiplicar(dividir(delta, valorA), d(100)), 2);
      filas.push({ codigo, descripcion: (la ?? lb)!.descripcion, valorA, valorB, delta, deltaPct });
    }
    filas.sort((x, y) => x.codigo.localeCompare(y.codigo));
    return filas;
  },

  async previsualizarRepricing(ctx, id, destino): Promise<ResultadoRepricing> {
    await latencia();
    const e = obtenerAlmacen().get(id);
    if (!e) {
      return { insumosActualizados: 0, sinPrecio: 0, totalAnterior: CERO, totalNuevo: CERO, variacionPct: CERO };
    }

    const totalAnterior = e.obra.meta.total;
    const { lineas, actualizados, sinPrecio } = aplicarRepricing(e.obra.lineas, destino);
    const { total: totalNuevo } = recalcularCascada(lineas);
    const totalNuevoRedondeado = redondear(totalNuevo, 2);
    const variacionPct = esCero(totalAnterior)
      ? CERO
      : redondear(multiplicar(dividir(restar(totalNuevoRedondeado, totalAnterior), totalAnterior), d(100)), 2);

    return {
      insumosActualizados: actualizados,
      sinPrecio,
      totalAnterior,
      totalNuevo: totalNuevoRedondeado,
      variacionPct,
    };
  },
};

// ---------------------------------------------------------------------------
// RepositorioMaestros
// ---------------------------------------------------------------------------

export const repositorioMaestros: RepositorioMaestros = {
  async buscarArticulos(_ctx, consulta) {
    await latencia();
    const { articulos } = cargarMaestros();
    let filtrados = articulos;

    if (consulta.texto) {
      const t = consulta.texto.toLowerCase();
      filtrados = filtrados.filter(
        (a) => a.codigo.includes(t) || a.descripcion.toLowerCase().includes(t),
      );
    }
    if (consulta.familia) filtrados = filtrados.filter((a) => a.familia === consulta.familia);
    if (consulta.soloActivos) filtrados = filtrados.filter((a) => a.activo);

    const pagina = consulta.pagina ?? 1;
    const porPagina = consulta.porPagina ?? 50;
    const inicio = (pagina - 1) * porPagina;
    return {
      filas: filtrados.slice(inicio, inicio + porPagina),
      total: filtrados.length,
      pagina,
      porPagina,
    };
  },

  async resolverPrecio(_ctx, codigoArticulo, sucursal, anio) {
    await latencia();
    const { precios } = cargarMaestros();
    const clave = claveCatalogo(codigoArticulo);
    const fila = precios.get(`${clave}|${sucursal}`);
    if (!fila) return { precio: CERO, origen: "SIN_PRECIO" };
    const offset = anio - fila.anioBase;
    const precio = offset >= 0 && offset <= 3 ? fila.precioAnio[offset] : null;
    if (precio === null) return { precio: CERO, origen: "SIN_PRECIO" };
    return { precio, origen: "CATALOGO" };
  },

  async listarCuentas(_ctx, consulta) {
    await latencia();
    const { cuentas } = cargarMaestros();
    let filtradas = cuentas;
    if (consulta.texto) {
      const t = consulta.texto.toLowerCase();
      filtradas = filtradas.filter((c) => c.codigo.includes(t) || c.descripcion.toLowerCase().includes(t));
    }
    if (consulta.nivel) filtradas = filtradas.filter((c) => c.nivel === consulta.nivel);
    if (consulta.plantilla) filtradas = filtradas.filter((c) => c.plantilla === consulta.plantilla);

    const pagina = consulta.pagina ?? 1;
    const porPagina = consulta.porPagina ?? 50;
    const inicio = (pagina - 1) * porPagina;
    return {
      filas: filtradas.slice(inicio, inicio + porPagina),
      total: filtradas.length,
      pagina,
      porPagina,
    };
  },

  async listarArbolCuentas(_ctx, plantilla) {
    await latencia();
    const { cuentas } = cargarMaestros();
    return plantilla ? cuentas.filter((c) => c.plantilla === plantilla) : cuentas;
  },

  async actualizarCuenta(ctx, codigo, cambios) {
    await latencia();
    if (!puedeEditarMaestros(ctx)) return { ok: false, motivo: "SIN_PERMISO" };
    const { cuentas } = cargarMaestros();
    const cuenta = cuentas.find((c) => c.codigo === codigo);
    if (!cuenta) return { ok: false, motivo: "CUENTA_INEXISTENTE" };
    if (cambios.descripcion !== undefined) cuenta.descripcion = cambios.descripcion;
    if (cambios.unidadMedida !== undefined) cuenta.unidadMedida = cambios.unidadMedida;
    if (cambios.activa !== undefined) cuenta.activa = cambios.activa;
    return { ok: true, cuenta };
  },

  async listarFamilias() {
    await latencia();
    return cargarMaestros().familias;
  },

  async listarSucursales() {
    await latencia();
    return cargarMaestros().sucursales.map((s) => s.nombre as Sucursal);
  },
};

// ---------------------------------------------------------------------------
// RepositorioSesion
// ---------------------------------------------------------------------------

export const repositorioSesion: RepositorioSesion = {
  async usuarioActual() {
    return null; // la sesión simulada vive en el cliente (ver componentes/layout/SelectorUsuario)
  },
  async sucursalesPermitidas(ctx) {
    // Sin veTodo() y sin sucursales asignadas (p. ej. ADMIN_MAESTROS, cuyo
    // trabajo es el maestro completo, no presupuestos por sucursal): caer al
    // maestro completo evita dejar al usuario sin ninguna opción elegible en
    // el selector de /contexto, un callejón sin salida real.
    if (veTodo(ctx) || ctx.sucursales.length === 0) {
      return cargarMaestros().sucursales.map((s) => s.nombre as Sucursal);
    }
    return ctx.sucursales;
  },
};
