"use client";

import { useMemo, type ReactNode } from "react";
import { TablaDatos, type ColumnaTabla } from "@/componentes/ui/TablaDatos";
import { Moneda } from "@/componentes/dominio/Moneda";
import type { Sucursal } from "@/dominio/tipos";
import type { AnioCatalogoMaterial, MaterialCatalogo } from "@/datos/tipos";

const SUCURSALES: { clave: Sucursal; etiqueta: string }[] = [
  { clave: "BARRANQUILLA", etiqueta: "Barranquilla" },
  { clave: "BOGOTA", etiqueta: "Bogotá" },
  { clave: "BUCARAMANGA", etiqueta: "Bucaramanga" },
  { clave: "CALI", etiqueta: "Cali" },
  { clave: "CARTAGENA", etiqueta: "Cartagena" },
  { clave: "SANTA_MARTA", etiqueta: "Santa Marta" },
  { clave: "ZIPAQUIRA", etiqueta: "Zipaquira" },
];

interface Props {
  filas: MaterialCatalogo[];
  acciones?: ReactNode;
  anio: AnioCatalogoMaterial;
}

export function TablaMateriales({ filas, acciones, anio }: Props) {
  const columnas = useMemo<ColumnaTabla<MaterialCatalogo>[]>(
    () => [
      {
        id: "codigo",
        encabezado: "Código",
        valor: (m) => m.codigo,
        celda: (m) => <span className="font-mono">{m.codigo}</span>,
      },
      {
        id: "descripcion",
        encabezado: "Descripción",
        valor: (m) => m.descripcion,
        celda: (m) => (
          <span className="text-tinta-2" title={m.descripcion}>
            {m.descripcion}
          </span>
        ),
      },
      { id: "familia", encabezado: "Familia", valor: (m) => m.familiaNombre },
      { id: "unidad", encabezado: "UM", valor: (m) => m.unidad },
      {
        id: "estado",
        encabezado: "Estado",
        valor: (m) => (m.estado === "CADUCADO" ? "Caducado" : "Existente"),
        celda: (m) =>
          m.estado === "CADUCADO" ? (
            <span className="text-error">Caducado</span>
          ) : (
            <span className="text-tinta-2">Existente</span>
          ),
      },
      ...SUCURSALES.map(
        ({ clave, etiqueta }): ColumnaTabla<MaterialCatalogo> => ({
          id: `precio_${clave}`,
          encabezado: etiqueta,
          valor: (m) => {
            const p = m.precios[clave]?.[anio];
            return p ? Number(p) : null;
          },
          celda: (m) => <Moneda valor={m.precios[clave]?.[anio] ?? null} decimales={2} />,
          alinear: "der",
          cifra: true,
          filtrable: false,
        }),
      ),
    ],
    [anio],
  );

  return (
    <TablaDatos
      datos={filas}
      columnas={columnas}
      obtenerId={(m) => m.codigo}
      mostrarBusqueda={false}
      seleccionable={false}
      claseTabla="max-w-none"
      acciones={acciones}
      vacio="Sin materiales para este filtro."
    />
  );
}
