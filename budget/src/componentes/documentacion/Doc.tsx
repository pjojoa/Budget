import type { ReactNode } from "react";

export function TituloDoc({ children }: { children: ReactNode }) {
  return <h1 className="mb-1 font-condensada text-lg font-semibold uppercase tracking-wide text-tinta">{children}</h1>;
}

export function Intro({ children }: { children: ReactNode }) {
  return <p className="mb-6 text-sm leading-relaxed text-tinta-2">{children}</p>;
}

export function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">{titulo}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-tinta-2">{children}</div>
    </section>
  );
}

export function Lista({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5">{children}</ul>;
}

export function Tecla({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-sm border border-hairline bg-panel px-1.5 py-0.5 font-mono text-[11px] text-tinta">
      {children}
    </kbd>
  );
}

export function Nota({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-sm border border-dashed border-hairline p-2 text-[13px] text-tinta-3">{children}</p>
  );
}
