interface Props {
  codigo: string;
  tamano?: "sm" | "md";
  className?: string;
}

/**
 * El elemento firma de la app: la codificación ES la jerarquía (no hay campo
 * "padre"), así que el código se trata como el instrumento que es. Segmenta
 * CCSSSAAA[.SSSS] con peso/opacidad decrecientes y atenúa los ceros de
 * relleno, para que "02001000" se lea de un vistazo como "capítulo 02,
 * subcapítulo 001". Los segmentos van aria-hidden; el elemento expone el
 * código completo para el lector de pantalla.
 */
export function CodigoCuenta({ codigo, tamano = "md", className = "" }: Props) {
  const [base, sufijo] = codigo.split(".");
  const cap = base.slice(0, 2);
  const sub = base.slice(2, 5);
  const act = base.slice(5, 8);

  const esRelleno = (s: string) => /^0+$/.test(s);

  const talla = tamano === "sm" ? "text-[11px]" : "text-xs";

  return (
    <span className={`font-mono ${talla} whitespace-nowrap ${className}`} aria-label={codigo}>
      <span aria-hidden className="inline-flex items-baseline">
        <span className="font-medium text-tinta">{cap}</span>
        <span className={`ml-px ${esRelleno(sub) ? "text-tinta-3" : "text-tinta-2"}`}>{sub}</span>
        <span className={`ml-px ${esRelleno(act) ? "text-tinta-3" : "text-tinta-2"}`}>{act}</span>
        {sufijo && (
          <>
            <span className="mx-px text-tinta-3">.</span>
            <span className="text-tinta-3">{sufijo}</span>
          </>
        )}
      </span>
    </span>
  );
}
