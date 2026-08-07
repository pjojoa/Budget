import type { Metadata } from "next";
import { GuionAntiParpadeo, ProveedorTema } from "@/componentes/layout/ProveedorTema";
import { variablesFuentes } from "@/estilos/fuentes";
import "./globals.css";

export const metadata: Metadata = {
  title: "Budget",
  description: "Presupuestos de obra civil — Marval",
};

export default function LayoutRaiz({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${variablesFuentes} h-full`} suppressHydrationWarning>
      <body className="h-full font-ui antialiased">
        <GuionAntiParpadeo />
        <ProveedorTema>{children}</ProveedorTema>
      </body>
    </html>
  );
}
