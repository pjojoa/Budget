"use client";

import { TablaDatos, type ColumnaTabla } from "@/componentes/ui/TablaDatos";
import { CodigoCuenta } from "@/componentes/dominio/CodigoCuenta";
import { Moneda } from "@/componentes/dominio/Moneda";
import { Delta } from "@/componentes/dominio/Delta";
import type { FilaComparacion } from "@/datos/tipos";

const COLUMNAS: ColumnaTabla<FilaComparacion>[] = [
  {
    id: "codigo",
    encabezado: "Código",
    valor: (f) => f.codigo,
    celda: (f) => <CodigoCuenta codigo={f.codigo} />,
  },
  { id: "descripcion", encabezado: "Descripción", valor: (f) => f.descripcion },
  {
    id: "a",
    encabezado: "A",
    valor: (f) => String(f.valorA),
    alinear: "der",
    celda: (f) => <Moneda valor={f.valorA} />,
  },
  {
    id: "b",
    encabezado: "B",
    valor: (f) => String(f.valorB),
    alinear: "der",
    celda: (f) => <Moneda valor={f.valorB} />,
  },
  {
    id: "delta",
    encabezado: "Delta",
    valor: (f) => String(f.delta),
    alinear: "der",
    celda: (f) => <Delta anterior={f.valorA} nuevo={f.valorB} />,
  },
];

export function TablaComparacion({ filas }: { filas: FilaComparacion[] }) {
  return (
    <TablaDatos
      datos={filas}
      columnas={COLUMNAS}
      obtenerId={(f) => f.codigo}
      placeholderBusqueda="Buscar en la comparación…"
    />
  );
}
