import { TituloDoc, Intro, Seccion } from "@/componentes/documentacion/Doc";

export default function PaginaRolesPermisos() {
  return (
    <>
      <TituloDoc>Roles y permisos</TituloDoc>
      <Intro>
        Budget tiene cuatro roles. Cada uno ve las mismas pantallas; lo que cambia es qué acciones puede ejecutar en
        cada una.
      </Intro>

      <Seccion titulo="Director Nacional CPC">
        <p>
          Aprueba presupuestos — es la única cuenta con autoridad para llevar un presupuesto de &quot;En revisión&quot;
          a &quot;Aprobado&quot;, y la única que ve todas las sucursales sin restricción. No crea presupuestos. Le
          interesan sobre todo los indicadores de la cabecera: valor total, valor por unidad ($/inmueble) y valor por
          m².
        </p>
      </Seccion>

      <Seccion titulo="Director Sucursal CPC">
        <p>
          Revisa el presupuesto que crea el Presupuestador de su sucursal — es el filtro antes de que llegue a
          Director Nacional CPC. Puede devolver un presupuesto a borrador si algo necesita corregirse, y también
          puede justificar hallazgos. Puede crear presupuestos igual que el Presupuestador. Trabaja de forma
          colaborativa haciendo seguimiento al avance del Presupuestador (las observaciones puntuales por línea son
          una funcionalidad que todavía no existe en la aplicación).
        </p>
      </Seccion>

      <Seccion titulo="Presupuestador">
        <p>
          Crea y edita el presupuesto: es el único rol que puede modificar cantidades y repeticiones en el árbol, y
          quien envía el presupuesto a revisión cuando está listo.
        </p>
      </Seccion>

      <Seccion titulo="Admin Maestros">
        <p>
          Mantiene el maestro (cuentas, artículos y el resto de catálogos) que alimenta todos los presupuestos. No
          participa en la creación ni aprobación de presupuestos. Hoy puede editar la descripción, la unidad de
          medida y el estado activa/inactiva de una cuenta desde el árbol de cuentas — crear o eliminar cuentas y
          artículos todavía no está implementado en la aplicación.
        </p>
      </Seccion>
    </>
  );
}
