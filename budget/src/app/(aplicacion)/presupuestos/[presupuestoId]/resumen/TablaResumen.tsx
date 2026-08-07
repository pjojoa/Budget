"use client";

import { TablaDatos, type ColumnaTabla } from "@/componentes/ui/TablaDatos";
import { CodigoCuenta } from "@/componentes/dominio/CodigoCuenta";
import { Moneda } from "@/componentes/dominio/Moneda";
import { BarraIncidencia } from "@/componentes/dominio/BarraIncidencia";
import { comparar } from "@/dominio/decimal";
import type { FilaResumen } from "@/datos/tipos";

const COLUMNAS: ColumnaTabla<FilaResumen>[] = [
  {
    id: "codigo",
    encabezado: "Capítulo",
    valor: (f) => f.codigo,
    celda: (f) => <CodigoCuenta codigo={f.codigo} />,
  },
  {
    id: "descripcion",
    encabezado: "Descripción",
    valor: (f) => f.descripcion,
    celda: (f) => <span className="font-condensada uppercase text-tinta">{f.descripcion}</span>,
  },
  {
    id: "total",
    encabezado: "Valor total",
    valor: (f) => String(f.valorTotal),
    alinear: "der",
    celda: (f) => <Moneda valor={f.valorTotal} />,
  },
  {
    id: "incidencia",
    encabezado: "Incidencia",
    valor: (f) => String(f.incidenciaPct),
    celda: (f) => (
      <div style={{ width: 160 }}>
        <BarraIncidencia pct={f.incidenciaPct} destacada />
      </div>
    ),
  },
  {
    id: "m2",
    encabezado: "$/m²",
    valor: (f) => String(f.valorM2),
    alinear: "der",
    celda: (f) => <Moneda valor={f.valorM2} decimales={2} />,
  },
];

export function TablaResumen({ filas }: { filas: FilaResumen[] }) {
  const ordenadas = [...filas].sort((a, b) => comparar(b.valorTotal, a.valorTotal));
  return (
    <TablaDatos
      datos={ordenadas}
      columnas={COLUMNAS}
      obtenerId={(f) => f.codigo}
      placeholderBusqueda="Buscar capítulo…"
    />
  );
}
