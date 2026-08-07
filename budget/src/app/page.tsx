import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { COOKIE_USUARIO } from "@/datos/simulado/sesion";

export default async function Pagina() {
  const almacen = await cookies();
  redirect(almacen.get(COOKIE_USUARIO) ? "/presupuestos" : "/ingresar");
}
