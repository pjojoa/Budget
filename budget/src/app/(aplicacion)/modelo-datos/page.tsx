import { cargarMaestros } from "@/datos/simulado/cargarMaestros";
import { cargarObras } from "@/datos/simulado/cargarObras";
import { TituloDoc, Intro, Seccion, Nota } from "@/componentes/documentacion/Doc";
import { DiagramaEntidades } from "@/componentes/modelo-datos/DiagramaEntidades";

export default function PaginaModeloDatos() {
  const { articulos, cuentas, familias, sucursales, precios, manoObra } = cargarMaestros();
  const obras = cargarObras();

  return (
    <div className="mx-auto max-w-6xl p-6">
      <TituloDoc>Modelo de datos</TituloDoc>
      <Intro>
        Hoy no hay una base de datos real conectada: los datos viven en los 6 CSV del maestro y en los JSON de cada
        presupuesto, bajo <span className="font-mono text-tinta-3">budget/datos-mock/</span> — ya no dependen de los
        Excel originales de Marval (se transformaron una sola vez y esos archivos fuente se eliminaron de la raíz del
        repo). Los conteos de esta
        página se leen en cada visita de esos mismos archivos — si el maestro o un presupuesto cambian, esta pantalla
        lo refleja sin que nadie la actualice a mano. El modelo relacional de abajo es el contrato de TypeScript
        actual (<span className="font-mono text-tinta-3">src/dominio/tipos.ts</span> y{" "}
        <span className="font-mono text-tinta-3">src/datos/tipos.ts</span>) — es el mismo contrato que se convertirá
        en el esquema real de Supabase en la siguiente fase, así que si ese contrato cambia, esta página se debe
        actualizar junto con él.
      </Intro>

      <Seccion titulo="Fuentes de datos disponibles hoy">
        <table className="tabla">
          <thead>
            <tr>
              <th>Fuente</th>
              <th>Archivo</th>
              <th data-alinear="der">Filas</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Sucursales</td>
              <td className="font-mono text-tinta-3">01_sucursales.csv</td>
              <td className="cifra">{sucursales.length}</td>
            </tr>
            <tr>
              <td>Familias</td>
              <td className="font-mono text-tinta-3">02_familias.csv</td>
              <td className="cifra">{familias.length}</td>
            </tr>
            <tr>
              <td>Artículos</td>
              <td className="font-mono text-tinta-3">03_articulos.csv</td>
              <td className="cifra">{articulos.length.toLocaleString("es-CO")}</td>
            </tr>
            <tr>
              <td>Cuentas</td>
              <td className="font-mono text-tinta-3">04_cuentas.csv</td>
              <td className="cifra">{cuentas.length.toLocaleString("es-CO")}</td>
            </tr>
            <tr>
              <td>Precios</td>
              <td className="font-mono text-tinta-3">05_precios.csv</td>
              <td className="cifra">{precios.size.toLocaleString("es-CO")}</td>
            </tr>
            <tr>
              <td>Mano de obra (no inventariable)</td>
              <td className="font-mono text-tinta-3">06_mano_obra_precios.csv</td>
              <td className="cifra">{manoObra.length.toLocaleString("es-CO")}</td>
            </tr>
          </tbody>
        </table>

        <p className="mt-4 mb-1 font-condensada text-[11px] uppercase tracking-wide text-tinta-3">
          Presupuestos cargados
        </p>
        <table className="tabla">
          <thead>
            <tr>
              <th>Proyecto</th>
              <th>Versión</th>
              <th>Estado</th>
              <th>Sucursal / año</th>
              <th data-alinear="der">Líneas</th>
              <th data-alinear="der">Insumos</th>
              <th data-alinear="der">Hallazgos</th>
            </tr>
          </thead>
          <tbody>
            {obras.map(({ id, obra, hallazgos }) => {
              const nInsumos = obra.lineas.reduce((acc, l) => acc + (l.insumos?.length ?? 0), 0);
              return (
                <tr key={id}>
                  <td>{obra.meta.proyecto}</td>
                  <td>v{obra.meta.version}</td>
                  <td className="text-tinta-3">{obra.meta.estado}</td>
                  <td className="text-tinta-3">
                    {obra.meta.sucursal} · {obra.meta.anioPrecios}
                  </td>
                  <td className="cifra">{obra.lineas.length}</td>
                  <td className="cifra">{nInsumos.toLocaleString("es-CO")}</td>
                  <td className="cifra">{hallazgos.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <Nota>
          Supabase todavía no está conectado — <span className="font-mono">src/datos/supabase/repositorioSupabase.ts</span> tiene
          las firmas listas pero cada método lanza &quot;pendiente de implementar&quot;. Cuando se conecte, reemplazará a
          las de arriba — dejarán de ser CSV/JSON en disco.
        </Nota>
      </Seccion>

      <Seccion titulo="Modelo relacional">
        <p>
          No hay claves foráneas declaradas. Línea sólida = contención real (un arreglo anidado, p. ej. los insumos
          dentro de una línea); línea punteada = relación resuelta por código en tiempo de ejecución, no un id
          almacenado. Arrastra las tarjetas para reacomodarlas; la rueda del mouse hace zoom.
        </p>
        <div className="mt-3">
          <DiagramaEntidades />
        </div>
      </Seccion>
    </div>
  );
}
