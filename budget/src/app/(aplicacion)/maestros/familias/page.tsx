import { repositorioMaestros } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";

export default async function PaginaFamilias() {
  const ctx = await obtenerContextoActual();
  const familias = await repositorioMaestros.listarFamilias(ctx);

  return (
    <div className="p-4">
      <h1 className="mb-3 font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">
        Familias <span className="text-tinta-3">({familias.length})</span>
      </h1>
      <table className="w-full max-w-lg border-collapse text-xs">
        <thead>
          <tr className="border-b border-hairline text-left font-condensada uppercase tracking-wide text-tinta-3">
            <th className="py-1.5 pr-3 font-medium">Código</th>
            <th className="py-1.5 pr-3 font-medium">Nombre</th>
            <th className="py-1.5 pr-3 text-right font-medium">Artículos</th>
          </tr>
        </thead>
        <tbody>
          {familias.map((f) => (
            <tr key={f.codigo} className="border-b border-hairline hover:bg-fila">
              <td className="py-1.5 pr-3 font-mono text-tinta">{f.codigo}</td>
              <td className="py-1.5 pr-3 text-tinta-2">{f.nombre}</td>
              <td className="cifra py-1.5 pr-3">{f.nArticulos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
