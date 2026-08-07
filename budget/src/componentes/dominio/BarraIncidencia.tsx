import type { Decimal } from "@/dominio/decimal";

interface Props {
  pct: Decimal;
  destacada?: boolean;
  className?: string;
}

/**
 * Barra de incidencia dentro de la celda, sin color: la jerarquía se comunica
 * con contraste (tinta principal para lo que importa, tinta-3 para el resto),
 * no con una paleta — el color se reserva a señales de atención.
 */
export function BarraIncidencia({ pct, destacada = false, className = "" }: Props) {
  const ancho = Math.min(100, Math.max(0, Number(pct)));
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-1 flex-1 overflow-hidden rounded-none bg-hairline">
        <div
          className={`h-full ${destacada ? "bg-tinta" : "bg-tinta-3"}`}
          style={{ width: `${ancho}%` }}
        />
      </div>
      <span className="cifra w-12 shrink-0 text-tinta-2">{ancho.toFixed(2)}%</span>
    </div>
  );
}
