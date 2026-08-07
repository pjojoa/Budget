"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { TablaDatos, type ColumnaTabla } from "@/componentes/ui/TablaDatos";
import type { Articulo } from "@/datos/tipos";

const COLUMNAS: ColumnaTabla<Articulo>[] = [
  {
    id: "codigo",
    encabezado: "Código",
    valor: (a) => a.codigo,
    celda: (a) => (
      <Link
        href={`/maestros/articulos/${a.codigo}`}
        className="font-mono text-tinta hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {a.codigo}
      </Link>
    ),
  },
  {
    id: "descripcion",
    encabezado: "Descripción",
    valor: (a) => a.descripcion,
    celda: (a) => (
      <span className="text-tinta-2" title={a.descripcion}>
        {a.descripcion}
      </span>
    ),
  },
  { id: "um", encabezado: "UM", valor: (a) => a.unidadMedida },
  { id: "familia", encabezado: "Familia", valor: (a) => a.familiaNombre },
  {
    id: "activo",
    encabezado: "Activo",
    valor: (a) => (a.activo ? "Sí" : "No"),
    celda: (a) =>
      a.activo ? <span className="text-tinta-2">Sí</span> : <span className="text-tinta-3">No</span>,
  },
  {
    id: "sucursales",
    encabezado: "Sucursales c/precio",
    valor: (a) => a.nSucursalesConPrecio,
    alinear: "der",
    cifra: true,
  },
];

interface Props {
  filas: Articulo[];
  acciones?: ReactNode;
  busquedaServidor?: string;
}

export function TablaArticulos({ filas, acciones, busquedaServidor }: Props) {
  return (
    <TablaDatos
      datos={filas}
      columnas={COLUMNAS}
      obtenerId={(a) => a.codigo}
      placeholderBusqueda="Filtrar en esta página…"
      acciones={
        <>
          <form key="busqueda-servidor" method="GET" className="flex items-center gap-2">
            <input
              name="q"
              defaultValue={busquedaServidor}
              placeholder="Buscar en el maestro…"
              className="w-56 rounded-sm border border-hairline bg-panel px-2 py-1.5 text-xs text-tinta outline-none focus:border-foco"
            />
          </form>
          <div key="acciones-servidor" className="contents">
            {acciones}
          </div>
        </>
      }
    />
  );
}
