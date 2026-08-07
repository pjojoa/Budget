"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Tema = "claro" | "oscuro" | "sistema";
type TemaResuelto = "claro" | "oscuro";

const CLAVE_ALMACENAMIENTO = "budget.tema";

type ContextoTema = {
  tema: Tema;
  temaResuelto: TemaResuelto;
  establecerTema: (tema: Tema) => void;
};

const contextoTema = createContext<ContextoTema | null>(null);

function resolverTema(tema: Tema): TemaResuelto {
  if (tema === "sistema") {
    if (typeof window === "undefined") return "oscuro";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
  }
  return tema;
}

/**
 * Script bloqueante que se ejecuta antes del primer paint para evitar el
 * parpadeo de tema. Debe ser el primer hijo de <body>.
 */
export function GuionAntiParpadeo() {
  const codigo = `
    (function () {
      try {
        var clave = ${JSON.stringify(CLAVE_ALMACENAMIENTO)};
        var guardado = localStorage.getItem(clave) || "sistema";
        var oscuro = guardado === "oscuro" ||
          (guardado === "sistema" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);
        document.documentElement.setAttribute("data-tema", oscuro ? "oscuro" : "claro");
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: codigo }} />;
}

export function ProveedorTema({ children }: { children: ReactNode }) {
  const [tema, setTemaState] = useState<Tema>("sistema");
  const [temaResuelto, setTemaResuelto] = useState<TemaResuelto>("oscuro");

  useEffect(() => {
    const guardado = (localStorage.getItem(CLAVE_ALMACENAMIENTO) as Tema | null) ?? "sistema";
    setTemaState(guardado);
    setTemaResuelto(resolverTema(guardado));
  }, []);

  useEffect(() => {
    if (tema !== "sistema") return;
    const medio = window.matchMedia("(prefers-color-scheme: dark)");
    const escuchar = () => setTemaResuelto(resolverTema("sistema"));
    medio.addEventListener("change", escuchar);
    return () => medio.removeEventListener("change", escuchar);
  }, [tema]);

  useEffect(() => {
    const resuelto = resolverTema(tema);
    setTemaResuelto(resuelto);
    document.documentElement.setAttribute("data-tema", resuelto);
    document.documentElement.style.colorScheme = resuelto === "oscuro" ? "dark" : "light";
  }, [tema]);

  const establecerTema = useCallback((nuevo: Tema) => {
    setTemaState(nuevo);
    localStorage.setItem(CLAVE_ALMACENAMIENTO, nuevo);
  }, []);

  const valor = useMemo(
    () => ({ tema, temaResuelto, establecerTema }),
    [tema, temaResuelto, establecerTema],
  );

  return <contextoTema.Provider value={valor}>{children}</contextoTema.Provider>;
}

export function useTema(): ContextoTema {
  const ctx = useContext(contextoTema);
  if (!ctx) throw new Error("useTema debe usarse dentro de <ProveedorTema>");
  return ctx;
}
