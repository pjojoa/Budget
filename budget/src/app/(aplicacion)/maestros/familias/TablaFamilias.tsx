"use client";

import { useCallback, useState } from "react";
import { TablaDatos, type ColumnaTabla } from "@/componentes/ui/TablaDatos";
import { Boton } from "@/componentes/ui/Boton";
import { CeldaEditorTexto } from "@/componentes/ui/CeldaEditorTexto";
import {
  actualizarFamiliaAccion,
  crearFamiliaAccion,
  eliminarFamiliaAccion,
} from "@/datos/simulado/accionesMaestros";
import type { Familia } from "@/datos/tipos";

type Campo = "nombre" | "tipo";

const MOTIVOS: Record<string, string> = {
  SIN_PERMISO: "No tiene permiso para editar el maestro de familias.",
  CODIGO_DUPLICADO: "Ya existe una familia con ese código.",
  FAMILIA_INEXISTENTE: "La familia ya no existe.",
  EN_USO: "No se puede eliminar: hay artículos que todavía la referencian.",
};

interface Props {
  filas: Familia[];
  editable: boolean;
}

export function TablaFamilias({ filas, editable }: Props) {
  const [familiasLocal, setFamiliasLocal] = useState(filas);
  const [edicion, setEdicion] = useState<{ codigo: string; campo: Campo } | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [formAbierto, setFormAbierto] = useState(false);
  const [nuevoCodigo, setNuevoCodigo] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState("");
  const [creando, setCreando] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState<string | null>(null);

  const guardarCampo = useCallback(
    async (codigo: string, campo: Campo, valor: string) => {
      setEdicion(null);
      const anterior = familiasLocal.find((f) => f.codigo === codigo)?.[campo];
      if (anterior === valor) return;
      setFamiliasLocal((prev) => prev.map((f) => (f.codigo === codigo ? { ...f, [campo]: valor } : f)));
      const resultado = await actualizarFamiliaAccion(codigo, { [campo]: valor });
      if (!resultado.ok) {
        setFamiliasLocal((prev) => prev.map((f) => (f.codigo === codigo ? { ...f, [campo]: anterior } : f)));
        setMensaje(MOTIVOS[resultado.motivo] ?? "No se pudo guardar el cambio.");
      }
    },
    [familiasLocal],
  );

  const crearFamilia = useCallback(async () => {
    setCreando(true);
    setMensaje(null);
    const resultado = await crearFamiliaAccion({
      codigo: nuevoCodigo.trim(),
      nombre: nuevoNombre.trim(),
      tipo: nuevoTipo.trim(),
    });
    setCreando(false);
    if (resultado.ok) {
      setFamiliasLocal((prev) => [...prev, resultado.familia]);
      setNuevoCodigo("");
      setNuevoNombre("");
      setNuevoTipo("");
      setFormAbierto(false);
    } else {
      setMensaje(MOTIVOS[resultado.motivo] ?? "No se pudo crear la familia.");
    }
  }, [nuevoCodigo, nuevoNombre, nuevoTipo]);

  const eliminar = useCallback(
    async (codigo: string) => {
      setConfirmarBorrado(null);
      const anterior = familiasLocal;
      setFamiliasLocal((prev) => prev.filter((f) => f.codigo !== codigo));
      const resultado = await eliminarFamiliaAccion(codigo);
      if (!resultado.ok) {
        setFamiliasLocal(anterior);
        setMensaje(MOTIVOS[resultado.motivo] ?? "No se pudo eliminar la familia.");
      }
    },
    [familiasLocal],
  );

  const columnas: ColumnaTabla<Familia>[] = [
    { id: "codigo", encabezado: "Código", valor: (f) => f.codigo, celda: (f) => <span className="font-mono">{f.codigo}</span> },
    {
      id: "nombre",
      encabezado: "Nombre",
      valor: (f) => f.nombre,
      celda: (f) => {
        if (edicion?.codigo === f.codigo && edicion.campo === "nombre") {
          return (
            <span onClick={(e) => e.stopPropagation()}>
              <CeldaEditorTexto
                valorInicial={f.nombre}
                onConfirmar={(v) => guardarCampo(f.codigo, "nombre", v)}
                onCancelar={() => setEdicion(null)}
              />
            </span>
          );
        }
        return (
          <span
            className={editable ? "cursor-text hover:underline" : ""}
            onClick={(e) => {
              if (!editable) return;
              e.stopPropagation();
              setEdicion({ codigo: f.codigo, campo: "nombre" });
            }}
          >
            {f.nombre}
          </span>
        );
      },
    },
    {
      id: "tipo",
      encabezado: "Tipo",
      valor: (f) => f.tipo,
      celda: (f) => {
        if (edicion?.codigo === f.codigo && edicion.campo === "tipo") {
          return (
            <span onClick={(e) => e.stopPropagation()}>
              <CeldaEditorTexto
                valorInicial={f.tipo}
                onConfirmar={(v) => guardarCampo(f.codigo, "tipo", v)}
                onCancelar={() => setEdicion(null)}
              />
            </span>
          );
        }
        return (
          <span
            className={editable ? "cursor-text hover:underline" : ""}
            onClick={(e) => {
              if (!editable) return;
              e.stopPropagation();
              setEdicion({ codigo: f.codigo, campo: "tipo" });
            }}
          >
            {f.tipo ? f.tipo : <span className="text-tinta-3">—</span>}
          </span>
        );
      },
    },
    { id: "n", encabezado: "Artículos", valor: (f) => f.nArticulos, alinear: "der", cifra: true },
    ...(editable
      ? [
          {
            id: "acciones",
            encabezado: "",
            filtrable: false,
            ordenable: false,
            valor: () => "",
            celda: (f: Familia) => (
              <span onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 whitespace-nowrap">
                {confirmarBorrado === f.codigo ? (
                  <>
                    <Boton variante="peligro" tamano="sm" onClick={() => eliminar(f.codigo)}>
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
                    onClick={() => setConfirmarBorrado(f.codigo)}
                    aria-label={`Eliminar familia ${f.codigo}`}
                    title="Eliminar familia"
                    className="hover:text-error"
                  >
                    Eliminar
                  </Boton>
                )}
              </span>
            ),
          } satisfies ColumnaTabla<Familia>,
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {editable && (
          <Boton variante="secundario" tamano="sm" onClick={() => setFormAbierto((v) => !v)}>
            {formAbierto ? "Cancelar" : "+ Nueva familia"}
          </Boton>
        )}
        {mensaje && <span className="text-[11px] text-error">{mensaje}</span>}
      </div>

      {editable && formAbierto && (
        <div className="flex flex-wrap items-end gap-2 rounded-sm border border-hairline bg-panel p-2">
          <label className="flex flex-col gap-0.5 text-[11px] text-tinta-3">
            Código
            <input
              value={nuevoCodigo}
              onChange={(e) => setNuevoCodigo(e.target.value)}
              className="w-24 rounded-sm border border-hairline bg-panel px-2 py-1 font-mono text-xs text-tinta outline-none focus:border-foco"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[11px] text-tinta-3">
            Nombre
            <input
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              className="w-64 rounded-sm border border-hairline bg-panel px-2 py-1 text-xs text-tinta outline-none focus:border-foco"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[11px] text-tinta-3">
            Tipo
            <input
              value={nuevoTipo}
              onChange={(e) => setNuevoTipo(e.target.value)}
              placeholder="Material / Mano de obra"
              className="w-40 rounded-sm border border-hairline bg-panel px-2 py-1 text-xs text-tinta outline-none focus:border-foco"
            />
          </label>
          <Boton
            variante="primario"
            tamano="sm"
            onClick={crearFamilia}
            disabled={creando || !nuevoCodigo.trim() || !nuevoNombre.trim()}
          >
            {creando ? "Creando…" : "Crear"}
          </Boton>
        </div>
      )}

      <TablaDatos
        datos={familiasLocal}
        columnas={columnas}
        obtenerId={(f) => f.codigo}
        placeholderBusqueda="Buscar familia…"
        claseTabla="max-w-2xl"
      />
    </div>
  );
}
