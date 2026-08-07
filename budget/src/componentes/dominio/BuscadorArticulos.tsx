"use client";

import { useEffect, useRef, useState } from "react";
import { Dialogo } from "@/componentes/ui/Dialogo";
import { buscarArticulosAccion } from "@/datos/simulado/accionesConsulta";
import type { Articulo } from "@/datos/tipos";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  /** Si se define, cada fila ofrece "Seleccionar" y lo invoca con el artículo elegido. */
  onSeleccionar?: (articulo: Articulo) => void;
}

const POR_PAGINA = 30;
const RETARDO_BUSQUEDA_MS = 200;

/**
 * Buscador de artículos ("F5 de Opus"): paginación server-side siempre —
 * con 20.784 registros, cargarlos todos de una vez es exactamente el
 * antipatrón que el plan prohíbe.
 */
export function BuscadorArticulos({ abierto, onCerrar, onSeleccionar }: Props) {
  const [texto, setTexto] = useState("");
  const [pagina, setPagina] = useState(1);
  const [resultado, setResultado] = useState<{ filas: Articulo[]; total: number } | null>(null);
  const [cargando, setCargando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const idPeticion = useRef(0);

  useEffect(() => {
    if (!abierto) return;
    inputRef.current?.focus();
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    setCargando(true);
    const miId = ++idPeticion.current;
    const manejador = setTimeout(() => {
      buscarArticulosAccion({ texto: texto || undefined, pagina, porPagina: POR_PAGINA, soloActivos: true }).then(
        (r) => {
          if (idPeticion.current !== miId) return; // respuesta obsoleta, ignorar
          setResultado(r);
          setCargando(false);
        },
      );
    }, RETARDO_BUSQUEDA_MS);
    return () => clearTimeout(manejador);
  }, [abierto, texto, pagina]);

  useEffect(() => {
    setPagina(1);
  }, [texto]);

  if (!abierto) return null;

  const totalPaginas = resultado ? Math.max(1, Math.ceil(resultado.total / POR_PAGINA)) : 1;

  return (
    <Dialogo
      abierto={abierto}
      onCambiarAbierto={(a) => !a && onCerrar()}
      titulo="Buscar artículo"
      descripcion="Maestro de artículos — paginado, nunca se carga completo."
      ancho="lg"
    >
      <input
        ref={inputRef}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Código o descripción…"
        className="w-full rounded-sm border border-hairline bg-lienzo px-2 py-1.5 text-xs text-tinta"
      />

      <div className="mt-3 max-h-96 overflow-auto rounded-sm border border-hairline">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-panel">
            <tr className="border-b border-hairline text-left font-condensada uppercase tracking-wide text-tinta-3">
              <th className="px-2 py-1 font-medium">Código</th>
              <th className="px-2 py-1 font-medium">Descripción</th>
              <th className="px-2 py-1 font-medium">UM</th>
              <th className="px-2 py-1 font-medium">Familia</th>
              <th className="px-2 py-1 text-right font-medium">Sucursales c/precio</th>
              {onSeleccionar && <th className="px-2 py-1" />}
            </tr>
          </thead>
          <tbody>
            {resultado?.filas.map((a) => (
              <tr key={a.codigo} className="border-b border-hairline hover:bg-fila">
                <td className="px-2 py-1 font-mono text-tinta">{a.codigo}</td>
                <td className="px-2 py-1 text-tinta-2" title={a.descripcion}>
                  {a.descripcion}
                </td>
                <td className="px-2 py-1 text-tinta-3">{a.unidadMedida}</td>
                <td className="px-2 py-1 text-tinta-3">{a.familiaNombre}</td>
                <td className="cifra px-2 py-1">{a.nSucursalesConPrecio}</td>
                {onSeleccionar && (
                  <td className="px-2 py-1 text-right">
                    <button
                      type="button"
                      onClick={() => onSeleccionar(a)}
                      className="text-[11px] text-tinta-2 hover:text-tinta hover:underline"
                    >
                      Seleccionar
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {resultado && resultado.filas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-2 py-4 text-center text-tinta-3">
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-tinta-3">
        <span>{cargando ? "Buscando…" : resultado ? `${resultado.total.toLocaleString("es-CO")} artículos` : ""}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => p - 1)}
            className="hover:text-tinta hover:underline disabled:pointer-events-none disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span>
            Página {pagina} de {totalPaginas.toLocaleString("es-CO")}
          </span>
          <button
            type="button"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
            className="hover:text-tinta hover:underline disabled:pointer-events-none disabled:opacity-40"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </Dialogo>
  );
}
