import Link from "next/link";
import { repositorioMaestros } from "@/datos";
import { obtenerContextoActual, obtenerContextoPrecioActual } from "@/datos/simulado/sesion";
import { puedeEditarMaestros } from "@/datos/contexto";
import type { ContextoAcceso } from "@/datos/contexto";
import { TablaPrecios } from "./TablaPrecios";
import { TablaManoObra } from "./TablaManoObra";

const PESTANAS = [
  { valor: "", etiqueta: "Consulta individual" },
  { valor: "mano-obra", etiqueta: "Catálogo de Mano de Obra" },
] as const;

export default async function PaginaPrecios({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string; vista?: string }>;
}) {
  const { codigo, vista } = await searchParams;
  const vistaActiva = vista === "mano-obra" ? "mano-obra" : "";
  const ctx = await obtenerContextoActual();
  const editable = puedeEditarMaestros(ctx);
  const { anio } = await obtenerContextoPrecioActual();
  const anioConsulta = anio ?? 2025;

  return (
    <div className="p-4">
      <h1 className="mb-3 font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">
        Catálogo de precios
      </h1>

      <div className="mb-3 flex items-center gap-1 border-b border-hairline">
        {PESTANAS.map((p) => (
          <Link
            key={p.valor}
            href={p.valor ? `/maestros/precios?vista=${p.valor}` : "/maestros/precios"}
            className={`border-b-2 px-3 py-1.5 text-xs ${
              vistaActiva === p.valor
                ? "border-tinta text-tinta"
                : "border-transparent text-tinta-2 hover:text-tinta"
            }`}
          >
            {p.etiqueta}
          </Link>
        ))}
      </div>

      {vistaActiva === "mano-obra" ? (
        <PrecioManoObra ctx={ctx} />
      ) : (
        <PrecioIndividual ctx={ctx} anio={anioConsulta} codigo={codigo} editable={editable} />
      )}
    </div>
  );
}

async function PrecioManoObra({ ctx }: { ctx: ContextoAcceso }) {
  const actividades = await repositorioMaestros.listarManoObra(ctx);
  return <TablaManoObra filas={actividades} />;
}

async function PrecioIndividual({
  ctx,
  anio,
  codigo,
  editable,
}: {
  ctx: ContextoAcceso;
  anio: number;
  codigo?: string;
  editable: boolean;
}) {
  const sucursales = await repositorioMaestros.listarSucursales(ctx);
  const filas = codigo
    ? await Promise.all(
        sucursales.map(async (s) => ({ sucursal: s, resuelto: await repositorioMaestros.resolverPrecio(ctx, codigo, s, anio) })),
      )
    : [];

  return (
    <>
      <p className="mb-3 text-[11px] text-tinta-3">
        Formato ancho: un registro por (artículo, sucursal). Año consultado: {anio}.
        {editable && " Haga clic en un precio para fijar un valor manual."}
      </p>
      <form method="GET" className="mb-4">
        <input
          name="codigo"
          defaultValue={codigo}
          placeholder="Código de artículo (p. ej. 61001)"
          className="w-72 rounded-sm border border-hairline bg-panel px-2 py-1.5 text-xs text-tinta"
        />
      </form>

      {codigo && <TablaPrecios codigo={codigo} anio={anio} editable={editable} filas={filas} />}
    </>
  );
}
