import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { BarraSuperior } from "@/componentes/layout/BarraSuperior";
import { BarraLateral } from "@/componentes/layout/BarraLateral";
import { COOKIE_USUARIO, obtenerContextoActual, obtenerContextoPrecioActual } from "@/datos/simulado/sesion";

export default async function LayoutAplicacion({ children }: { children: React.ReactNode }) {
  const almacen = await cookies();
  if (!almacen.get(COOKIE_USUARIO)) redirect("/ingresar");

  const ctx = await obtenerContextoActual();
  const { sucursal, anio } = await obtenerContextoPrecioActual();

  return (
    <div className="flex h-full flex-col">
      <BarraSuperior ctx={ctx} sucursalActiva={sucursal} anioActivo={anio} />
      <div className="flex items-center gap-2 border-b border-hairline bg-aviso/10 px-3 py-2 text-xs text-tinta md:hidden">
        <span aria-hidden className="text-aviso">
          ⚠
        </span>
        <span>Budget es una aplicación de escritorio — en pantallas menores a 768px algunas funciones pueden no verse completas.</span>
      </div>
      <div className="flex min-h-0 flex-1">
        <BarraLateral />
        <main className="min-w-0 flex-1 overflow-auto bg-lienzo">{children}</main>
      </div>
      <div aria-live="polite" className="sr-only" id="region-anuncios" />
    </div>
  );
}
