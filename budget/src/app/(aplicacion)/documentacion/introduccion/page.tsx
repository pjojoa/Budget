import { TituloDoc, Intro, Seccion, Lista, Nota } from "@/componentes/documentacion/Doc";

export default function PaginaIntroduccion() {
  return (
    <>
      <TituloDoc>Introducción</TituloDoc>
      <Intro>
        Budget es la aplicación que reemplaza el Excel con el que hoy se elaboran los presupuestos de obra civil.
        El cálculo lo hace un motor verificado contra obras reales; esta guía explica cómo usar cada pantalla.
      </Intro>

      <Seccion titulo="Cómo entrar">
        <p>
          Hoy no hay contraseña: en <strong className="text-tinta">Ingresar</strong> se elige uno de los perfiles de
          prueba (uno por rol). Después, en <strong className="text-tinta">Sucursal y año</strong> se elige dónde y
          con qué catálogo de precios se va a trabajar — esa elección se congela para el resto de la sesión, porque
          un presupuesto nunca mezcla precios de dos sucursales o dos años.
        </p>
      </Seccion>

      <Seccion titulo="La jerarquía del presupuesto">
        <p>
          Un presupuesto es un árbol de cuatro niveles. El código de cuenta ES la jerarquía — no hay un campo
          &quot;padre&quot; separado, todo se deriva del código:
        </p>
        <Lista>
          <li><strong className="text-tinta">Capítulo (N4)</strong> — p. ej. <span className="font-mono">02000000</span>, &quot;CIMENTACIÓN&quot;.</li>
          <li><strong className="text-tinta">Subcapítulo (N5)</strong> — p. ej. <span className="font-mono">02001000</span>, &quot;EXCAVACIONES Y RELLENOS&quot;.</li>
          <li><strong className="text-tinta">Actividad (N8)</strong> — p. ej. <span className="font-mono">02001001</span>. Su cantidad es un <strong className="text-tinta">multiplicador</strong> (columna &quot;Repeticiones&quot;), no una cantidad de obra — por eso se ve como <span className="font-mono">×20</span>.</li>
          <li><strong className="text-tinta">Subactividad (N10)</strong> — p. ej. <span className="font-mono">02001001.1002</span>. Aquí vive la cantidad de obra real y el análisis de precio unitario (los insumos).</li>
        </Lista>
        <Nota>
          Cantidad y Repeticiones nunca aparecen juntas en una fila: en una fila N10 la celda Repeticiones muestra
          &quot;·&quot;; en una fila N4/N5/N8 la celda Cantidad muestra &quot;·&quot;. Así no hay forma de confundirlas.
        </Nota>
      </Seccion>

      <Seccion titulo="El tema claro/oscuro">
        <p>
          El botón con el ícono en la esquina superior derecha cambia el tema en cualquier pantalla, sin parpadeo:
          cada clic pasa al siguiente (claro → oscuro → según el sistema → claro…).
        </p>
      </Seccion>

      <Seccion titulo="Qué sigue">
        <p>
          Empieza por <strong className="text-tinta">Árbol de presupuesto</strong> si vas a editar un presupuesto, o
          por <strong className="text-tinta">Roles y permisos</strong> si quieres saber qué puedes hacer con tu perfil.
        </p>
      </Seccion>
    </>
  );
}
