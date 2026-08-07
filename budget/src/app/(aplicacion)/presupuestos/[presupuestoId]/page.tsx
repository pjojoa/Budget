import { redirect } from "next/navigation";

export default async function PaginaPresupuesto({ params }: { params: Promise<{ presupuestoId: string }> }) {
  const { presupuestoId } = await params;
  redirect(`/presupuestos/${presupuestoId}/arbol`);
}
