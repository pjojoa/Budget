import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Condensed } from "next/font/google";

export const fuenteUi = IBM_Plex_Sans({
  variable: "--fuente-ui",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const fuenteMono = IBM_Plex_Mono({
  variable: "--fuente-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  display: "swap",
});

export const fuenteCondensada = IBM_Plex_Sans_Condensed({
  variable: "--fuente-condensada",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  display: "swap",
});

export const variablesFuentes = [
  fuenteUi.variable,
  fuenteMono.variable,
  fuenteCondensada.variable,
].join(" ");
