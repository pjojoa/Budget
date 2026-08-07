import { forwardRef, type ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "primario" | "secundario" | "fantasma" | "peligro";
  tamano?: "sm" | "md";
}

const VARIANTES: Record<NonNullable<Props["variante"]>, string> = {
  primario: "bg-tinta text-lienzo hover:opacity-90",
  secundario: "border border-hairline text-tinta hover:bg-fila",
  fantasma: "text-tinta-2 hover:text-tinta hover:bg-fila",
  peligro: "border border-error/40 text-error hover:bg-error/10",
};

export const Boton = forwardRef<HTMLButtonElement, Props>(function Boton(
  { variante = "secundario", tamano = "md", className = "", ...resto },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-1.5 rounded-sm font-medium transition-colors duration-[var(--mv-duracion-rapida)] disabled:cursor-not-allowed disabled:opacity-40 ${
        tamano === "sm" ? "h-6 px-2 text-[11px]" : "h-[26px] px-3 text-xs"
      } ${VARIANTES[variante]} ${className}`}
      {...resto}
    />
  );
});
