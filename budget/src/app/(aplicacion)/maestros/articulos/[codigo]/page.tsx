import { notFound } from "next/navigation";
import { repositorioMaestros } from "@/datos";
import { obtenerContextoActual, obtenerContextoPrecioActual } from "@/datos/simulado/sesion";
import { puedeEditarMaestros } from "@/datos/contexto";
import { DetalleArticulo } from "./DetalleArticulo";

export default async function PaginaArticulo({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const ctx = await obtenerContextoActual();
  const editable = puedeEditarMaestros(ctx);
  const { anio } = await obtenerContextoPrecioActual();
  const anioConsulta = anio ?? 2025;

  const { filas } = await repositorioMaestros.buscarArticulos(ctx, { texto: codigo, porPagina: 5 });
  const articulo = filas.find((a) => a.codigo === codigo);
  if (!articulo) notFound();

  const [sucursales, familias] = await Promise.all([
    repositorioMaestros.listarSucursales(ctx),
    repositorioMaestros.listarFamilias(ctx),
  ]);
  const precios = await Promise.all(
    sucursales.map(async (s) => ({ sucursal: s, resuelto: await repositorioMaestros.resolverPrecio(ctx, codigo, s, anioConsulta) })),
  );

  return (
    <DetalleArticulo
      articulo={articulo}
      familias={familias}
      editable={editable}
      anioConsulta={anioConsulta}
      preciosIniciales={precios}
    />
  );
}
