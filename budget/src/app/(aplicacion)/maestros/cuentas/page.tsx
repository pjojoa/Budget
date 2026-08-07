import Link from "next/link";
import { repositorioMaestros } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";
import { puedeEditarMaestros } from "@/datos/contexto";
import { ArbolCuentas } from "./ArbolCuentas";
import type { Cuenta } from "@/datos/tipos";

const PESTANAS: { valor: Cuenta["plantilla"] | ""; etiqueta: string }[] = [
  { valor: "", etiqueta: "Todas" },
  { valor: "EDIFICACION", etiqueta: "Edificación" },
  { valor: "URBANISMO_INTERNO", etiqueta: "Urbanismo interno" },
  { valor: "URBANISMO_EXTERNO", etiqueta: "Urbanismo externo" },
];

export default async function PaginaCuentas({
  searchParams,
}: {
  searchParams: Promise<{ plantilla?: string }>;
}) {
  const { plantilla } = await searchParams;
  const plantillaActiva = (plantilla ?? "") as Cuenta["plantilla"] | "";
  const ctx = await obtenerContextoActual();
  const editable = puedeEditarMaestros(ctx);
  const cuentas = await repositorioMaestros.listarArbolCuentas(
    ctx,
    plantillaActiva || undefined,
  );

  return (
    <div className="p-4">
      <h1 className="mb-3 font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">
        Cuentas <span className="text-tinta-3">({cuentas.length.toLocaleString("es-CO")})</span>
      </h1>

      <div className="mb-3 flex items-center gap-1 border-b border-hairline">
        {PESTANAS.map((p) => (
          <Link
            key={p.valor}
            href={p.valor ? `/maestros/cuentas?plantilla=${p.valor}` : "/maestros/cuentas"}
            className={`border-b-2 px-3 py-1.5 text-xs ${
              plantillaActiva === p.valor
                ? "border-tinta text-tinta"
                : "border-transparent text-tinta-2 hover:text-tinta"
            }`}
          >
            {p.etiqueta}
          </Link>
        ))}
      </div>

      <ArbolCuentas key={plantillaActiva} cuentas={cuentas} editable={editable} />
    </div>
  );
}
