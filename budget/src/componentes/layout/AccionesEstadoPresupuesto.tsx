"use client";

import { useState, useTransition } from "react";
import { Boton } from "@/componentes/ui/Boton";
import { cambiarEstadoAccion } from "@/datos/simulado/accionesPresupuesto";

interface Props {
  presupuestoId: string;
  puedeEnviarRevision: boolean;
  puedeDevolver: boolean;
  puedeAprobarFinal: boolean;
}

const TEXTOS_ERROR: Record<string, string> = {
  SIN_PERMISO: "No tiene permiso para esta acción.",
  TRANSICION_INVALIDA: "Esta transición ya no es válida — recargue la página.",
};

/**
 * BORRADOR → EN_REVISION la envía el Presupuestador; devolver a BORRADOR es
 * el filtro de cualquiera de los dos directores; EN_REVISION → APROBADO es
 * exclusivo de Director Nacional CPC (ver cambiarEstado en repositorioSimulado).
 */
export function AccionesEstadoPresupuesto({
  presupuestoId,
  puedeEnviarRevision,
  puedeDevolver,
  puedeAprobarFinal,
}: Props) {
  const [pendiente, iniciarTransicion] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);

  function ejecutar(nuevoEstado: "EN_REVISION" | "BORRADOR" | "APROBADO") {
    setMensaje(null);
    iniciarTransicion(async () => {
      const resultado = await cambiarEstadoAccion(presupuestoId, nuevoEstado);
      if (!resultado.ok) {
        setMensaje(resultado.detalle ?? TEXTOS_ERROR[resultado.motivo] ?? "No se pudo completar la acción.");
      }
    });
  }

  if (!puedeEnviarRevision && !puedeDevolver && !puedeAprobarFinal) return null;

  return (
    <div className="flex items-center gap-2 border-l border-hairline pl-4">
      {puedeEnviarRevision && (
        <Boton variante="secundario" tamano="sm" disabled={pendiente} onClick={() => ejecutar("EN_REVISION")}>
          Enviar a revisión
        </Boton>
      )}
      {puedeDevolver && (
        <Boton variante="fantasma" tamano="sm" disabled={pendiente} onClick={() => ejecutar("BORRADOR")}>
          Devolver a borrador
        </Boton>
      )}
      {puedeAprobarFinal && (
        <Boton variante="primario" tamano="sm" disabled={pendiente} onClick={() => ejecutar("APROBADO")}>
          Aprobar
        </Boton>
      )}
      {mensaje && <span className="text-[11px] text-error">{mensaje}</span>}
    </div>
  );
}
