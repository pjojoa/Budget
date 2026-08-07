import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface DatosNodoEntidad {
  nombre: string;
  origen: string;
  campos: string[];
  autoRelacion?: string;
  suelta?: boolean;
  [key: string]: unknown;
}

export function NodoEntidad({ data }: NodeProps & { data: DatosNodoEntidad }) {
  return (
    <div
      className={`w-56 rounded-sm border bg-panel p-2.5 shadow-md ${
        data.suelta ? "border-dashed border-hairline" : "border-hairline"
      }`}
    >
      {/* Sin conexiones editables (nodesConnectable=false): pointer-events-none
          para que nunca compitan con el arrastre de la tarjeta. */}
      <Handle type="target" position={Position.Left} className="!pointer-events-none !bg-tinta-3" />
      <Handle type="source" position={Position.Right} className="!pointer-events-none !bg-tinta-3" />
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="font-condensada text-[11px] font-semibold uppercase tracking-wide text-tinta">
          {data.nombre}
        </span>
        <span className="font-mono text-[9px] text-tinta-3">{data.origen}</span>
      </div>
      <ul className="space-y-0.5 font-mono text-[10px] leading-snug text-tinta-2">
        {data.campos.map((c) => (
          <li key={c} className="truncate" title={c}>
            {c}
          </li>
        ))}
      </ul>
      {data.autoRelacion && (
        <p className="mt-1.5 border-t border-hairline pt-1 text-[10px] text-tinta-3">↻ {data.autoRelacion}</p>
      )}
      {data.suelta && <p className="mt-1.5 border-t border-hairline pt-1 text-[10px] text-tinta-3">Sin relaciones — no persiste</p>}
    </div>
  );
}
