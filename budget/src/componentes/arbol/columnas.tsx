import "@tanstack/react-table";
import type { ColumnDef, TableMeta } from "@tanstack/react-table";
import type { LineaNodo } from "./useModeloArbol";
import { CodigoCuenta } from "@/componentes/dominio/CodigoCuenta";
import { RailIndentacion } from "@/componentes/dominio/RailIndentacion";
import { Moneda } from "@/componentes/dominio/Moneda";
import { Multiplicador } from "@/componentes/dominio/Multiplicador";
import { BarraIncidencia } from "@/componentes/dominio/BarraIncidencia";
import { CeldaEditorCantidad } from "./CeldaEditorCantidad";
import { formatearRendimiento } from "@/dominio/decimal";
import { ANCHO_COLUMNA, type ColumnaEditable } from "./tiposColumnas";

export type { ColumnaEditable } from "./tiposColumnas";
export { ANCHO_COLUMNA, ALTURA_FILA, ORDEN_COLUMNAS, PRIORIDAD_COLUMNA } from "./tiposColumnas";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- TData es parte de la firma que se amplía, no se usa en el cuerpo
  interface TableMeta<TData> {
    codigoActivo: string | null;
    columnaActiva: string;
    modo: "navegacion" | "edicion";
    codigosConCambios: Set<string>;
    editable: boolean;
    onClicCelda: (codigo: string, columna: string) => void;
    onIniciarEdicion: (codigo: string, columna: ColumnaEditable, valorInicial?: string) => void;
    onConfirmarEdicion: (texto: string) => void;
    onCancelarEdicion: () => void;
    valorEdicionInicial: string;
  }
}

const CLASE_DESCRIPCION: Record<LineaNodo["nivel"], string> = {
  4: "font-condensada uppercase text-tinta",
  5: "font-condensada text-tinta",
  8: "text-tinta",
  10: "text-tinta-2",
};

function estaEnEdicion(
  meta: TableMeta<LineaNodo> | undefined,
  codigo: string,
  columna: string,
): boolean {
  return meta?.modo === "edicion" && meta.codigoActivo === codigo && meta.columnaActiva === columna;
}

export const columnas: ColumnDef<LineaNodo>[] = [
  {
    id: "codigo",
    header: "Código",
    accessorKey: "codigo",
    size: ANCHO_COLUMNA.codigo,
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <RailIndentacion nivel={row.original.nivel} />
        {row.getCanExpand() ? (
          <button
            type="button"
            onClick={row.getToggleExpandedHandler()}
            aria-label={row.getIsExpanded() ? "Colapsar" : "Expandir"}
            aria-expanded={row.getIsExpanded()}
            className="flex h-4 w-4 shrink-0 items-center justify-center text-tinta-3 hover:text-tinta"
            tabIndex={-1}
          >
            <span aria-hidden>{row.getIsExpanded() ? "▾" : "▸"}</span>
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <CodigoCuenta codigo={row.original.codigo} />
      </div>
    ),
  },
  {
    id: "descripcion",
    header: "Descripción",
    accessorKey: "descripcion",
    cell: ({ row }) => (
      <span className={`truncate ${CLASE_DESCRIPCION[row.original.nivel]}`} title={row.original.descripcion}>
        {row.original.descripcion}
      </span>
    ),
  },
  {
    id: "unidad",
    header: "UM",
    accessorKey: "unidad",
    size: ANCHO_COLUMNA.unidad,
    cell: ({ row }) => <span className="text-tinta-3">{row.original.nivel === 10 ? row.original.unidad : ""}</span>,
  },
  {
    id: "cantidad",
    header: "Cantidad",
    accessorKey: "cantidad",
    size: ANCHO_COLUMNA.cantidad,
    cell: ({ row, table }) => {
      const meta = table.options.meta;
      const codigo = row.original.codigo;
      if (row.original.nivel !== 10) return <span className="cifra text-tinta-3">·</span>;
      if (meta && estaEnEdicion(meta, codigo, "cantidad")) {
        return (
          <CeldaEditorCantidad
            valorInicial={meta.valorEdicionInicial}
            onConfirmar={meta.onConfirmarEdicion}
            onCancelar={meta.onCancelarEdicion}
          />
        );
      }
      return (
        <span
          className={`cifra text-tinta ${meta?.editable ? "cursor-text" : ""}`}
          onDoubleClick={() => meta?.editable && meta.onIniciarEdicion(codigo, "cantidad")}
        >
          {formatearRendimiento(row.original.cantidad, 2)}
        </span>
      );
    },
  },
  {
    id: "repeticiones",
    header: "Repet.",
    size: ANCHO_COLUMNA.repeticiones,
    cell: ({ row, table }) => {
      const meta = table.options.meta;
      const codigo = row.original.codigo;
      if (row.original.nivel === 10) return <span className="cifra text-tinta-3">·</span>;
      if (meta && estaEnEdicion(meta, codigo, "repeticiones")) {
        return (
          <CeldaEditorCantidad
            prefijoFijo="×"
            valorInicial={meta.valorEdicionInicial}
            onConfirmar={meta.onConfirmarEdicion}
            onCancelar={meta.onCancelarEdicion}
          />
        );
      }
      return (
        <span onDoubleClick={() => meta?.editable && meta.onIniciarEdicion(codigo, "repeticiones")}>
          <Multiplicador valor={row.original.cantidad} />
        </span>
      );
    },
  },
  {
    id: "valorTotal",
    header: "Valor total",
    accessorKey: "valorTotal",
    size: ANCHO_COLUMNA.valorTotal,
    cell: ({ row, table }) => (
      <Moneda valor={row.original.valorTotal} provisional={table.options.meta?.codigosConCambios.has(row.original.codigo)} />
    ),
  },
  {
    id: "incidencia",
    header: "Incidencia",
    accessorKey: "incidenciaPct",
    size: ANCHO_COLUMNA.incidencia,
    cell: ({ row }) => <BarraIncidencia pct={row.original.incidenciaPct} destacada={row.original.nivel === 4} />,
  },
];
