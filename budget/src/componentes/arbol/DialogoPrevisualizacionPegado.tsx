"use client";

import { Dialogo } from "@/componentes/ui/Dialogo";
import { Boton } from "@/componentes/ui/Boton";
import { formatearRendimiento } from "@/dominio/decimal";
import type { ResultadoCeldaPegado } from "./evaluarPegado";

interface Props {
  resultados: ResultadoCeldaPegado[];
  filasRecortadas: number;
  columnasRecortadas: number;
  onAplicar: () => void;
  onCancelar: () => void;
}

const ETIQUETA_MOTIVO: Record<string, string> = {
  columna_no_editable_en_este_nivel: "columna no aplica a este nivel",
  no_numerico: "valor no numérico",
  negativo: "no se admiten valores negativos",
};

const ETIQUETA_COLUMNA: Record<string, string> = { cantidad: "Cantidad", repeticiones: "Repeticiones" };

export function DialogoPrevisualizacionPegado({
  resultados,
  filasRecortadas,
  columnasRecortadas,
  onAplicar,
  onCancelar,
}: Props) {
  const aplicables = resultados.filter((r) => r.estado === "aplicable");
  const ignoradas = resultados.filter((r) => r.estado === "no_editable" || r.estado === "sin_cambio");
  const invalidas = resultados.filter((r) => r.estado === "valor_invalido");
  const tocaRepeticiones = aplicables.some((r) => r.columna === "repeticiones");

  return (
    <Dialogo
      abierto
      onCambiarAbierto={(abierto) => !abierto && onCancelar()}
      titulo="Previsualización del pegado"
      ancho="md"
    >
      <p className="text-xs text-tinta-2">
        {aplicables.length} se aplican · {ignoradas.length} se ignoran · {invalidas.length} inválidas
        {(filasRecortadas > 0 || columnasRecortadas > 0) && (
          <span className="text-tinta-3">
            {" "}
            (recortado: {filasRecortadas} fila(s), {columnasRecortadas} columna(s) fuera de la tabla)
          </span>
        )}
      </p>

      {tocaRepeticiones && (
        <p className="mt-2 rounded-sm border border-aviso/40 bg-aviso/10 p-2 text-xs text-aviso">
          Vas a cambiar el multiplicador (Repeticiones) de{" "}
          {aplicables.filter((r) => r.columna === "repeticiones").length} actividad(es). Esto multiplica el importe
          de toda su rama.
        </p>
      )}

      <div className="mt-3 max-h-72 overflow-auto rounded-sm border border-hairline">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-panel">
            <tr className="border-b border-hairline text-left font-condensada uppercase tracking-wide text-tinta-3">
              <th className="px-2 py-1 font-medium">Código</th>
              <th className="px-2 py-1 font-medium">Columna</th>
              <th className="px-2 py-1 text-right font-medium">Antes</th>
              <th className="px-2 py-1 text-right font-medium">Después</th>
              <th className="px-2 py-1 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {resultados.map((r, i) => (
              <tr key={`${r.codigo}-${r.columna}-${i}`} className="border-b border-hairline">
                <td className="px-2 py-1 font-mono text-tinta">{r.codigo}</td>
                <td className="px-2 py-1 text-tinta-2">{ETIQUETA_COLUMNA[r.columna]}</td>
                <td className="px-2 py-1 text-right text-tinta-3">{formatearRendimiento(r.valorAnterior, 2)}</td>
                <td className="px-2 py-1 text-right">
                  {r.valorNuevo ? (
                    <span className={r.estado === "aplicable" ? "text-tinta" : "text-tinta-3"}>
                      {formatearRendimiento(r.valorNuevo, 2)}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-2 py-1">
                  {r.estado === "aplicable" && <span className="text-tinta-2">se aplica</span>}
                  {r.estado === "sin_cambio" && <span className="text-tinta-3">sin cambio</span>}
                  {r.estado === "no_editable" && (
                    <span className="text-tinta-3" title={ETIQUETA_MOTIVO[r.motivo ?? ""]}>
                      se ignora
                    </span>
                  )}
                  {r.estado === "valor_invalido" && (
                    <span className="text-error">{ETIQUETA_MOTIVO[r.motivo ?? ""] ?? "inválido"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <Boton variante="fantasma" onClick={onCancelar}>
          Cancelar
        </Boton>
        <Boton variante="primario" onClick={onAplicar} disabled={aplicables.length === 0}>
          Aplicar solo las válidas ({aplicables.length})
        </Boton>
      </div>
    </Dialogo>
  );
}
