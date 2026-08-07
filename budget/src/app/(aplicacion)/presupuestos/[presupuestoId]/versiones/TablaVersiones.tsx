"use client";

import Link from "next/link";
import { TablaDatos, type ColumnaTabla } from "@/componentes/ui/TablaDatos";
import { InsigniaEstadoPresupuesto } from "@/componentes/dominio/Insignias";
import { Moneda } from "@/componentes/dominio/Moneda";
import type { ResumenPresupuesto } from "@/datos/tipos";

type Fila = ResumenPresupuesto & { esActual: boolean };

function columnas(presupuestoId: string): ColumnaTabla<Fila>[] {
  return [
    {
      id: "version",
      encabezado: "Versión",
      valor: (v) => v.version,
      celda: (v) => <span className="text-tinta">v{v.version}</span>,
    },
    {
      id: "estado",
      encabezado: "Estado",
      valor: (v) => v.estado,
      celda: (v) => <InsigniaEstadoPresupuesto estado={v.estado} />,
    },
    {
      id: "sucursal",
      encabezado: "Sucursal / año",
      valor: (v) => `${v.sucursal} · ${v.anioPrecios}`,
    },
    {
      id: "total",
      encabezado: "Total",
      valor: (v) => String(v.total),
      alinear: "der",
      celda: (v) => <Moneda valor={v.total} />,
    },
    {
      id: "accion",
      encabezado: "",
      valor: () => "",
      filtrable: false,
      ordenable: false,
      celda: (v) =>
        v.esActual ? null : (
          <Link
            href={`/presupuestos/${presupuestoId}/comparar?contra=${v.id}`}
            className="text-[11px] text-tinta-2 hover:text-tinta hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Comparar con esta
          </Link>
        ),
    },
  ];
}

interface Props {
  versiones: ResumenPresupuesto[];
  presupuestoId: string;
}

export function TablaVersiones({ versiones, presupuestoId }: Props) {
  const filas: Fila[] = versiones.map((v) => ({ ...v, esActual: v.id === presupuestoId }));
  return (
    <TablaDatos
      datos={filas}
      columnas={columnas(presupuestoId)}
      obtenerId={(v) => v.id}
      placeholderBusqueda="Buscar versión…"
    />
  );
}
