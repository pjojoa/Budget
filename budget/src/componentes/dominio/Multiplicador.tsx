import { esCero, formatearRendimiento, type Decimal } from "@/dominio/decimal";

interface Props {
  valor: Decimal;
  className?: string;
}

/**
 * La cantidad del N8 es un MULTIPLICADOR, no una cantidad de obra — confundirlos
 * descuadra el presupuesto en silencio. Por eso nunca se muestra como número
 * pelado: siempre "×N", con el "×" fijo. ×0 (anula la rama) se marca en AVISO.
 */
export function Multiplicador({ valor, className = "" }: Props) {
  const cero = esCero(valor);
  return (
    <span
      className={`cifra inline-flex items-center gap-0.5 ${cero ? "text-aviso" : "text-tinta-2"} ${className}`}
      title="Repeticiones: multiplica el importe de toda la rama"
    >
      <span aria-hidden className="text-tinta-3">
        ×
      </span>
      <span className={cero ? "" : "text-tinta"}>{formatearRendimiento(valor, 2)}</span>
    </span>
  );
}
