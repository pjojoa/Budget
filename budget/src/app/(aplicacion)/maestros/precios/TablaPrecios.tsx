"use client";

import { useState } from "react";
import { Boton } from "@/componentes/ui/Boton";
import { CeldaEditorTexto } from "@/componentes/ui/CeldaEditorTexto";
import { Moneda } from "@/componentes/dominio/Moneda";
import { BadgeOrigenPrecio } from "@/componentes/dominio/Insignias";
import { eliminarPrecioManualAccion, fijarPrecioManualAccion } from "@/datos/simulado/accionesMaestros";
import { d } from "@/dominio/decimal";
import type { Sucursal } from "@/dominio/tipos";
import type { PrecioResuelto } from "@/datos/tipos";

const MOTIVOS: Record<string, string> = {
  SIN_PERMISO: "No tiene permiso para editar precios.",
  ARTICULO_INEXISTENTE: "Ese código de artículo no existe en el maestro.",
  VALOR_INVALIDO: "El precio debe ser un número mayor que cero.",
  PRECIO_INEXISTENTE: "No hay un precio manual fijado para esa sucursal.",
};

interface Props {
  codigo: string;
  anio: number;
  editable: boolean;
  filas: { sucursal: Sucursal; resuelto: PrecioResuelto | null }[];
}

export function TablaPrecios({ codigo, anio, editable, filas }: Props) {
  const [precios, setPrecios] = useState(filas);
  const [sucursalEnEdicion, setSucursalEnEdicion] = useState<Sucursal | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function fijarPrecio(sucursal: Sucursal, texto: string) {
    let precio;
    try {
      precio = d(texto);
    } catch {
      setMensaje(MOTIVOS.VALOR_INVALIDO);
      return;
    }
    setSucursalEnEdicion(null);
    const resultado = await fijarPrecioManualAccion({ articulo: codigo, sucursal, anio, precio });
    if (resultado.ok) {
      setPrecios((prev) =>
        prev.map((p) => (p.sucursal === sucursal ? { ...p, resuelto: { precio, origen: "MANUAL" } } : p)),
      );
    } else {
      setMensaje(MOTIVOS[resultado.motivo] ?? "No se pudo fijar el precio manual.");
    }
  }

  async function quitar(sucursal: Sucursal) {
    const resultado = await eliminarPrecioManualAccion(codigo, sucursal, anio);
    if (resultado.ok) {
      setPrecios((prev) =>
        prev.map((p) => (p.sucursal === sucursal ? { ...p, resuelto: { precio: d(0), origen: "SIN_PRECIO" } } : p)),
      );
    } else {
      setMensaje(MOTIVOS[resultado.motivo] ?? "No se pudo quitar el precio manual.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {mensaje && <span className="text-[11px] text-error">{mensaje}</span>}
      <table className="tabla max-w-md">
        <thead>
          <tr>
            <th>Sucursal</th>
            <th data-alinear="der">Precio</th>
            <th>Origen</th>
            {editable && <th />}
          </tr>
        </thead>
        <tbody>
          {precios.map(({ sucursal, resuelto }) => (
            <tr key={sucursal}>
              <td className="text-tinta-2">{sucursal}</td>
              <td data-alinear="der">
                {sucursalEnEdicion === sucursal ? (
                  <CeldaEditorTexto
                    valorInicial={resuelto?.origen === "SIN_PRECIO" ? "" : (resuelto?.precio ?? "")}
                    onConfirmar={(v) => fijarPrecio(sucursal, v)}
                    onCancelar={() => setSucursalEnEdicion(null)}
                  />
                ) : (
                  <span
                    className={editable ? "cursor-text hover:underline" : ""}
                    onClick={() => editable && setSucursalEnEdicion(sucursal)}
                  >
                    <Moneda valor={resuelto?.origen === "SIN_PRECIO" ? null : (resuelto?.precio ?? null)} decimales={2} />
                  </span>
                )}
              </td>
              <td>
                <BadgeOrigenPrecio origen={resuelto?.origen ?? "SIN_PRECIO"} />
              </td>
              {editable && (
                <td data-alinear="der">
                  {resuelto?.origen === "MANUAL" && (
                    <Boton variante="fantasma" tamano="sm" onClick={() => quitar(sucursal)}>
                      Quitar
                    </Boton>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
