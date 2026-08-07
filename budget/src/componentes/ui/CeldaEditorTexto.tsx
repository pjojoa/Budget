"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  valorInicial: string;
  onConfirmar: (texto: string) => void;
  onCancelar: () => void;
}

/**
 * Mismo patrón que CeldaEditorCantidad del árbol de presupuesto (un solo
 * <input> montado a la vez, por celda en edición) pero para texto libre en
 * maestros: alineado a la izquierda, sin prefijo fijo.
 */
export function CeldaEditorTexto({ valorInicial, onConfirmar, onCancelar }: Props) {
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
      className="w-full min-w-0 border border-foco bg-panel px-1 text-xs text-tinta outline-none"
    />
  );
}
