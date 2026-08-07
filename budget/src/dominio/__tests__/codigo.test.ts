import { describe, expect, it } from "vitest";
import {
  cadenaPadres,
  claveCatalogo,
  nivelDe,
  normalizaCodigo,
  padreDe,
  plantillaDe,
  tipoRecursoDe,
} from "../codigo";

describe("normalizaCodigo", () => {
  it("agrega ceros a la izquierda a códigos de 7 dígitos", () => {
    expect(normalizaCodigo("1001000")).toBe("01001000");
  });

  it("conserva el código de 8 dígitos", () => {
    expect(normalizaCodigo("02001001")).toBe("02001001");
  });

  it("normaliza el sufijo N10 a 4 dígitos", () => {
    expect(normalizaCodigo("2001001.1002")).toBe("02001001.1002");
    expect(normalizaCodigo("02001001.1")).toBe("02001001.1000");
  });

  it("separa el prefijo de recurso con un solo espacio", () => {
    expect(normalizaCodigo("MO60133")).toBe("MO 60133");
    expect(normalizaCodigo("mo 60133")).toBe("MO 60133");
    expect(normalizaCodigo("TC-01101")).toBe("TC 01101");
  });

  it("elimina el sufijo .0 que deja pandas al leer como número", () => {
    expect(normalizaCodigo("152001.0")).toBe("152001");
  });
});

describe("nivelDe / padreDe — códigos reales de BAIKAL TORRE 3", () => {
  it.each([
    ["02000000", 4, null],
    ["02001000", 5, "02000000"],
    ["02001001", 8, "02001000"],
    ["02001001.1002", 10, "02001001"],
  ])("%s -> nivel %i, padre %s", (codigo, nivelEsperado, padreEsperado) => {
    expect(nivelDe(codigo)).toBe(nivelEsperado);
    expect(padreDe(codigo)).toBe(padreEsperado);
  });

  it("devuelve null para un código malformado", () => {
    expect(nivelDe("TC 2161 60847")).toBeNull();
  });

  it("cadenaPadres sube hasta la raíz", () => {
    expect(cadenaPadres("02001001.1002")).toEqual(["02001001", "02001000", "02000000"]);
  });
});

describe("plantillaDe", () => {
  it("clasifica edificación 01-21", () => {
    expect(plantillaDe("02001001")).toBe("EDIFICACION");
    expect(plantillaDe("21006001")).toBe("EDIFICACION");
  });

  it("clasifica urbanismo interno 22-28 y externo 29-39", () => {
    expect(plantillaDe("25001000")).toBe("URBANISMO_INTERNO");
    expect(plantillaDe("30001000")).toBe("URBANISMO_EXTERNO");
  });

  it("devuelve null fuera de rango, igual que el oráculo Python", () => {
    expect(plantillaDe("45001000")).toBeNull();
  });
});

describe("claveCatalogo / tipoRecursoDe", () => {
  it.each([
    ["152001", "152001", "MAT"],
    ["MO 60133", "60133", "MO"],
    ["TC 01101", "01101", "TC"],
  ])("%s -> clave %s, tipo %s", (codigo, claveEsperada, tipoEsperado) => {
    expect(claveCatalogo(codigo)).toBe(claveEsperada);
    expect(tipoRecursoDe(codigo)).toBe(tipoEsperado);
  });
});
