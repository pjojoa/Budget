"use client";

import { TablaDatos, type ColumnaTabla } from "@/componentes/ui/TablaDatos";
import { Moneda } from "@/componentes/dominio/Moneda";
import { formatearRendimiento } from "@/dominio/decimal";
import type { FilaExplosion } from "@/dominio/tipos";

type Fila = FilaExplosion & { indice: number };

function columnas(corteParetoIndice: number): ColumnaTabla<Fila>[] {
  return [
    {
      id: "codigo",
      encabezado: "Código",
      valor: (f) => f.codigo,
      celda: (f) => <span className="font-mono text-tinta">{f.codigo}</span>,
    },
    {
      id: "descripcion",
      encabezado: "Descripción",
      valor: (f) => f.descripcion,
      celda: (f) => (
        <span className="text-tinta-2" title={f.descripcion}>
          {f.descripcion}
        </span>
      ),
    },
    { id: "um", encabezado: "UM", valor: (f) => f.unidad },
    {
      id: "cantidad",
      encabezado: "Cantidad",
      valor: (f) => formatearRendimiento(f.cantidad, 2),
      alinear: "der",
      cifra: true,
    },
    {
      id: "importe",
      encabezado: "Importe",
      valor: (f) => String(f.importe),
      alinear: "der",
      celda: (f) => <Moneda valor={f.importe} />,
    },
    {
      id: "pct",
      encabezado: "%",
      valor: (f) => String(f.incidenciaPct),
      alinear: "der",
      cifra: true,
      celda: (f) => (
        <span className={f.indice < corteParetoIndice ? "text-tinta" : "text-tinta-2"}>{String(f.incidenciaPct)}</span>
      ),
    },
    {
      id: "acum",
      encabezado: "Acum.%",
      valor: (f) => String(f.acumuladoPct),
      alinear: "der",
      cifra: true,
    },
  ];
}

interface Props {
  filas: FilaExplosion[];
  corteParetoIndice: number;
}

export function TablaExplosion({ filas, corteParetoIndice }: Props) {
  const datos: Fila[] = filas.map((f, indice) => ({ ...f, indice }));
  return (
    <TablaDatos
      datos={datos}
      columnas={columnas(corteParetoIndice)}
      obtenerId={(f) => f.codigo}
      placeholderBusqueda="Buscar insumo…"
      claseFila={(f) =>
        f.indice === corteParetoIndice - 1 ? "[&>td]:border-b-2 [&>td]:border-b-tinta" : undefined
      }
    />
  );
}
