import type { EstadoPresupuesto, OrigenPrecio, Severidad } from "@/dominio/tipos";

const BASE = "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-condensada text-[11px] uppercase tracking-wide";

/**
 * CATALOGO no lleva color: es lo normal, y en esta app el color solo existe
 * cuando significa algo. MANUAL/SUCURSAL_REFERENCIA/SIN_PRECIO sí necesitan
 * atención del presupuestador.
 */
export function BadgeOrigenPrecio({ origen }: { origen: OrigenPrecio }) {
  const mapa: Record<OrigenPrecio, { texto: string; clase: string }> = {
    CATALOGO: { texto: "Catálogo", clase: "text-tinta-3" },
    MANUAL: { texto: "Manual", clase: "text-tinta border border-hairline" },
    SUCURSAL_REFERENCIA: { texto: "Sucursal ref.", clase: "text-aviso border border-aviso/40" },
    SIN_PRECIO: { texto: "Sin precio", clase: "text-error border border-error/40" },
  };
  const { texto, clase } = mapa[origen];
  return <span className={`${BASE} ${clase}`}>{texto}</span>;
}

export function BadgeSeveridad({ severidad, title }: { severidad: Severidad; title?: string }) {
  const mapa: Record<Severidad, { texto: string; clase: string }> = {
    ERROR: { texto: "Error", clase: "bg-error/15 text-error" },
    AVISO: { texto: "Aviso", clase: "bg-aviso/15 text-aviso" },
    INFO: { texto: "Info", clase: "text-tinta-3" },
  };
  const { texto, clase } = mapa[severidad];
  return (
    <span className={`${BASE} ${clase}`} title={title}>
      {texto}
    </span>
  );
}

/**
 * APROBADO deliberadamente SIN color: no requiere atención, requiere lectura
 * (y el verde queda reservado a "el costo bajó"). EN_REVISION sí es AVISO —
 * alguien debe actuar.
 */
export function InsigniaEstadoPresupuesto({ estado }: { estado: EstadoPresupuesto }) {
  const mapa: Record<EstadoPresupuesto, { texto: string; clase: string }> = {
    BORRADOR: { texto: "Borrador", clase: "text-tinta-2 border border-dashed border-hairline" },
    EN_REVISION: { texto: "En revisión", clase: "bg-aviso/15 text-aviso" },
    APROBADO: { texto: "Aprobado", clase: "text-tinta border border-hairline" },
    SUPERSEDIDO: { texto: "Supersedido", clase: "text-tinta-3 line-through" },
  };
  const { texto, clase } = mapa[estado];
  return <span className={`${BASE} ${clase}`}>{texto}</span>;
}
