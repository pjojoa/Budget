import { notFound } from "next/navigation";
import { d } from "@/dominio/decimal";
import { Moneda } from "@/componentes/dominio/Moneda";
import { Multiplicador } from "@/componentes/dominio/Multiplicador";
import { CodigoCuenta } from "@/componentes/dominio/CodigoCuenta";
import { RailIndentacion } from "@/componentes/dominio/RailIndentacion";
import { BarraIncidencia } from "@/componentes/dominio/BarraIncidencia";
import { Delta } from "@/componentes/dominio/Delta";
import { BadgeOrigenPrecio, BadgeSeveridad, InsigniaEstadoPresupuesto } from "@/componentes/dominio/Insignias";
import { Boton } from "@/componentes/ui/Boton";
import type { EstadoPresupuesto, OrigenPrecio, Severidad } from "@/dominio/tipos";

const ESTADOS: EstadoPresupuesto[] = ["BORRADOR", "EN_REVISION", "APROBADO", "SUPERSEDIDO"];
const ORIGENES: OrigenPrecio[] = ["CATALOGO", "MANUAL", "SUCURSAL_REFERENCIA", "SIN_PRECIO"];
const SEVERIDADES: Severidad[] = ["ERROR", "AVISO", "INFO"];

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 border-b border-hairline pb-6">
      <h2 className="font-condensada text-xs font-semibold uppercase tracking-wide text-tinta-3">{titulo}</h2>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </section>
  );
}

export default function PaginaLaboratorio() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="space-y-6 p-4">
      <h1 className="font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">
        Laboratorio de componentes
      </h1>

      <Seccion titulo="CodigoCuenta — codigo de cuenta">
        <CodigoCuenta codigo="02000000" />
        <CodigoCuenta codigo="02001000" />
        <CodigoCuenta codigo="02001001" />
        <CodigoCuenta codigo="02001001.1002" />
      </Seccion>

      <Seccion titulo="RailIndentacion — por nivel">
        {([4, 5, 8, 10] as const).map((n) => (
          <div key={n} className="flex items-center gap-1 text-xs text-tinta-2">
            <RailIndentacion nivel={n} /> N{n}
          </div>
        ))}
      </Seccion>

      <Seccion titulo="Moneda">
        <Moneda valor={d("28399232614.23")} />
        <Moneda valor={d("2089826.14")} decimales={2} />
        <Moneda valor={null} />
        <Moneda valor={d("1234.5")} provisional />
      </Seccion>

      <Seccion titulo="Multiplicador — repeticiones">
        <Multiplicador valor={d("1")} />
        <Multiplicador valor={d("20")} />
        <Multiplicador valor={d("0")} />
      </Seccion>

      <Seccion titulo="BarraIncidencia">
        <div className="w-40">
          <BarraIncidencia pct={d("4.62")} destacada />
        </div>
        <div className="w-40">
          <BarraIncidencia pct={d("0.03")} />
        </div>
      </Seccion>

      <Seccion titulo="Delta">
        <Delta anterior={d("28399232614.23")} nuevo={d("28425263498.95")} />
        <Delta anterior={d("28399232614.23")} nuevo={d("28000000000")} />
        <Delta anterior={d("100")} nuevo={d("100")} />
      </Seccion>

      <Seccion titulo="BadgeOrigenPrecio">
        {ORIGENES.map((o) => (
          <BadgeOrigenPrecio key={o} origen={o} />
        ))}
      </Seccion>

      <Seccion titulo="BadgeSeveridad">
        {SEVERIDADES.map((s) => (
          <BadgeSeveridad key={s} severidad={s} />
        ))}
      </Seccion>

      <Seccion titulo="InsigniaEstadoPresupuesto">
        {ESTADOS.map((e) => (
          <InsigniaEstadoPresupuesto key={e} estado={e} />
        ))}
      </Seccion>

      <Seccion titulo="Boton">
        <Boton variante="primario">Primario</Boton>
        <Boton variante="secundario">Secundario</Boton>
        <Boton variante="fantasma">Fantasma</Boton>
        <Boton variante="peligro">Peligro</Boton>
        <Boton disabled>Deshabilitado</Boton>
      </Seccion>
    </div>
  );
}
