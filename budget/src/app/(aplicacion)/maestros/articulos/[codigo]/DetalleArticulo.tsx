"use client";

import { useState } from "react";
import { Boton } from "@/componentes/ui/Boton";
import { CeldaEditorTexto } from "@/componentes/ui/CeldaEditorTexto";
import { Moneda } from "@/componentes/dominio/Moneda";
import { BadgeOrigenPrecio } from "@/componentes/dominio/Insignias";
import {
  actualizarArticuloAccion,
  eliminarArticuloAccion,
  eliminarPrecioManualAccion,
  fijarPrecioManualAccion,
} from "@/datos/simulado/accionesMaestros";
import { d } from "@/dominio/decimal";
import type { Sucursal } from "@/dominio/tipos";
import type { Articulo, Familia, PrecioResuelto } from "@/datos/tipos";

const MOTIVOS: Record<string, string> = {
  SIN_PERMISO: "No tiene permiso para editar el maestro de artículos.",
  ARTICULO_INEXISTENTE: "El artículo ya no existe.",
  EN_USO: "No se puede eliminar: aparece como insumo en un presupuesto cargado.",
  VALOR_INVALIDO: "El precio debe ser un número mayor que cero.",
  PRECIO_INEXISTENTE: "No hay un precio manual fijado para esa sucursal.",
};

type Campo = "descripcion" | "unidadMedida" | "familia";

interface Props {
  articulo: Articulo;
  familias: Familia[];
  editable: boolean;
  anioConsulta: number;
  preciosIniciales: { sucursal: Sucursal; resuelto: PrecioResuelto | null }[];
}

export function DetalleArticulo({ articulo: articuloInicial, familias, editable, anioConsulta, preciosIniciales }: Props) {
  const [articulo, setArticulo] = useState(articuloInicial);
  const [precios, setPrecios] = useState(preciosIniciales);
  const [edicion, setEdicion] = useState<Campo | null>(null);
  const [sucursalEnEdicion, setSucursalEnEdicion] = useState<Sucursal | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);

  async function guardarCampo(campo: Campo, valor: string) {
    setEdicion(null);
    const anterior = articulo;
    setArticulo((prev) => ({
      ...prev,
      [campo]: valor,
      ...(campo === "familia"
        ? { familiaNombre: familias.find((f) => f.codigo === valor)?.nombre ?? (valor ? valor : "Sin familia") }
        : {}),
    }));
    const resultado = await actualizarArticuloAccion(articulo.codigo, { [campo]: valor });
    if (resultado.ok) {
      setArticulo(resultado.articulo);
    } else {
      setArticulo(anterior);
      setMensaje(MOTIVOS[resultado.motivo] ?? "No se pudo guardar el cambio.");
    }
  }

  async function alternarActivo() {
    const anterior = articulo.activo;
    setArticulo((prev) => ({ ...prev, activo: !anterior }));
    const resultado = await actualizarArticuloAccion(articulo.codigo, { activo: !anterior });
    if (!resultado.ok) {
      setArticulo((prev) => ({ ...prev, activo: anterior }));
      setMensaje(MOTIVOS[resultado.motivo] ?? "No se pudo guardar el cambio.");
    }
  }

  async function eliminarArticulo() {
    setEliminando(true);
    const resultado = await eliminarArticuloAccion(articulo.codigo);
    setEliminando(false);
    if (!resultado.ok) {
      setConfirmarBorrado(false);
      setMensaje(MOTIVOS[resultado.motivo] ?? "No se pudo eliminar el artículo.");
    }
    // si tuvo éxito, revalidatePath ya invalidó /maestros/articulos; el usuario
    // sigue viendo esta página hasta que navegue — no hay a dónde redirigir
    // automáticamente sin salir del flujo que decida el propio usuario.
  }

  async function fijarPrecio(sucursal: Sucursal, texto: string) {
    let precio;
    try {
      precio = d(texto);
    } catch {
      setMensaje(MOTIVOS.VALOR_INVALIDO);
      return;
    }
    setSucursalEnEdicion(null);
    const resultado = await fijarPrecioManualAccion({ articulo: articulo.codigo, sucursal, anio: anioConsulta, precio });
    if (resultado.ok) {
      setPrecios((prev) =>
        prev.map((p) => (p.sucursal === sucursal ? { ...p, resuelto: { precio, origen: "MANUAL" } } : p)),
      );
    } else {
      setMensaje(MOTIVOS[resultado.motivo] ?? "No se pudo fijar el precio manual.");
    }
  }

  async function quitarPrecioManual(sucursal: Sucursal) {
    const resultado = await eliminarPrecioManualAccion(articulo.codigo, sucursal, anioConsulta);
    if (resultado.ok) {
      setPrecios((prev) =>
        prev.map((p) => (p.sucursal === sucursal ? { ...p, resuelto: { precio: d(0), origen: "SIN_PRECIO" } } : p)),
      );
    } else {
      setMensaje(MOTIVOS[resultado.motivo] ?? "No se pudo quitar el precio manual.");
    }
  }

  return (
    <div className="p-4">
      <div className="mb-1 flex items-center gap-2">
        <h1 className="font-mono text-sm text-tinta">{articulo.codigo}</h1>
        {editable && (
          <button
            type="button"
            onClick={alternarActivo}
            className={`rounded-sm border px-1.5 py-0.5 text-[11px] ${
              articulo.activo ? "border-hairline text-tinta-2 hover:text-tinta" : "border-hairline text-tinta-3"
            }`}
          >
            {articulo.activo ? "Activo" : "Inactivo"}
          </button>
        )}
        {!editable && (
          <span className={`text-[11px] ${articulo.activo ? "text-tinta-2" : "text-tinta-3"}`}>
            {articulo.activo ? "Activo" : "Inactivo"}
          </span>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-tinta-2">
        {edicion === "descripcion" ? (
          <CeldaEditorTexto
            valorInicial={articulo.descripcion}
            onConfirmar={(v) => guardarCampo("descripcion", v)}
            onCancelar={() => setEdicion(null)}
          />
        ) : (
          <span
            className={editable ? "cursor-text hover:underline" : ""}
            onClick={() => editable && setEdicion("descripcion")}
          >
            {articulo.descripcion}
          </span>
        )}
        <span>·</span>
        {edicion === "unidadMedida" ? (
          <CeldaEditorTexto
            valorInicial={articulo.unidadMedida}
            onConfirmar={(v) => guardarCampo("unidadMedida", v)}
            onCancelar={() => setEdicion(null)}
          />
        ) : (
          <span
            className={editable ? "cursor-text hover:underline" : ""}
            onClick={() => editable && setEdicion("unidadMedida")}
          >
            {articulo.unidadMedida}
          </span>
        )}
        <span>· familia</span>
        {editable && edicion === "familia" ? (
          <select
            autoFocus
            defaultValue={articulo.familia}
            onChange={(e) => guardarCampo("familia", e.target.value)}
            onBlur={() => setEdicion(null)}
            className="border border-foco bg-panel px-1 text-xs text-tinta outline-none"
          >
            <option value="">Sin familia</option>
            {familias.map((f) => (
              <option key={f.codigo} value={f.codigo}>
                {f.codigo} · {f.nombre}
              </option>
            ))}
          </select>
        ) : (
          <span
            className={editable ? "cursor-text hover:underline" : ""}
            onClick={() => editable && setEdicion("familia")}
          >
            {articulo.familiaNombre}
          </span>
        )}
      </div>

      {mensaje && <p className="mb-3 text-[11px] text-error">{mensaje}</p>}

      <h2 className="mb-2 font-condensada text-[11px] uppercase tracking-wide text-tinta-3">
        Precios por sucursal ({anioConsulta})
      </h2>
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
                    <Boton variante="fantasma" tamano="sm" onClick={() => quitarPrecioManual(sucursal)}>
                      Quitar
                    </Boton>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {editable && (
        <div className="mt-6 border-t border-hairline pt-3">
          {confirmarBorrado ? (
            <span className="flex items-center gap-2 text-xs">
              <span className="text-tinta-2">¿Eliminar este artículo del maestro?</span>
              <Boton variante="peligro" tamano="sm" onClick={eliminarArticulo} disabled={eliminando}>
                {eliminando ? "Eliminando…" : "Confirmar"}
              </Boton>
              <Boton variante="fantasma" tamano="sm" onClick={() => setConfirmarBorrado(false)}>
                Cancelar
              </Boton>
            </span>
          ) : (
            <Boton variante="peligro" tamano="sm" onClick={() => setConfirmarBorrado(true)}>
              Eliminar artículo
            </Boton>
          )}
        </div>
      )}
    </div>
  );
}
