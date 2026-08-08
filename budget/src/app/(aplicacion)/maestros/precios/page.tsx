import Link from "next/link";
import { repositorioMaestros } from "@/datos";
import { obtenerContextoActual, obtenerContextoPrecioActual } from "@/datos/simulado/sesion";
import { puedeEditarMaestros } from "@/datos/contexto";
import type { ContextoAcceso } from "@/datos/contexto";
import type { AnioCatalogoMaterial } from "@/datos/tipos";
import { TablaPrecios } from "./TablaPrecios";
import { ArbolManoObra } from "./ArbolManoObra";
import { TablaMateriales } from "./TablaMateriales";
import { SelectorAnioMaterial } from "./SelectorAnioMaterial";

const PESTANAS = [
  { valor: "", etiqueta: "Consulta individual" },
  { valor: "materiales", etiqueta: "Catálogo de Materiales" },
  { valor: "mano-obra", etiqueta: "Catálogo de Mano de Obra" },
] as const;

const ANIOS_CATALOGO: AnioCatalogoMaterial[] = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
const POR_PAGINA_MATERIALES = 50;

export default async function PaginaPrecios({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string; vista?: string; anio?: string; pagina?: string }>;
}) {
  const { codigo, vista, anio: anioTexto, pagina: paginaTexto } = await searchParams;
  const vistaActiva = vista === "mano-obra" ? "mano-obra" : vista === "materiales" ? "materiales" : "";
  const ctx = await obtenerContextoActual();
  const editable = puedeEditarMaestros(ctx);
  const { anio } = await obtenerContextoPrecioActual();
  const anioConsulta = anio ?? 2025;
  const anioMaterial = (ANIOS_CATALOGO.includes(Number(anioTexto) as AnioCatalogoMaterial)
    ? Number(anioTexto)
    : 2026) as AnioCatalogoMaterial;
  const paginaMaterial = Number(paginaTexto ?? 1);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col p-4">
      <h1 className="mb-3 shrink-0 font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">
        Catálogo de precios
      </h1>

      <div className="mb-3 flex shrink-0 items-center gap-1 border-b border-hairline">
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

      <div className="min-h-0 min-w-0 flex-1">
        {vistaActiva === "mano-obra" ? (
          <PrecioManoObra ctx={ctx} />
        ) : vistaActiva === "materiales" ? (
          <PrecioMateriales ctx={ctx} anio={anioMaterial} pagina={paginaMaterial} />
        ) : (
          <PrecioIndividual ctx={ctx} anio={anioConsulta} codigo={codigo} editable={editable} />
        )}
      </div>
    </div>
  );
}

async function PrecioManoObra({ ctx }: { ctx: ContextoAcceso }) {
  const actividades = await repositorioMaestros.listarManoObra(ctx);
  return (
    <div className="h-full min-h-0 min-w-0">
      <ArbolManoObra filas={actividades} />
    </div>
  );
}

async function PrecioMateriales({
  ctx,
  anio,
  pagina,
}: {
  ctx: ContextoAcceso;
  anio: AnioCatalogoMaterial;
  pagina: number;
}) {
  const resultado = await repositorioMaestros.buscarMateriales(ctx, {
    pagina,
    porPagina: POR_PAGINA_MATERIALES,
  });
  const totalPaginas = Math.ceil(resultado.total / POR_PAGINA_MATERIALES);

  const acciones = (
    <div className="flex items-center gap-3">
      <SelectorAnioMaterial anio={anio} />
      <div className="flex items-center gap-3 text-xs text-tinta-2">
        {pagina > 1 && (
          <Link
            key="anterior"
            href={`/maestros/precios?vista=materiales&anio=${anio}&pagina=${pagina - 1}`}
            className="hover:text-tinta hover:underline"
          >
            ← Anterior
          </Link>
        )}
        <span key="contador">
          Página {pagina} de {totalPaginas.toLocaleString("es-CO")}
        </span>
        {pagina < totalPaginas && (
          <Link
            key="siguiente"
            href={`/maestros/precios?vista=materiales&anio=${anio}&pagina=${pagina + 1}`}
            className="hover:text-tinta hover:underline"
          >
            Siguiente →
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <p className="mb-3 shrink-0 text-[11px] text-tinta-3">
        {resultado.total.toLocaleString("es-CO")} materiales · precios por sucursal para el año {anio}
        {anio > 2026 && " (proyectado)"}. Útil al armar un APU.
      </p>
      <div className="min-h-0 min-w-0 flex-1">
        <TablaMateriales filas={resultado.filas} anio={anio} acciones={acciones} />
      </div>
    </div>
  );
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
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <p className="mb-3 shrink-0 text-[11px] text-tinta-3">
        Formato ancho: un registro por (artículo, sucursal). Año consultado: {anio}.
        {editable && " Haga clic en un precio para fijar un valor manual."}
      </p>
      <form method="GET" className="mb-4 shrink-0">
        <input
          name="codigo"
          defaultValue={codigo}
          placeholder="Código de artículo (p. ej. 61001)"
          className="w-72 rounded-sm border border-hairline bg-panel px-2 py-1.5 text-xs text-tinta"
        />
      </form>

      {codigo && (
        <div className="min-h-0 min-w-0 flex-1">
          <TablaPrecios codigo={codigo} anio={anio} editable={editable} filas={filas} />
        </div>
      )}
    </div>
  );
}
