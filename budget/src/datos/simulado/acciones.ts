"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { USUARIOS_DEMO } from "./usuarios";
import { COOKIE_ANIO, COOKIE_SUCURSAL, COOKIE_USUARIO } from "./sesion";

const UN_ANIO_SEGUNDOS = 60 * 60 * 24 * 365;

export async function iniciarSesionComo(usuarioId: string) {
  if (!USUARIOS_DEMO.some((u) => u.usuarioId === usuarioId)) {
    throw new Error(`Usuario demo desconocido: ${usuarioId}`);
  }
  const almacen = await cookies();
  almacen.set(COOKIE_USUARIO, usuarioId, { maxAge: UN_ANIO_SEGUNDOS, path: "/" });
  redirect("/contexto");
}

export async function establecerContextoPrecio(sucursal: string, anio: number) {
  const almacen = await cookies();
  almacen.set(COOKIE_SUCURSAL, sucursal, { maxAge: UN_ANIO_SEGUNDOS, path: "/" });
  almacen.set(COOKIE_ANIO, String(anio), { maxAge: UN_ANIO_SEGUNDOS, path: "/" });
  redirect("/presupuestos");
}

export async function cerrarSesion() {
  const almacen = await cookies();
  almacen.delete(COOKIE_USUARIO);
  almacen.delete(COOKIE_SUCURSAL);
  almacen.delete(COOKIE_ANIO);
  redirect("/ingresar");
}
