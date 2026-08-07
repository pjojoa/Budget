import { formatearCOP, type Decimal } from "@/dominio/decimal";

interface Props {
  valor: Decimal | null;
  decimales?: 0 | 2;
  conSimbolo?: boolean;
  provisional?: boolean;
  className?: string;
}

/**
 * Única forma autorizada de mostrar dinero. La API no acepta `number` — así
 * es imposible que alguien redondee antes de presentar. `null` -> "—", nunca
 * "0" (un insumo sin precio no vale 0, vale "sin dato").
 */
export function Moneda({ valor, decimales = 0, conSimbolo = false, provisional = false, className = "" }: Props) {
  const texto = valor === null ? "—" : formatearCOP(valor, decimales);
  return (
    <span
      className={`cifra ${provisional ? "text-tinta-2 underline decoration-dotted underline-offset-2" : "text-tinta"} ${className}`}
    >
      {conSimbolo && valor !== null ? "$ " : ""}
      {texto}
    </span>
  );
}
