import { Moneda } from "@/componentes/dominio/Moneda";
import { InsigniaEstadoPresupuesto } from "@/componentes/dominio/Insignias";
import type { CabeceraPresupuesto as CabeceraPresupuestoTipo } from "@/datos/tipos";

export function CabeceraPresupuesto({ cabecera }: { cabecera: CabeceraPresupuestoTipo }) {
  const { error, aviso } = cabecera.nHallazgosAbiertos;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">
            {cabecera.proyecto}
          </h1>
          <span className="text-xs text-tinta-3">v{cabecera.version}</span>
          <InsigniaEstadoPresupuesto estado={cabecera.estado} />
          {(error > 0 || aviso > 0) && (
            <span className="text-[11px] text-tinta-2">
              {error > 0 && <span className="text-error">{error} error(es)</span>}
              {error > 0 && aviso > 0 && " · "}
              {aviso > 0 && <span className="text-aviso">{aviso} aviso(s)</span>}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-tinta-3">
          {cabecera.sucursal} · {cabecera.anioPrecios} · {cabecera.plantilla} · {cabecera.nInmuebles} inmuebles ·{" "}
          {cabecera.areaInmuebleM2} m² prom.
        </p>
      </div>
      <div className="flex items-center gap-5 text-right">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-tinta-3">Total</div>
          <Moneda valor={cabecera.total} className="text-sm" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-tinta-3">$/m²</div>
          <Moneda valor={cabecera.valorM2} className="text-sm" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-tinta-3">$/inmueble</div>
          <Moneda valor={cabecera.valorInmueble} className="text-sm" />
        </div>
      </div>
    </div>
  );
}
