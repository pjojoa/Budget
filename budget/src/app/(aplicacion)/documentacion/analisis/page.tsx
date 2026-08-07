import { TituloDoc, Intro, Seccion, Lista, Nota } from "@/componentes/documentacion/Doc";

export default function PaginaAnalisis() {
  return (
    <>
      <TituloDoc>Análisis</TituloDoc>
      <Intro>
        Tres pestañas del presupuesto para entender de dónde sale el costo y qué falta corregir antes de aprobarlo.
      </Intro>

      <Seccion titulo="Resumen ejecutivo">
        <p>
          Un capítulo por fila, ordenado de mayor a menor valor total, con su incidencia (% del presupuesto) y el
          valor por metro cuadrado. Pensado para una lectura rápida de dónde está concentrado el costo.
        </p>
      </Seccion>

      <Seccion titulo="Explosión de insumos">
        <p>
          Lista cada insumo distinto (material, mano de obra, equipo, transporte) usado en todo el presupuesto,
          ordenado por importe, con su porcentaje individual y el porcentaje acumulado.
        </p>
        <p>
          La línea marcada es el <strong className="text-tinta">corte de Pareto</strong>: normalmente un grupo
          pequeño de insumos (por debajo del 20% del total de insumos distintos) concentra el 80% del costo — esos
          son los precios que más vale la pena revisar primero.
        </p>
      </Seccion>

      <Seccion titulo="Hallazgos">
        <p>
          Los hallazgos son las inconsistencias que detecta la validación contra el maestro (un artículo que no
          existe, una cuenta fuera del maestro, un código con formato inválido, precios distintos para el mismo
          insumo, etc.). Se agrupan por severidad:
        </p>
        <Lista>
          <li><strong className="text-error">Error</strong> — bloquea la aprobación mientras esté abierto.</li>
          <li><strong className="text-aviso">Aviso</strong> — no bloquea, pero debería revisarse.</li>
          <li><strong className="text-tinta">Info</strong> — solo informativo.</li>
        </Lista>
        <p>
          Un hallazgo Error o Aviso se puede <strong className="text-tinta">justificar</strong> con una nota de al
          menos 20 caracteres — solo Director Sucursal CPC o Director Nacional CPC pueden hacerlo. Los hallazgos
          justificados o corregidos pasan a la sección &quot;Resueltos&quot;, aparte de los abiertos.
        </p>
        <Nota>
          Mientras haya al menos un hallazgo Error abierto, el presupuesto no se puede aprobar — es el único control
          de calidad no negociable sobre el que se construye el flujo de aprobación.
        </Nota>
      </Seccion>
    </>
  );
}
