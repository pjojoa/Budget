import { TituloDoc, Intro, Seccion, Lista, Nota } from "@/componentes/documentacion/Doc";

export default function PaginaVersionado() {
  return (
    <>
      <TituloDoc>Versionado y aprobación</TituloDoc>
      <Intro>
        Un presupuesto aprobado nunca se edita en sitio: cualquier cambio posterior (una corrección, un reprecio a
        otra sucursal o año) crea una versión nueva. Esta sección cubre el historial, el comparador, el reprecio y
        el ciclo de estados por el que pasa cada versión.
      </Intro>

      <Seccion titulo="El ciclo de estados">
        <p>Cada versión de un presupuesto pasa por hasta tres estados, en este orden:</p>
        <Lista>
          <li>
            <strong className="text-tinta">Borrador</strong> — el Presupuestador la crea y la edita libremente.
          </li>
          <li>
            <strong className="text-tinta">En revisión</strong> — el Presupuestador la envía con el botón{" "}
            <strong className="text-tinta">Enviar a revisión</strong>, junto a los indicadores de la cabecera. A
            partir de aquí ya no es editable.
          </li>
          <li>
            <strong className="text-tinta">Aprobado</strong> — el estado final. Solo Director Nacional CPC puede
            llegar aquí con el botón <strong className="text-tinta">Aprobar</strong>, y solo si no quedan hallazgos
            Error abiertos.
          </li>
        </Lista>
        <p>
          Desde &quot;En revisión&quot;, cualquiera de los dos directores (Sucursal o Nacional) puede{" "}
          <strong className="text-tinta">devolver a borrador</strong> si algo necesita corregirse — es el paso de
          filtro antes de llegar a Director Nacional CPC.
        </p>
        <Nota>
          Los botones de esta cabecera solo aparecen si tu perfil tiene permiso para esa transición concreta y el
          presupuesto está en el estado que la permite — no hace falta memorizar quién puede qué, la pantalla solo
          ofrece lo que corresponde.
        </Nota>
      </Seccion>

      <Seccion titulo="Historial de versiones">
        <p>
          La pestaña <strong className="text-tinta">Versiones</strong> lista todas las versiones del mismo proyecto
          con su estado, sucursal/año y total. Desde ahí se abre el comparador contra cualquier otra versión.
        </p>
      </Seccion>

      <Seccion titulo="Comparador">
        <p>
          Muestra, capítulo por capítulo, el valor en la versión A, el valor en la versión B y la diferencia (con
          flecha y porcentaje). Las diferencias por encima del 1% se resaltan para que salten a la vista primero.
        </p>
      </Seccion>

      <Seccion titulo="Repreciar">
        <p>
          Reprecio recalcula el presupuesto con el catálogo de precios de otra sucursal y/o año. El flujo es:
        </p>
        <Lista>
          <li>Elegir sucursal y año destino y pulsar &quot;Previsualizar&quot;.</li>
          <li>
            Revisar el impacto: cuántos insumos cambiaron de precio, cuántos quedaron sin precio en el destino, y la
            variación total.
          </li>
          <li>
            &quot;Generar versión con estos precios&quot; crea una versión nueva en Borrador con esos precios — la
            versión original queda intacta, con su propio estado y su propio total.
          </li>
        </Lista>
      </Seccion>
    </>
  );
}
