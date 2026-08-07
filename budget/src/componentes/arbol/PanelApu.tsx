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
          <table className="tabla">
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Descripción</th>
                <th>UM</th>
                <th data-alinear="der">Rendimiento</th>
                <th data-alinear="der">Precio</th>
                <th data-alinear="der">Parcial</th>
                <th>Origen</th>
              </tr>
            </thead>
            <tbody>
              {insumos.map((i) => (
                <tr key={i.codigo}>
                  <td className="font-mono text-tinta">{i.codigo}</td>
                  <td className="max-w-xs truncate text-tinta-2" title={i.descripcionObra}>
                    {i.descripcionObra}
                  </td>
                  <td className="text-tinta-3">{i.unidad}</td>
                  <td className="cifra">{formatearRendimiento(i.rendimiento)}</td>
                  <td data-alinear="der">
                    <Moneda valor={i.precio} decimales={2} />
                  </td>
                  <td data-alinear="der">
                    <Moneda valor={i.parcial} />
                  </td>
                  <td>
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
