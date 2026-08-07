"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  valorInicial: string;
  prefijoFijo?: string;
  onConfirmar: (texto: string) => void;
  onCancelar: () => void;
}

/**
 * El único <input> montado a la vez en todo el árbol — montar uno por celda
 * es la causa habitual del atasco a partir de ~500 filas. Aparece solo
 * cuando esta celda concreta entra en modo edición.
 */
export function CeldaEditorCantidad({ valorInicial, prefijoFijo, onConfirmar, onCancelar }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [valor, setValor] = useState(valorInicial);
  const confirmadoRef = useRef(false);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  function confirmar() {
    if (confirmadoRef.current) return;
    confirmadoRef.current = true;
    onConfirmar(valor);
  }

  return (
    <div className="flex items-center gap-0.5">
      {prefijoFijo && (
        <span aria-hidden className="text-tinta-3">
          {prefijoFijo}
        </span>
      )}
      <input
        ref={ref}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            confirmar();
          } else if (e.key === "Escape") {
            e.preventDefault();
            confirmadoRef.current = true;
            onCancelar();
          }
        }}
        onBlur={() => confirmar()}
        aria-label="Editar valor"
        className="w-full min-w-0 border border-foco bg-panel px-1 text-right text-xs text-tinta outline-none"
        style={{ fontFamily: "var(--font-mono)" }}
      />
    </div>
  );
}
