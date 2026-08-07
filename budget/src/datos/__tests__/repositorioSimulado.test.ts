import { describe, expect, it, vi } from "vitest";
import type { ContextoAcceso } from "../contexto";
import { comparar, d } from "@/dominio/decimal";

const PRESUPUESTADOR_CALI: ContextoAcceso = {
  usuarioId: "u-presupuestador-cali",
  nombre: "Presupuestador Cali",
  roles: ["PRESUPUESTADOR"],
  sucursales: ["CALI"],
};
const PRESUPUESTADOR_BOGOTA: ContextoAcceso = {
  usuarioId: "u-presupuestador-bogota",
  nombre: "Presupuestador Bogotá",
  roles: ["PRESUPUESTADOR"],
  sucursales: ["BOGOTA"],
};

// Cada archivo de test obtiene su propio módulo (el almacén es un singleton
// de módulo) — reimportamos con reset para no filtrar estado entre bloques.
async function importarRepositorio() {
  vi.resetModules();
  return await import("../simulado/repositorioSimulado");
}

describe("repositorioSimulado", () => {
  it("lista solo los presupuestos de la sucursal del usuario", async () => {
    const { repositorioPresupuestos } = await importarRepositorio();
    const pagina = await repositorioPresupuestos.listar(PRESUPUESTADOR_BOGOTA, {});
    expect(pagina.filas.every((f) => f.sucursal === "BOGOTA")).toBe(true);
    // BAIKAL V01 es de CALI: un presupuestador de Bogotá no debe verlo.
    expect(pagina.filas.find((f) => f.id === "baikal-t3-v01")).toBeUndefined();
  });

  it("obtenerCabecera devuelve null si el usuario no tiene acceso a la sucursal", async () => {
    const { repositorioPresupuestos } = await importarRepositorio();
    const cab = await repositorioPresupuestos.obtenerCabecera(PRESUPUESTADOR_BOGOTA, "baikal-t3-v01");
    expect(cab).toBeNull();
  });

  it("obtenerCabecera trae el total exacto y los hallazgos abiertos correctos", async () => {
    const { repositorioPresupuestos } = await importarRepositorio();
    const cab = await repositorioPresupuestos.obtenerCabecera(PRESUPUESTADOR_CALI, "baikal-t3-v01");
    expect(cab).not.toBeNull();
    expect(comparar(cab!.total, d("28399232614.23"))).toBe(0);
    expect(cab!.nHallazgosAbiertos.error).toBe(2);
  });

  it("obtenerArbol no expone insumos (se piden aparte por línea)", async () => {
    const { repositorioPresupuestos } = await importarRepositorio();
    const res = await repositorioPresupuestos.obtenerArbol(PRESUPUESTADOR_CALI, "baikal-t3-v01");
    expect(res).not.toBeNull();
    expect(res!.lineas.length).toBe(387);
    expect(res!.lineas.every((l) => l.insumos === undefined)).toBe(true);
  });

  it("obtenerApu devuelve los insumos de una línea N10 concreta", async () => {
    const { repositorioPresupuestos } = await importarRepositorio();
    const insumos = await repositorioPresupuestos.obtenerApu(PRESUPUESTADOR_CALI, "baikal-t3-v01", "01001001.1002");
    expect(insumos.length).toBeGreaterThan(0);
  });

  it("guardarCambios rechaza edición sobre un presupuesto APROBADO", async () => {
    const { repositorioPresupuestos } = await importarRepositorio();
    const arbol = await repositorioPresupuestos.obtenerArbol(PRESUPUESTADOR_CALI, "baikal-t3-v01");
    const resultado = await repositorioPresupuestos.guardarCambios(PRESUPUESTADOR_CALI, "baikal-t3-v01", {
      marcaVersion: arbol!.marcaVersion,
      cambios: [{ op: "actualizar_cantidad", codigo: "01001001.1002", cantidad: d("999") }],
    });
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.motivo).toBe("PRESUPUESTO_INMUTABLE");
  });

  it("guardarCambios recalcula la cascada sobre un BORRADOR y sube la marcaVersion", async () => {
    const { repositorioPresupuestos } = await importarRepositorio();
    // v02 (Bogotá 2027) se crea en estado BORRADOR en el mock.
    const cab = await repositorioPresupuestos.obtenerCabecera(PRESUPUESTADOR_BOGOTA, "baikal-t3-v02-bogota-2027");
    expect(cab!.estado).toBe("BORRADOR");

    const arbol = await repositorioPresupuestos.obtenerArbol(PRESUPUESTADOR_BOGOTA, "baikal-t3-v02-bogota-2027");
    const totalAntes = cab!.total;

    const resultado = await repositorioPresupuestos.guardarCambios(PRESUPUESTADOR_BOGOTA, "baikal-t3-v02-bogota-2027", {
      marcaVersion: arbol!.marcaVersion,
      cambios: [{ op: "actualizar_cantidad", codigo: "01001001.1002", cantidad: d("2") }],
    });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.marcaVersion).not.toBe(arbol!.marcaVersion);
      expect(comparar(resultado.total, totalAntes)).not.toBe(0);
    }
  });

  it("guardarCambios rechaza una marcaVersion vencida (conflicto optimista)", async () => {
    const { repositorioPresupuestos } = await importarRepositorio();
    const resultado = await repositorioPresupuestos.guardarCambios(PRESUPUESTADOR_BOGOTA, "baikal-t3-v02-bogota-2027", {
      marcaVersion: "999",
      cambios: [{ op: "actualizar_cantidad", codigo: "01001001.1002", cantidad: d("3") }],
    });
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.motivo).toBe("CONFLICTO_VERSION");
  });

  it("los 2 hallazgos ERROR reales de BAIKAL siguen ahí (bloquearían la aprobación)", async () => {
    const { repositorioAnalisis } = await importarRepositorio();
    const hallazgosV01 = await repositorioAnalisis.hallazgos(PRESUPUESTADOR_CALI, "baikal-t3-v01");
    expect(hallazgosV01.filter((h) => h.severidad === "ERROR").length).toBe(2);
  });

  it("explosionDeInsumos vía repositorio reproduce el corte de Pareto dorado", async () => {
    const { repositorioAnalisis } = await importarRepositorio();
    const { filas, corteParetoIndice } = await repositorioAnalisis.explosion(PRESUPUESTADOR_CALI, "baikal-t3-v01", {});
    expect(filas.length).toBe(446);
    expect(corteParetoIndice).toBe(66);
  });

  it("resolverPrecio encuentra un precio real de catálogo", async () => {
    const { repositorioMaestros } = await importarRepositorio();
    const resuelto = await repositorioMaestros.resolverPrecio(PRESUPUESTADOR_CALI, "61001", "BUCARAMANGA", 2025);
    expect(resuelto).not.toBeNull();
    expect(resuelto!.origen).toBe("CATALOGO");
  });

  it("buscarArticulos pagina y nunca devuelve todo el maestro de una vez", async () => {
    const { repositorioMaestros } = await importarRepositorio();
    const pagina = await repositorioMaestros.buscarArticulos(PRESUPUESTADOR_CALI, { porPagina: 25 });
    expect(pagina.filas.length).toBe(25);
    expect(pagina.total).toBeGreaterThan(20000);
  });
});
