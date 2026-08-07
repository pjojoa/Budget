import { describe, expect, it } from "vitest";
import { parsearNumeroColombiano } from "../numeroColombiano";

describe("parsearNumeroColombiano", () => {
  it.each([
    ["1.234.567,89", "1234567.89"],
    ["1234567,89", "1234567.89"],
    ["220", "220"],
    ["1.007", "1.007"], // ambiguo: un solo punto se toma como decimal (es-CO)
    ["1,007", "1.007"],
    ["1,234.56", "1234.56"], // formato en-US (coma miles, punto decimal)
    ["$ 1.234.567", "1234567"],
    ["-45,5", "-45.5"],
  ])("%s -> %s", (entrada, esperado) => {
    expect(parsearNumeroColombiano(entrada)).toBe(esperado);
  });

  it.each(["", "  ", "abc", "12.34.56,78,90", "N/A"])("%s -> null", (entrada) => {
    expect(parsearNumeroColombiano(entrada)).toBeNull();
  });
});
