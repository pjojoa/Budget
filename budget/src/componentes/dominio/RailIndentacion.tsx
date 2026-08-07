const PROFUNDIDAD_POR_NIVEL: Record<4 | 5 | 8 | 10, number> = { 4: 0, 5: 1, 8: 2, 10: 3 };

/**
 * No es padding decorativo: codifica profundidad real. Si dos filas
 * consecutivas están al mismo nivel, se ve; si una es hija, se ve.
 */
export function RailIndentacion({ nivel }: { nivel: 4 | 5 | 8 | 10 }) {
  const profundidad = PROFUNDIDAD_POR_NIVEL[nivel];
  return (
    <span className="inline-flex shrink-0" aria-hidden style={{ width: profundidad * 14 }}>
      {Array.from({ length: profundidad }).map((_, i) => (
        <span
          key={i}
          className={`inline-block w-3.5 border-l ${i === profundidad - 1 ? "border-tinta-3" : "border-hairline"}`}
        />
      ))}
    </span>
  );
}
