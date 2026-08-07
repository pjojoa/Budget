import { iniciarSesionComo } from "@/datos/simulado/acciones";
import { USUARIOS_DEMO } from "@/datos/simulado/usuarios";
import type { Rol } from "@/datos/contexto";

const ETIQUETA_ROL: Record<Rol, string> = {
  DIRECTOR_NACIONAL_CPC: "Director Nacional CPC",
  DIRECTOR_SUCURSAL_CPC: "Director Sucursal CPC",
  PRESUPUESTADOR: "Presupuestador",
  ADMIN_MAESTROS: "Admin Maestros",
};

export default function PaginaIngresar() {
  return (
    <div className="space-y-3 rounded-md border border-hairline bg-panel p-5">
      <p className="text-xs text-tinta-2">
        No hay autenticación real todavía — elige un perfil para probar los permisos por rol y sucursal.
      </p>
      <div className="space-y-1.5">
        {USUARIOS_DEMO.map((u) => (
          <form key={u.usuarioId} action={iniciarSesionComo.bind(null, u.usuarioId)}>
            <button
              type="submit"
              className="flex w-full items-center justify-between rounded-sm border border-hairline px-3 py-2 text-left text-xs text-tinta transition-colors hover:bg-fila"
            >
              <span>{u.nombre}</span>
              <span className="font-condensada text-[11px] uppercase text-tinta-3">
                {u.roles.map((r) => ETIQUETA_ROL[r]).join(", ")}
              </span>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
