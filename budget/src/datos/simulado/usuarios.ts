import type { ContextoAcceso } from "../contexto";

/**
 * En el esqueleto no hay autenticación real (Fase 2+): la pantalla
 * `(autenticacion)/ingresar` deja elegir uno de estos perfiles para poder
 * probar las reglas de permisos (aislamiento por sucursal, quién aprueba,
 * quién administra maestros) sin un backend de sesión.
 */
export const USUARIOS_DEMO: ContextoAcceso[] = [
  {
    usuarioId: "u-presupuestador-cali",
    nombre: "Presupuestador — Cali",
    roles: ["PRESUPUESTADOR"],
    sucursales: ["CALI"],
  },
  {
    usuarioId: "u-director-cali",
    nombre: "Director CPC — Cali",
    roles: ["DIRECTOR_CPC"],
    sucursales: ["CALI"],
  },
  {
    usuarioId: "u-presupuestador-bogota",
    nombre: "Presupuestador — Bogotá",
    roles: ["PRESUPUESTADOR"],
    sucursales: ["BOGOTA"],
  },
  {
    usuarioId: "u-admin-maestros",
    nombre: "Administrador de maestros",
    roles: ["ADMIN_MAESTROS"],
    sucursales: [],
  },
  {
    usuarioId: "u-direccion",
    nombre: "Dirección / comité",
    roles: ["DIRECCION"],
    sucursales: [],
  },
  {
    usuarioId: "u-auditoria",
    nombre: "Auditoría",
    roles: ["AUDITORIA"],
    sucursales: [],
  },
];

export const CONTEXTO_POR_DEFECTO = USUARIOS_DEMO[0];
