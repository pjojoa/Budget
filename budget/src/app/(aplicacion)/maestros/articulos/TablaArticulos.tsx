"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { TablaDatos, type ColumnaTabla } from "@/componentes/ui/TablaDatos";
import { Boton } from "@/componentes/ui/Boton";
import { crearArticuloAccion, eliminarArticuloAccion } from "@/datos/simulado/accionesMaestros";
import type { Articulo, Familia } from "@/datos/tipos";

const MOTIVOS: Record<string, string> = {
  SIN_PERMISO: "No tiene permiso para editar el maestro de artículos.",
  CODIGO_DUPLICADO: "Ya existe un artículo con ese código.",
  ARTICULO_INEXISTENTE: "El artículo ya no existe.",
  EN_USO: "No se puede eliminar: aparece como insumo en un presupuesto cargado.",
};

interface Props {
  filas: Articulo[];
  acciones?: ReactNode;
  busquedaServidor?: string;
  editable: boolean;
  familias: Familia[];
}

export function TablaArticulos({ filas, acciones, busquedaServidor, editable, familias }: Props) {
  const [articulosLocal, setArticulosLocal] = useState(filas);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [formAbierto, setFormAbierto] = useState(false);
  const [nuevoCodigo, setNuevoCodigo] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevaUnidad, setNuevaUnidad] = useState("");
  const [nuevaFamilia, setNuevaFamilia] = useState("");
  const [creando, setCreando] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState<string | null>(null);

  async function crearArticulo() {
    setCreando(true);
    setMensaje(null);
    const resultado = await crearArticuloAccion({
      codigo: nuevoCodigo.trim(),
      descripcion: nuevaDescripcion.trim(),
      unidadMedida: nuevaUnidad.trim(),
      familia: nuevaFamilia,
    });
    setCreando(false);
    if (resultado.ok) {
      setArticulosLocal((prev) => [resultado.articulo, ...prev]);
      setNuevoCodigo("");
      setNuevaDescripcion("");
      setNuevaUnidad("");
      setNuevaFamilia("");
      setFormAbierto(false);
    } else {
      setMensaje(MOTIVOS[resultado.motivo] ?? "No se pudo crear el artículo.");
    }
  }

  async function eliminar(codigo: string) {
    setConfirmarBorrado(null);
    const anterior = articulosLocal;
    setArticulosLocal((prev) => prev.filter((a) => a.codigo !== codigo));
    const resultado = await eliminarArticuloAccion(codigo);
    if (!resultado.ok) {
      setArticulosLocal(anterior);
      setMensaje(MOTIVOS[resultado.motivo] ?? "No se pudo eliminar el artículo.");
    }
  }

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
    ...(editable
      ? [
          {
            id: "eliminar",
            encabezado: "",
            filtrable: false,
            ordenable: false,
            valor: () => "",
            celda: (a: Articulo) => (
              <span onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 whitespace-nowrap">
                {confirmarBorrado === a.codigo ? (
                  <>
                    <Boton variante="peligro" tamano="sm" onClick={() => eliminar(a.codigo)}>
                      Confirmar
                    </Boton>
                    <Boton variante="fantasma" tamano="sm" onClick={() => setConfirmarBorrado(null)}>
                      Cancelar
                    </Boton>
                  </>
                ) : (
                  <Boton
                    variante="fantasma"
                    tamano="sm"
                    onClick={() => setConfirmarBorrado(a.codigo)}
                    aria-label={`Eliminar artículo ${a.codigo}`}
                    className="hover:text-error"
                  >
                    Eliminar
                  </Boton>
                )}
              </span>
            ),
          } satisfies ColumnaTabla<Articulo>,
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-2">
      {editable && (
        <div className="flex flex-wrap items-center gap-2">
          <Boton variante="secundario" tamano="sm" onClick={() => setFormAbierto((v) => !v)}>
            {formAbierto ? "Cancelar" : "+ Nuevo artículo"}
          </Boton>
          {mensaje && <span className="text-[11px] text-error">{mensaje}</span>}
        </div>
      )}

      {editable && formAbierto && (
        <div className="flex flex-wrap items-end gap-2 rounded-sm border border-hairline bg-panel p-2">
          <label className="flex flex-col gap-0.5 text-[11px] text-tinta-3">
            Código
            <input
              value={nuevoCodigo}
              onChange={(e) => setNuevoCodigo(e.target.value)}
              className="w-28 rounded-sm border border-hairline bg-panel px-2 py-1 font-mono text-xs text-tinta outline-none focus:border-foco"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[11px] text-tinta-3">
            Descripción
            <input
              value={nuevaDescripcion}
              onChange={(e) => setNuevaDescripcion(e.target.value)}
              className="w-64 rounded-sm border border-hairline bg-panel px-2 py-1 text-xs text-tinta outline-none focus:border-foco"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[11px] text-tinta-3">
            Unidad
            <input
              value={nuevaUnidad}
              onChange={(e) => setNuevaUnidad(e.target.value)}
              className="w-20 rounded-sm border border-hairline bg-panel px-2 py-1 text-xs text-tinta outline-none focus:border-foco"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[11px] text-tinta-3">
            Familia
            <select
              value={nuevaFamilia}
              onChange={(e) => setNuevaFamilia(e.target.value)}
              className="w-48 rounded-sm border border-hairline bg-panel px-2 py-1 text-xs text-tinta outline-none focus:border-foco"
            >
              <option value="">Sin familia</option>
              {familias.map((f) => (
                <option key={f.codigo} value={f.codigo}>
                  {f.codigo} · {f.nombre}
                </option>
              ))}
            </select>
          </label>
          <Boton
            variante="primario"
            tamano="sm"
            onClick={crearArticulo}
            disabled={creando || !nuevoCodigo.trim() || !nuevaDescripcion.trim()}
          >
            {creando ? "Creando…" : "Crear"}
          </Boton>
        </div>
      )}

      <TablaDatos
        datos={articulosLocal}
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
    </div>
  );
}
