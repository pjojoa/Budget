import { TituloDoc, Intro, Seccion, Lista, Nota } from "@/componentes/documentacion/Doc";

export default function PaginaDocMaestros() {
  return (
    <>
      <TituloDoc>Maestros</TituloDoc>
      <Intro>
        El maestro es la información de referencia que alimenta todos los presupuestos: qué artículos existen, qué
        cuentas se pueden usar, qué precio tiene cada artículo por sucursal y año. Se encuentra bajo{" "}
        <strong className="text-tinta">Maestros</strong> en el menú lateral.
      </Intro>

      <Seccion titulo="Artículos">
        <p>
          El catálogo completo de materiales, mano de obra, equipo y transporte (más de 20.000 registros). Se busca
          por código o descripción; los resultados siempre están paginados — nunca se carga el maestro completo de
          una vez. Cada artículo tiene una ficha propia con sus precios por sucursal.
        </p>
      </Seccion>

      <Seccion titulo="Cuentas">
        <p>
          El plan de cuentas completo, como árbol plegable/desplegable (igual que el árbol de un presupuesto, pero
          sin cantidades ni valores). Tres pestañas lo agrupan por plantilla:
        </p>
        <Lista>
          <li><strong className="text-tinta">Edificación</strong> — capítulos 01 a 21.</li>
          <li><strong className="text-tinta">Urbanismo interno</strong> — capítulos 22 a 28.</li>
          <li><strong className="text-tinta">Urbanismo externo</strong> — capítulos 29 a 39.</li>
        </Lista>
        <p>
          Admin Maestros puede editar la descripción y la unidad de una cuenta con un clic (se confirma con{" "}
          <span className="font-mono">Enter</span>, se cancela con <span className="font-mono">Escape</span>), y
          activar o desactivar una cuenta con un clic sobre su estado. El resto de roles ve exactamente lo mismo en
          solo lectura.
        </p>
        <Nota>
          El código de una cuenta y su posición en el árbol no son editables aquí: se derivan del propio código, y
          cambiar eso es una operación de estructura, no una corrección de dato.
        </Nota>
      </Seccion>

      <Seccion titulo="Familias">
        <p>
          Las categorías en las que se agrupan los artículos (cementos y cales, aceros, concretos, etc.), con el
          número de artículos que tiene cada una. Algunas familias del maestro real todavía no tienen un nombre
          asignado y se muestran como &quot;Familia N&quot; — es un dato pendiente de completar en el origen, no un
          error de la aplicación.
        </p>
      </Seccion>

      <Seccion titulo="Precios">
        <p>
          Un precio se identifica por artículo + sucursal + año. Se busca por código de artículo y se ve el precio
          resuelto para cada una de las sucursales, junto con su origen (catálogo, manual, de otra sucursal como
          referencia, o sin precio).
        </p>
      </Seccion>

      <Seccion titulo="Sucursales">
        <p>El listado de las sucursales activas — la base de la restricción de precios y de acceso por sucursal.</p>
      </Seccion>
    </>
  );
}
