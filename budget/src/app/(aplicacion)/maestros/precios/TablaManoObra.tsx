"use client";

import { TablaDatos, type ColumnaTabla } from "@/componentes/ui/TablaDatos";
import { Moneda } from "@/componentes/dominio/Moneda";
import type { Sucursal } from "@/dominio/tipos";
import type { ActividadManoObra } from "@/datos/tipos";

const SUCURSALES: { clave: Sucursal; etiqueta: string }[] = [
  { clave: "BARRANQUILLA", etiqueta: "Barranquilla" },
  { clave: "BOGOTA", etiqueta: "Bogotá" },
  { clave: "BUCARAMANGA", etiqueta: "Bucaramanga" },
  { clave: "CALI", etiqueta: "Cali" },
  { clave: "CARTAGENA", etiqueta: "Cartagena" },
  { clave: "RICAURTE", etiqueta: "Ricaurte" },
  { clave: "ZIPAQUIRA", etiqueta: "Zipaquira" },
];

const COLUMNAS: ColumnaTabla<ActividadManoObra>[] = [
  {
    id: "codigo",
    encabezado: "Código",
    valor: (a) => a.codigo,
    celda: (a) => <span className="font-mono">{a.codigo}</span>,
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
  { id: "capitulo", encabezado: "Capítulo", valor: (a) => a.capitulo },
  { id: "familia", encabezado: "Familia", valor: (a) => a.familia },
  { id: "unidad", encabezado: "UM", valor: (a) => a.unidad, filtrable: false },
  ...SUCURSALES.map(
    ({ clave, etiqueta }): ColumnaTabla<ActividadManoObra> => ({
      id: `precio_${clave}`,
      encabezado: etiqueta,
      valor: (a) => (a.precios[clave] ? Number(a.precios[clave]) : null),
      celda: (a) => <Moneda valor={a.precios[clave] ?? null} decimales={2} />,
      alinear: "der",
      cifra: true,
      filtrable: false,
    }),
  ),
];

export function TablaManoObra({ filas }: { filas: ActividadManoObra[] }) {
  const anio = filas[0]?.anio;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] text-tinta-3">
        {filas.length.toLocaleString("es-CO")} actividades no inventariables · precios con IVA
        {anio ? `, año ${anio}` : ""}.
      </p>
      <TablaDatos
        datos={filas}
        columnas={COLUMNAS}
        obtenerId={(a) => a.codigo}
        placeholderBusqueda="Buscar actividad, código, capítulo o familia…"
        seleccionable={false}
      />
    </div>
  );
}
