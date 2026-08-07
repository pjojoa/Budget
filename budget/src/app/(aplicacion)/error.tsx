"use client";

import { Boton } from "@/componentes/ui/Boton";

export default function ErrorAplicacion({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-xs">
      <p className="font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">
        Algo salió mal
      </p>
      <p className="max-w-sm text-tinta-2">
        {error.message || "No se pudo cargar esta pantalla."}
      </p>
      <Boton variante="primario" tamano="sm" onClick={reset}>
        Reintentar
      </Boton>
    </div>
  );
}
