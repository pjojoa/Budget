"use client";

import * as DialogoPrimitivo from "@radix-ui/react-dialog";

interface Props {
  abierto: boolean;
  onCambiarAbierto: (abierto: boolean) => void;
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
  ancho?: "sm" | "md" | "lg";
}

const ANCHO: Record<NonNullable<Props["ancho"]>, string> = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
};

export function Dialogo({ abierto, onCambiarAbierto, titulo, descripcion, children, ancho = "md" }: Props) {
  return (
    <DialogoPrimitivo.Root open={abierto} onOpenChange={onCambiarAbierto}>
      <DialogoPrimitivo.Portal>
        <DialogoPrimitivo.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <DialogoPrimitivo.Content
          className={`fixed left-1/2 top-1/2 z-50 w-full ${ANCHO[ancho]} -translate-x-1/2 -translate-y-1/2 rounded-md border border-hairline bg-panel p-4 shadow-lg focus:outline-none`}
        >
          <DialogoPrimitivo.Title className="font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">
            {titulo}
          </DialogoPrimitivo.Title>
          {descripcion && <DialogoPrimitivo.Description className="mt-1 text-xs text-tinta-2">{descripcion}</DialogoPrimitivo.Description>}
          <div className="mt-3">{children}</div>
        </DialogoPrimitivo.Content>
      </DialogoPrimitivo.Portal>
    </DialogoPrimitivo.Root>
  );
}
