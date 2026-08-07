"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CodigoCuenta } from "@/componentes/dominio/CodigoCuenta";
import { Moneda } from "@/componentes/dominio/Moneda";
import { BadgeOrigenPrecio } from "@/componentes/dominio/Insignias";
import { Boton } from "@/componentes/ui/Boton";
import { formatearRendimiento } from "@/dominio/decimal";
import { obtenerApuAccion } from "@/datos/simulado/accionesConsulta";
import type { Insumo } from "@/dominio/tipos";

interface Props {
  presupuestoId: string;
  codigo: string;
  descripcion: string;
  onCerrar: () => void;
  onBuscarArticulo: () => void;
}

export function PanelApu({ presupuestoId, codigo, descripcion, onCerrar, onBuscarArticulo }: Props) {
  const [insumos, setInsumos] = useState<Insumo[] | null>(null);

  useEffect(() => {
    let vigente = true;
    setInsumos(null);
    obtenerApuAccion(presupuestoId, codigo).then((r) => {
      if (vigente) setInsumos(r);
    });
    return () => {
      vigente = false;
    };
  }, [presupuestoId, codigo]);

  return (
    <div className="flex h-64 shrink-0 flex-col border-t border-hairline bg-panel">
      <div className="flex items-center gap-2 border-b border-hairline px-3 py-1.5">
        <span className="font-condensada text-[11px] uppercase tracking-wide text-tinta-3">APU</span>
        <CodigoCuenta codigo={codigo} />
        <span className="truncate text-xs text-tinta-2">{descripcion}</span>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onBuscarArticulo}
            className="text-[11px] text-tinta-2 hover:text-tinta hover:underline"
          >
            Buscar artículo (Ctrl+B)
          </button>
          <Link
            href={`/presupuestos/${presupuestoId}/apu/${encodeURIComponent(codigo)}`}
            target="_blank"
            className="text-[11px] text-tinta-2 hover:text-tinta hover:underline"
          >
            Abrir en pantalla completa
          </Link>
          <Boton variante="fantasma" tamano="sm" onClick={onCerrar} aria-label="Cerrar panel de APU">
            Cerrar
          </Boton>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {insumos === null ? (
          <p className="p-3 text-xs text-tinta-3">Cargando insumos…</p>
        ) : insumos.length === 0 ? (
          <p className="p-3 text-xs text-tinta-3">Esta subactividad no tiene insumos cargados.</p>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="sticky top-0 border-b border-hairline bg-panel text-left font-condensada uppercase tracking-wide text-tinta-3">
                <th className="px-2 py-1 font-medium">Insumo</th>
                <th className="px-2 py-1 font-medium">Descripción</th>
                <th className="px-2 py-1 font-medium">UM</th>
                <th className="px-2 py-1 text-right font-medium">Rendimiento</th>
                <th className="px-2 py-1 text-right font-medium">Precio</th>
                <th className="px-2 py-1 text-right font-medium">Parcial</th>
                <th className="px-2 py-1 font-medium">Origen</th>
              </tr>
            </thead>
            <tbody>
              {insumos.map((i) => (
                <tr key={i.codigo} className="border-b border-hairline hover:bg-fila">
                  <td className="px-2 py-1 font-mono text-tinta">{i.codigo}</td>
                  <td className="max-w-xs truncate px-2 py-1 text-tinta-2" title={i.descripcionObra}>
                    {i.descripcionObra}
                  </td>
                  <td className="px-2 py-1 text-tinta-3">{i.unidad}</td>
                  <td className="cifra px-2 py-1">{formatearRendimiento(i.rendimiento)}</td>
                  <td className="px-2 py-1 text-right">
                    <Moneda valor={i.precio} decimales={2} />
                  </td>
                  <td className="px-2 py-1 text-right">
                    <Moneda valor={i.parcial} />
                  </td>
                  <td className="px-2 py-1">
                    <BadgeOrigenPrecio origen={i.origenPrecio} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
