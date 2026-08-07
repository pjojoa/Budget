"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/base.css";
import { NodoEntidad, type DatosNodoEntidad } from "./NodoEntidad";

const CLAVE_ALMACENAMIENTO = "budget.modelo-datos.posiciones";

function cargarPosicionesGuardadas(): Record<string, { x: number; y: number }> {
  try {
    const crudo = localStorage.getItem(CLAVE_ALMACENAMIENTO);
    return crudo ? JSON.parse(crudo) : {};
  } catch {
    return {};
  }
}

function guardarPosiciones(nodos: Node[]): void {
  try {
    const mapa: Record<string, { x: number; y: number }> = {};
    for (const n of nodos) mapa[n.id] = n.position;
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(mapa));
  } catch {
    // almacenamiento no disponible (privado/bloqueado) — el diagrama sigue
    // funcionando, solo no persiste entre visitas.
  }
}

const NODE_TYPES = { entidad: NodoEntidad };

// Disposición en capas (izquierda→derecha) según la dirección de las
// relaciones, para que ningún borde tenga que cruzar hacia atrás:
// Hallazgo/Precio/ActividadManoObra (sin entrantes) → Obra →
// LineaPresupuesto/Sucursal → Insumo/Cuenta → Articulo → Familia.
// ActividadManoObra vive junto a Precio (mismo patrón: resuelve por código
// contra Articulo y por nombre contra Sucursal, sin FK declarada — es el
// catálogo de mano de obra "no inventariable", ver ArbolManoObra.tsx).
// ContextoAcceso queda aparte, arriba, sin ninguna línea — es la única
// entidad que no persiste.
const NODOS: Node<DatosNodoEntidad>[] = [
  {
    id: "ContextoAcceso",
    type: "entidad",
    position: { x: 940, y: -260 },
    data: {
      nombre: "ContextoAcceso",
      origen: "datos/contexto.ts",
      campos: ["usuarioId, nombre", "roles: Rol[]", "sucursales: Sucursal[]"],
      suelta: true,
    },
  },
  {
    id: "Hallazgo",
    type: "entidad",
    position: { x: 0, y: -70 },
    data: { nombre: "Hallazgo", origen: "dominio/tipos.ts", campos: ["id, severidad, regla", "codigo, mensaje", "estado, justificacion"] },
  },
  {
    id: "Obra",
    type: "entidad",
    position: { x: 300, y: 40 },
    data: { nombre: "Obra", origen: "dominio/tipos.ts", campos: ["meta: MetaPresupuesto", "lineas: LineaPresupuesto[]"] },
  },
  {
    id: "LineaPresupuesto",
    type: "entidad",
    position: { x: 620, y: 40 },
    data: {
      nombre: "LineaPresupuesto",
      origen: "dominio/tipos.ts",
      campos: ["codigo, nivel (4|5|8|10)", "cantidad, valorUnitario, valorTotal", "insumos?: Insumo[] (solo N10)"],
      autoRelacion: "jerarquía N4→N5→N8→N10 por código",
    },
  },
  {
    id: "Insumo",
    type: "entidad",
    position: { x: 960, y: 40 },
    data: { nombre: "Insumo", origen: "dominio/tipos.ts", campos: ["codigo, tipo (MAT|MO|EQ|TC)", "rendimiento, precio, parcial", "origenPrecio"] },
  },
  {
    id: "Articulo",
    type: "entidad",
    position: { x: 1300, y: 40 },
    data: { nombre: "Articulo (maestro)", origen: "datos/tipos.ts", campos: ["codigo, descripcion", "familia, familiaNombre", "activo, nSucursalesConPrecio"] },
  },
  {
    id: "Familia",
    type: "entidad",
    position: { x: 1640, y: 40 },
    data: { nombre: "Familia (maestro)", origen: "datos/tipos.ts", campos: ["codigo, nombre, nArticulos"] },
  },
  {
    id: "Sucursal",
    type: "entidad",
    position: { x: 300, y: 320 },
    data: { nombre: "Sucursal", origen: "datos/tipos.ts", campos: ["codigo, nombre, activa"] },
  },
  {
    id: "Cuenta",
    type: "entidad",
    position: { x: 620, y: 320 },
    data: {
      nombre: "Cuenta (maestro)",
      origen: "datos/tipos.ts",
      campos: ["codigo, nivel, codigoPadre", "plantilla (derivada del código)", "activa"],
      autoRelacion: "jerarquía por codigoPadre",
    },
  },
  {
    id: "Precio",
    type: "entidad",
    position: { x: 780, y: 580 },
    data: { nombre: "Precio (maestro)", origen: "cargarMaestros.ts", campos: ["clave: articulo|sucursal", "anioBase, precioAnio[4]"] },
  },
  {
    id: "ActividadManoObra",
    type: "entidad",
    position: { x: 1300, y: 580 },
    data: {
      nombre: "ActividadManoObra",
      origen: "datos/tipos.ts",
      campos: [
        "codigo, descripcion",
        "capituloCodigo, capitulo, familia",
        "precios: Partial<Sucursal→Decimal>",
        "noInventariable, articuloVinculado?",
      ],
    },
  },
];

function crearEdge(id: string, source: string, target: string, label: string, solida: boolean): Edge {
  return {
    id,
    source,
    target,
    label,
    type: "smoothstep",
    labelStyle: { fill: "var(--color-tinta-3)", fontSize: 10 },
    labelBgStyle: { fill: "var(--color-panel)", fillOpacity: 0.9 },
    style: {
      stroke: "var(--color-tinta-3)",
      strokeWidth: 1.25,
      strokeDasharray: solida ? undefined : "4 3",
    },
  };
}

const EDGES: Edge[] = [
  crearEdge("hallazgo-obra", "Hallazgo", "Obra", "N—1", false),
  crearEdge("hallazgo-linea", "Hallazgo", "LineaPresupuesto", "por código", false),
  crearEdge("obra-linea", "Obra", "LineaPresupuesto", "1—N", true),
  crearEdge("obra-sucursal", "Obra", "Sucursal", "meta.sucursal", false),
  crearEdge("linea-insumo", "LineaPresupuesto", "Insumo", "N10 1—N", true),
  crearEdge("linea-cuenta", "LineaPresupuesto", "Cuenta", "valida código", false),
  crearEdge("insumo-articulo", "Insumo", "Articulo", "por código", false),
  crearEdge("articulo-familia", "Articulo", "Familia", "N—1", false),
  crearEdge("precio-articulo", "Precio", "Articulo", "por código", false),
  crearEdge("precio-sucursal", "Precio", "Sucursal", "por nombre", false),
  crearEdge("manoobra-articulo", "ActividadManoObra", "Articulo", "noInventariable", false),
  crearEdge("manoobra-sucursal", "ActividadManoObra", "Sucursal", "precios por nombre", false),
];

/**
 * Sin claves foráneas declaradas: línea sólida = contención real (array
 * anidado); línea punteada = relación resuelta por código en tiempo de
 * ejecución. ContextoAcceso queda deliberadamente sin conexiones — no
 * persiste, se reconstruye en cada request desde la cookie de sesión.
 *
 * Disposición en capas de izquierda a derecha (ver NODOS) para que ningún
 * borde cruce hacia atrás; los bordes usan trazo "smoothstep" (ortogonal)
 * en vez de líneas rectas, que se enredan mucho más fácil entre sí.
 */
export function DiagramaEntidades() {
  const [nodos, setNodos, onNodesChange] = useNodesState<Node<DatosNodoEntidad>>(NODOS);
  const [edges, , onEdgesChange] = useEdgesState<Edge>(EDGES);
  const restaurado = useRef(false);

  // Restaura el orden que el usuario haya dejado en una visita anterior.
  useEffect(() => {
    const guardadas = cargarPosicionesGuardadas();
    if (Object.keys(guardadas).length === 0) {
      restaurado.current = true;
      return;
    }
    setNodos((actuales) => actuales.map((n) => (guardadas[n.id] ? { ...n, position: guardadas[n.id] } : n)));
    restaurado.current = true;
  }, [setNodos]);

  // Guarda ante CUALQUIER cambio de posición (arrastre en curso o terminado),
  // no solo al soltar — así no depende de que un único evento dispare bien.
  // `restaurado` evita sobreescribir lo guardado con el layout de fábrica
  // durante el primer render, antes de que se aplique la restauración.
  useEffect(() => {
    if (!restaurado.current) return;
    guardarPosiciones(nodos);
  }, [nodos]);

  const restablecerOrden = useCallback(() => {
    localStorage.removeItem(CLAVE_ALMACENAMIENTO);
    setNodos(NODOS);
  }, [setNodos]);

  return (
    <div className="relative h-[680px] w-full overflow-hidden rounded-sm border border-hairline bg-lienzo">
      <ReactFlow
        nodes={nodos}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="var(--color-hairline)" />
        <Controls showInteractive={false} />
      </ReactFlow>
      <button
        type="button"
        onClick={restablecerOrden}
        className="absolute right-2 top-2 z-10 rounded-sm border border-hairline bg-panel px-2 py-1 text-[11px] text-tinta-2 hover:bg-fila hover:text-tinta"
      >
        Restablecer orden
      </button>
    </div>
  );
}
