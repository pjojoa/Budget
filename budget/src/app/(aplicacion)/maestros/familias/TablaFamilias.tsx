"use client";

import { TablaDatos, type ColumnaTabla } from "@/componentes/ui/TablaDatos";
import type { Familia } from "@/datos/tipos";

const COLUMNAS: ColumnaTabla<Familia>[] = [
  { id: "codigo", encabezado: "Código", valor: (f) => f.codigo, celda: (f) => <span className="font-mono">{f.codigo}</span> },
  { id: "nombre", encabezado: "Nombre", valor: (f) => f.nombre },
  {
    id: "tipo",
    encabezado: "Tipo",
    valor: (f) => f.tipo,
    celda: (f) => (f.tipo ? f.tipo : <span className="text-tinta-3">—</span>),
  },
  {
    id: "n",
    encabezado: "Artículos",
    valor: (f) => f.nArticulos,
    alinear: "der",
    cifra: true,
  },
];

export function TablaFamilias({ filas }: { filas: Familia[] }) {
  return (
    <TablaDatos
      datos={filas}
      columnas={COLUMNAS}
      obtenerId={(f) => f.codigo}
      placeholderBusqueda="Buscar familia…"
      claseTabla="max-w-2xl"
    />
  );
}
