import { TituloDoc, Intro, Seccion, Lista, Tecla, Nota } from "@/componentes/documentacion/Doc";

export default function PaginaArbolPresupuesto() {
  return (
    <>
      <TituloDoc>Árbol de presupuesto</TituloDoc>
      <Intro>
        Es la pantalla principal de un presupuesto (pestaña <strong className="text-tinta">Árbol</strong>). Está
        pensada para trabajarse con teclado, como una hoja de cálculo.
      </Intro>

      <Seccion titulo="Navegar">
        <p>
          El código de cuenta se lee de un vistazo: los segmentos rellenos de ceros se atenúan, así
          <span className="font-mono"> 02000000</span> se ve inmediatamente como &quot;capítulo 02&quot;. El raíl a
          la izquierda del código marca la profundidad de cada fila.
        </p>
        <p>
          Un clic mueve el foco a esa celda. Solo la celda activa es alcanzable con <Tecla>Tab</Tecla> — el resto del
          árbol no interrumpe la navegación.
        </p>
      </Seccion>

      <Seccion titulo="Editar">
        <p>
          Solo las columnas <strong className="text-tinta">Cantidad</strong> (en subactividades, N10) y{" "}
          <strong className="text-tinta">Repeticiones</strong> (en capítulo/subcapítulo/actividad) son editables, y
          solo cuando el presupuesto está en estado <strong className="text-tinta">Borrador</strong>.
        </p>
        <Lista>
          <li>
            <Tecla>Enter</Tecla> o <Tecla>F2</Tecla> entra en edición; escribir un número directamente también entra
            en edición y reemplaza el valor.
          </li>
          <li><Tecla>Enter</Tecla> confirma y baja a la fila siguiente; <Tecla>Tab</Tecla> confirma y mueve a la celda siguiente.</li>
          <li><Tecla>Escape</Tecla> cancela y restaura el valor anterior.</li>
          <li><Tecla>Supr</Tecla> / <Tecla>Backspace</Tecla> limpia la celda (Cantidad a 0, Repeticiones a ×1 — nunca ×0).</li>
          <li><Tecla>Ctrl</Tecla>+<Tecla>Z</Tecla> / <Tecla>Ctrl</Tecla>+<Tecla>Y</Tecla> deshace y rehace, incluido un pegado completo como una sola acción.</li>
        </Lista>
        <Nota>
          Poner Repeticiones en ×0 anula todo el valor de esa rama en silencio — la app lo marca con un aviso, pero
          revisa dos veces antes de dejarlo en cero.
        </Nota>
      </Seccion>

      <Seccion titulo="Los valores mientras editas">
        <p>
          Mientras hay cambios sin guardar, los totales se recalculan al instante en el navegador (&quot;valor
          provisional&quot;) y la barra inferior muestra cuántos cambios hay pendientes y el nuevo total. Al guardar,
          el valor que regresa el servidor siempre reemplaza al provisional — si hay una diferencia mayor a $1, la
          app te avisa.
        </p>
        <p>
          <strong className="text-tinta">Guardar (Ctrl+S)</strong> envía todos los cambios en un solo lote.{" "}
          <strong className="text-tinta">Descartar</strong> los borra sin guardar. No hay autoguardado: nada se
          envía hasta que decides confirmar.
        </p>
      </Seccion>

      <Seccion titulo="Pegar desde Excel">
        <p>
          Copia un rango en Excel, ubica el cursor en la celda destino (la esquina superior-izquierda del rango) y
          pega con <Tecla>Ctrl</Tecla>+<Tecla>V</Tecla>.
        </p>
        <Lista>
          <li>Si es una sola celda, se aplica directamente.</li>
          <li>
            Si es un rango, aparece una <strong className="text-tinta">previsualización</strong>: cuántas celdas se
            van a aplicar, cuántas se ignoran (p. ej. una columna de cantidades que cae sobre una fila de capítulo,
            donde esa columna no es editable) y cuántas tienen un valor no reconocido.
          </li>
          <li>
            Si el pegado toca la columna <strong className="text-tinta">Repeticiones</strong>, la previsualización lo
            advierte explícitamente — vas a multiplicar el importe de esas ramas completas.
          </li>
          <li>El pegado solo llega hasta donde hay filas visibles: si una fila está colapsada, no se pega ahí.</li>
        </Lista>
      </Seccion>

      <Seccion titulo="El panel de APU (análisis de precio unitario)">
        <p>
          Con el foco en una fila de subactividad (N10), en una columna que no es editable, <Tecla>Enter</Tecla> abre
          el panel de insumos de esa línea (materiales, mano de obra, equipo, transporte) con su rendimiento, precio
          y origen del precio. &quot;Abrir en pantalla completa&quot; lleva a la vista dedicada de esa APU.
        </p>
        <p>
          Desde el panel, <Tecla>Ctrl</Tecla>+<Tecla>B</Tecla> abre el buscador de artículos — útil para consultar el
          maestro completo de artículos (más de 20.000) sin salir del presupuesto.
        </p>
      </Seccion>

      <Seccion titulo="Filtrar">
        <p>
          El campo de filtro (<Tecla>Ctrl</Tecla>+<Tecla>F</Tecla> lo enfoca) busca por código o descripción y
          conserva visibles los capítulos/subcapítulos padre de cualquier fila que haga match, para no perder el
          contexto.
        </p>
      </Seccion>
    </>
  );
}
