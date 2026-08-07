import { TituloDoc, Intro, Seccion, Tecla } from "@/componentes/documentacion/Doc";

const ATAJOS_NAVEGACION: [React.ReactNode, string][] = [
  [<Tecla key="1">↑ ↓ ← →</Tecla>, "Mover la celda activa"],
  [<><Tecla>Ctrl</Tecla>+<Tecla>→</Tecla> / <Tecla>Ctrl</Tecla>+<Tecla>←</Tecla></>, "Expandir / colapsar (colapsado: sube al padre)"],
  [<><Tecla>Ctrl</Tecla>+<Tecla>Shift</Tecla>+<Tecla>E</Tecla></>, "Expandir o colapsar todo"],
  [<><Tecla>Tab</Tecla> / <Tecla>Shift</Tecla>+<Tecla>Tab</Tecla></>, "Celda siguiente / anterior (salta de fila al final)"],
  [<><Tecla>Inicio</Tecla> / <Tecla>Fin</Tecla></>, "Primera / última columna de la fila"],
  [<><Tecla>Ctrl</Tecla>+<Tecla>Inicio</Tecla> / <Tecla>Ctrl</Tecla>+<Tecla>Fin</Tecla></>, "Primera / última fila del presupuesto"],
  [<><Tecla>RePág</Tecla> / <Tecla>AvPág</Tecla></>, "Mover 20 filas"],
  [<><Tecla>Ctrl</Tecla>+<Tecla>F</Tecla></>, "Enfocar el filtro"],
];

const ATAJOS_EDICION: [React.ReactNode, string][] = [
  [<><Tecla>Enter</Tecla> / <Tecla>F2</Tecla></>, "Editar la celda (Enter en una fila N10 abre el panel de APU si la columna no es editable)"],
  ["Escribir un número", "Entra en edición y reemplaza el valor"],
  [<Tecla key="enter">Enter</Tecla>, "Confirma la edición y baja de fila"],
  [<Tecla key="tab">Tab</Tecla>, "Confirma la edición y mueve a la celda siguiente"],
  [<Tecla key="esc">Escape</Tecla>, "Cancela la edición"],
  [<><Tecla>Supr</Tecla> / <Tecla>Backspace</Tecla></>, "Limpia la celda (Cantidad → 0, Repeticiones → ×1)"],
  [<><Tecla>Ctrl</Tecla>+<Tecla>Z</Tecla> / <Tecla>Ctrl</Tecla>+<Tecla>Y</Tecla></>, "Deshacer / rehacer (un pegado cuenta como una sola acción)"],
  [<><Tecla>Ctrl</Tecla>+<Tecla>V</Tecla></>, "Pegar desde Excel — con previsualización si es más de una celda"],
  [<><Tecla>Ctrl</Tecla>+<Tecla>S</Tecla></>, "Guardar todos los cambios pendientes"],
  [<><Tecla>Ctrl</Tecla>+<Tecla>B</Tecla></>, "Buscar artículo"],
];

function TablaAtajos({ filas }: { filas: [React.ReactNode, string][] }) {
  return (
    <table className="tabla">
      <thead>
        <tr>
          <th>Tecla</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
        {filas.map(([tecla, accion], i) => (
          <tr key={i}>
            <td>{tecla}</td>
            <td className="text-tinta-2">{accion}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function PaginaAtajosTeclado() {
  return (
    <>
      <TituloDoc>Atajos de teclado</TituloDoc>
      <Intro>
        Todos los atajos operan sobre el árbol de presupuesto, en la pestaña Árbol de un presupuesto en Borrador.
      </Intro>

      <Seccion titulo="Navegación">
        <TablaAtajos filas={ATAJOS_NAVEGACION} />
      </Seccion>

      <Seccion titulo="Edición">
        <TablaAtajos filas={ATAJOS_EDICION} />
      </Seccion>
    </>
  );
}
