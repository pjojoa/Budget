/** Escribe en la región `aria-live="polite"` del shell (ver `(aplicacion)/layout.tsx`). */
export function anunciar(mensaje: string): void {
  const el = document.getElementById("region-anuncios");
  if (el) el.textContent = mensaje;
}
