import type { ContextoAcceso } from "../contexto";

/**
 * En el esqueleto no hay autenticación real (Fase 2+): la pantalla
 * `(autenticacion)/ingresar` deja elegir uno de estos perfiles para poder
 * probar las reglas de permisos (aislamiento por sucursal, quién aprueba,
 * quién administra maestros) sin un backend de sesión.
 */
export const USUARIOS_DEMO: ContextoAcceso[] = [
  {
    usuarioId: "u-director-nacional",
    nombre: "Director Nacional CPC",
    roles: ["DIRECTOR_NACIONAL_CPC"],
    sucursales: [],
  },
  {
    usuarioId: "u-director-sucursal-cali",
    nombre: "Director Sucursal CPC — Cali",
    roles: ["DIRECTOR_SUCURSAL_CPC"],
    sucursales: ["CALI"],
  },
  {
    usuarioId: "u-presupuestador-cali",
    nombre: "Presupuestador — Cali",
    roles: ["PRESUPUESTADOR"],
    sucursales: ["CALI"],
  },
  {
    usuarioId: "u-admin-maestros",
    nombre: "Admin Maestros",
    roles: ["ADMIN_MAESTROS"],
    sucursales: [],
  },
];

export const CONTEXTO_POR_DEFECTO = USUARIOS_DEMO[2];
