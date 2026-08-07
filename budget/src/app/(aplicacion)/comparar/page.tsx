import { repositorioAnalisis, repositorioPresupuestos } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";
import { CodigoCuenta } from "@/componentes/dominio/CodigoCuenta";
import { Moneda } from "@/componentes/dominio/Moneda";
import { Delta } from "@/componentes/dominio/Delta";

export default async function PaginaComparadorLibre({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;
  const ctx = await obtenerContextoActual();
  const { filas: presupuestos } = await repositorioPresupuestos.listar(ctx, {});

  return (
    <div className="p-4">
      <h1 className="mb-3 font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">Comparador</h1>
      <form method="GET" className="mb-4 flex items-end gap-3 rounded-sm border border-hairline bg-panel p-3 text-xs">
        <label className="text-tinta-2">
          Presupuesto A
          <select name="a" defaultValue={a} className="mt-1 block rounded-sm border border-hairline bg-lienzo px-2 py-1.5 text-tinta">
            {presupuestos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.proyecto} v{p.version}
              </option>
            ))}
          </select>
        </label>
        <label className="text-tinta-2">
          Presupuesto B
          <select name="b" defaultValue={b} className="mt-1 block rounded-sm border border-hairline bg-lienzo px-2 py-1.5 text-tinta">
            {presupuestos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.proyecto} v{p.version}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-sm bg-tinta px-3 py-1.5 text-xs font-medium text-lienzo">
          Comparar
        </button>
      </form>

      {a && b && <ResultadoComparacion idA={a} idB={b} />}
    </div>
  );
}

async function ResultadoComparacion({ idA, idB }: { idA: string; idB: string }) {
  const ctx = await obtenerContextoActual();
  const filas = await repositorioAnalisis.comparar(ctx, idA, idB, 5);

  if (filas.length === 0) {
    return <p className="text-xs text-tinta-2">Sin diferencias a nivel de capítulo.</p>;
  }

  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="border-b border-hairline text-left font-condensada uppercase tracking-wide text-tinta-3">
          <th className="py-1.5 pr-3 font-medium">Código</th>
          <th className="py-1.5 pr-3 font-medium">Descripción</th>
          <th className="py-1.5 pr-3 text-right font-medium">A</th>
          <th className="py-1.5 pr-3 text-right font-medium">B</th>
          <th className="py-1.5 pr-3 text-right font-medium">Delta</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((f) => (
          <tr key={f.codigo} className="border-b border-hairline hover:bg-fila">
            <td className="py-1.5 pr-3">
              <CodigoCuenta codigo={f.codigo} />
            </td>
            <td className="py-1.5 pr-3 text-tinta-2">{f.descripcion}</td>
            <td className="py-1.5 pr-3 text-right">
              <Moneda valor={f.valorA} />
            </td>
            <td className="py-1.5 pr-3 text-right">
              <Moneda valor={f.valorB} />
            </td>
            <td className="py-1.5 pr-3 text-right">
              <Delta anterior={f.valorA} nuevo={f.valorB} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
