"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { AnioCatalogoMaterial } from "@/datos/tipos";

const ANIOS: AnioCatalogoMaterial[] = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];

export function SelectorAnioMaterial({ anio }: { anio: AnioCatalogoMaterial }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function cambiarAnio(nuevoAnio: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("anio", nuevoAnio);
    params.delete("pagina");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <label className="flex items-center gap-1.5 text-[11px] text-tinta-3">
      Año
      <select
        value={anio}
        onChange={(e) => cambiarAnio(e.target.value)}
        className="rounded-sm border border-hairline bg-panel px-1.5 py-1 text-xs text-tinta outline-none focus:border-foco"
      >
        {ANIOS.map((a) => (
          <option key={a} value={a}>
            {a}
            {a <= 2026 ? "" : " (proyectado)"}
          </option>
        ))}
      </select>
    </label>
  );
}
