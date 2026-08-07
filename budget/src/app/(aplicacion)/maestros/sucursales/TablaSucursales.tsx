"use client";

import { useState } from "react";
import { Boton } from "@/componentes/ui/Boton";
import { actualizarSucursalAccion } from "@/datos/simulado/accionesMaestros";
import type { SucursalCatalogo } from "@/datos/tipos";

const MOTIVOS: Record<string, string> = {
  SIN_PERMISO: "No tiene permiso para editar el maestro de sucursales.",
  SUCURSAL_INEXISTENTE: "La sucursal ya no existe.",
};

interface Props {
  filas: SucursalCatalogo[];
  editable: boolean;
}

export function TablaSucursales({ filas, editable }: Props) {
  const [sucursalesLocal, setSucursalesLocal] = useState(filas);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function alternar(codigo: string, activa: boolean) {
    setMensaje(null);
    setSucursalesLocal((prev) => prev.map((s) => (s.codigo === codigo ? { ...s, activa } : s)));
    const resultado = await actualizarSucursalAccion(codigo, { activa });
    if (!resultado.ok) {
      setSucursalesLocal((prev) => prev.map((s) => (s.codigo === codigo ? { ...s, activa: !activa } : s)));
      setMensaje(MOTIVOS[resultado.motivo] ?? "No se pudo guardar el cambio.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {mensaje && <span className="text-[11px] text-error">{mensaje}</span>}
      <table className="tabla max-w-sm">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Estado</th>
            {editable && <th />}
          </tr>
        </thead>
        <tbody>
          {sucursalesLocal.map((s) => (
            <tr key={s.codigo}>
              <td className="font-mono text-tinta-2">{s.codigo}</td>
              <td>{s.nombre}</td>
              <td>
                {s.activa ? (
                  <span className="text-tinta-2">Activa</span>
                ) : (
                  <span className="text-tinta-3">Inactiva</span>
                )}
              </td>
              {editable && (
                <td data-alinear="der">
                  <Boton variante="fantasma" tamano="sm" onClick={() => alternar(s.codigo, !s.activa)}>
                    {s.activa ? "Desactivar" : "Activar"}
                  </Boton>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {editable && (
        <p className="max-w-sm text-[11px] text-tinta-3">
          Crear o eliminar sucursales no está disponible: el nombre de cada sucursal es el mismo valor fijo que usan
          los presupuestos y el catálogo de precios en toda la app, así que solo se puede activar o desactivar.
        </p>
      )}
    </div>
  );
}
