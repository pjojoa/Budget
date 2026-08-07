import { CERO, comparar, dividir, esCero, formatearCOP, multiplicar, redondear, restar, d, type Decimal } from "@/dominio/decimal";

interface Props {
  anterior: Decimal;
  nuevo: Decimal;
  umbralPct?: number;
  className?: string;
}

/**
 * Un aumento de costo comparte el rojo de ERROR (un sobrecosto ES malo); una
 * disminución va en verde. La flecha va SIEMPRE junto al color — el color
 * nunca es la única señal. Toda la aritmética en Decimal, nunca `Number`.
 */
export function Delta({ anterior, nuevo, umbralPct = 1, className = "" }: Props) {
  const delta = restar(nuevo, anterior);
  if (esCero(delta)) {
    return <span className={`cifra text-tinta-3 ${className}`}>—</span>;
  }
  const sube = comparar(delta, CERO) > 0;
  const pct = esCero(anterior) ? null : redondear(multiplicar(dividir(delta, anterior), d(100)), 2);
  const destacar = pct !== null && Math.abs(Number(pct)) > umbralPct;

  return (
    <span
      className={`cifra inline-flex items-center gap-1 ${sube ? "text-aumento" : "text-disminucion"} ${
        destacar ? "font-medium" : ""
      } ${className}`}
      aria-label={`${sube ? "aumenta" : "disminuye"} ${formatearCOP(delta, 0)}${
        pct !== null ? `, ${Math.abs(Number(pct)).toFixed(2)} por ciento` : ""
      }`}
    >
      <span aria-hidden>{sube ? "▲" : "▼"}</span>
      {formatearCOP(delta, 0)}
      {pct !== null && (
        <span className="text-tinta-2">
          ({sube ? "+" : ""}
          {pct}%)
        </span>
      )}
    </span>
  );
}
