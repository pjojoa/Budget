import { describe, expect, it } from "vitest";
import { parsearTsv } from "../portapapeles";

describe("parsearTsv", () => {
  it("separa filas y columnas simples", () => {
    expect(parsearTsv("220\t1\n400\t2")).toEqual([
      ["220", "1"],
      ["400", "2"],
    ]);
  });

  it("descarta el salto de línea final típico al copiar de Excel", () => {
    expect(parsearTsv("220\t1\n400\t2\n")).toEqual([
      ["220", "1"],
      ["400", "2"],
    ]);
  });

  it("respeta una celda entrecomillada con tabulador interno", () => {
    expect(parsearTsv('"CIM\tEXC A MANO"\t220')).toEqual([["CIM\tEXC A MANO", "220"]]);
  });

  it("respeta una celda entrecomillada con salto de línea interno", () => {
    expect(parsearTsv('"línea 1\nlínea 2"\t220')).toEqual([["línea 1\nlínea 2", "220"]]);
  });

  it("desescapa comillas dobles internas (\"\" -> \")", () => {
    expect(parsearTsv('"CIMEN 2,5""m"\t220')).toEqual([['CIMEN 2,5"m', "220"]]);
  });

  it("una sola celda sin tabuladores ni comillas", () => {
    expect(parsearTsv("500")).toEqual([["500"]]);
  });

  it("celdas vacías se conservan como cadena vacía", () => {
    expect(parsearTsv("220\t\t3")).toEqual([["220", "", "3"]]);
  });
});
