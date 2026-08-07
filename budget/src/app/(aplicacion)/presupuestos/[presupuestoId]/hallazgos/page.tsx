import { repositorioAnalisis } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";
import { puedeAprobar } from "@/datos/contexto";
import { BadgeSeveridad } from "@/componentes/dominio/Insignias";
import { revalidatePath } from "next/cache";
import type { Hallazgo, Severidad } from "@/dominio/tipos";

const ETIQUETA_SEVERIDAD: Record<Severidad, string> = {
  ERROR: "Error",
  AVISO: "Aviso",
  INFO: "Info",
};

export default async function PaginaHallazgos({ params }: { params: Promise<{ presupuestoId: string }> }) {
  const { presupuestoId } = await params;
  const ctx = await obtenerContextoActual();
  const hallazgos = await repositorioAnalisis.hallazgos(ctx, presupuestoId);
  const puedeJustificar = puedeAprobar(ctx);

  const abiertos = hallazgos.filter((h) => h.estado === "ABIERTO");
  const resueltos = hallazgos.filter((h) => h.estado !== "ABIERTO");
  const grupos: { severidad: Severidad; filas: Hallazgo[] }[] = (["ERROR", "AVISO", "INFO"] as const)
    .map((severidad) => ({ severidad, filas: abiertos.filter((h) => h.severidad === severidad) }))
    .filter((g) => g.filas.length > 0);
  const errores = abiertos.filter((h) => h.severidad === "ERROR");
  const avisos = abiertos.filter((h) => h.severidad === "AVISO");
  const infos = abiertos.filter((h) => h.severidad === "INFO");

  async function justificar(formData: FormData) {
    "use server";
    const hallazgoId = String(formData.get("hallazgoId"));
    const justificacion = String(formData.get("justificacion") ?? "");
    const contexto = await obtenerContextoActual();
    await repositorioAnalisis.justificarHallazgo(contexto, presupuestoId, hallazgoId, justificacion);
    revalidatePath(`/presupuestos/${presupuestoId}/hallazgos`);
  }

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-4">
        <h1 className="font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">Hallazgos</h1>
        <p className="text-[11px] text-tinta-2">
          {errores.length} error(es) · {avisos.length} aviso(s) · {infos.length} info
          {errores.length > 0 && (
            <span className="ml-2 text-error">— bloquea la aprobación mientras estén abiertos</span>
          )}
        </p>
      </div>

      {grupos.length === 0 && <p className="text-xs text-tinta-3">No hay hallazgos abiertos.</p>}

      <div className="space-y-6">
        {grupos.map((g) => (
          <section key={g.severidad}>
            <h2 className="mb-1.5 flex items-center gap-2 font-condensada text-xs font-semibold uppercase tracking-wide text-tinta-2">
              {ETIQUETA_SEVERIDAD[g.severidad]}
              <span className="text-tinta-3">({g.filas.length})</span>
            </h2>
            <div className="space-y-1.5">
              {g.filas.map((h) => (
                <div key={h.id} className="flex items-start gap-3 border-b border-hairline py-2 text-xs">
                  <BadgeSeveridad severidad={h.severidad} title={h.regla} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-tinta-2">{h.codigo}</span>
                      <span className="font-condensada text-[10px] uppercase tracking-wide text-tinta-3">
                        {h.regla}
                      </span>
                    </div>
                    <p className="text-tinta">{h.mensaje}</p>
                    {h.severidad !== "INFO" &&
                      (puedeJustificar ? (
                        <form action={justificar} className="mt-1.5 flex items-center gap-2">
                          <input type="hidden" name="hallazgoId" value={h.id} />
                          <input
                            name="justificacion"
                            required
                            minLength={20}
                            placeholder="Justificar (mín. 20 caracteres)"
                            title="Mínimo 20 caracteres"
                            className="w-80 rounded-sm border border-hairline bg-panel px-2 py-1 text-xs text-tinta"
                          />
                          <button type="submit" className="text-[11px] text-tinta-2 hover:text-tinta hover:underline">
                            Justificar
                          </button>
                        </form>
                      ) : (
                        <p className="mt-1 text-[11px] text-tinta-3">
                          Solo Director CPC puede justificar hallazgos.
                        </p>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {resueltos.length > 0 && (
          <section>
            <h2 className="mb-1.5 font-condensada text-xs font-semibold uppercase tracking-wide text-tinta-3">
              Resueltos ({resueltos.length})
            </h2>
            <div className="space-y-1.5">
              {resueltos.map((h) => (
                <div key={h.id} className="flex items-start gap-3 border-b border-hairline py-2 text-xs opacity-70">
                  <BadgeSeveridad severidad={h.severidad} title={h.regla} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-tinta-2">{h.codigo}</span>
                      <span className="font-condensada text-[10px] uppercase tracking-wide text-tinta-3">
                        {h.regla}
                      </span>
                      <span className="font-condensada text-[10px] uppercase tracking-wide text-tinta-3">
                        {h.estado}
                      </span>
                    </div>
                    <p className="text-tinta-2">{h.mensaje}</p>
                    {h.justificacion && <p className="mt-0.5 text-tinta-3">Justificación: {h.justificacion}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
