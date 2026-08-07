"use client";

import Link from "next/link";
import { TablaDatos, type ColumnaTabla } from "@/componentes/ui/TablaDatos";
import { Moneda } from "@/componentes/dominio/Moneda";
import { InsigniaEstadoPresupuesto } from "@/componentes/dominio/Insignias";
import type { ResumenPresupuesto } from "@/datos/tipos";

const COLUMNAS: ColumnaTabla<ResumenPresupuesto>[] = [
  {
    id: "proyecto",
    encabezado: "Proyecto",
    valor: (f) => f.proyecto,
    celda: (f) => (
      <Link
        href={`/presupuestos/${f.id}/arbol`}
        className="text-tinta hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {f.proyecto}
      </Link>
    ),
  },
  { id: "version", encabezado: "Versión", valor: (f) => f.version },
  {
    id: "estado",
    encabezado: "Estado",
    valor: (f) => f.estado,
    celda: (f) => <InsigniaEstadoPresupuesto estado={f.estado} />,
  },
  { id: "sucursal", encabezado: "Sucursal", valor: (f) => f.sucursal },
  { id: "anio", encabezado: "Año", valor: (f) => f.anioPrecios, alinear: "der", cifra: true },
  {
    id: "total",
    encabezado: "Total",
    valor: (f) => f.total,
    alinear: "der",
    celda: (f) => <Moneda valor={f.total} />,
  },
  {
    id: "m2",
    encabezado: "$/m²",
    valor: (f) => f.valorM2,
    alinear: "der",
    celda: (f) => <Moneda valor={f.valorM2} decimales={0} />,
  },
];

export function TablaPresupuestos({ filas }: { filas: ResumenPresupuesto[] }) {
  return (
    <TablaDatos
      datos={filas}
      columnas={COLUMNAS}
      obtenerId={(f) => f.id}
      placeholderBusqueda="Buscar presupuesto…"
    />
  );
}
