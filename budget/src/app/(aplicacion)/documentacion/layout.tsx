import { NavegacionDocumentacion } from "@/componentes/layout/NavegacionDocumentacion";

export default function LayoutDocumentacion({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <NavegacionDocumentacion />
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl p-6">{children}</div>
      </div>
    </div>
  );
}
