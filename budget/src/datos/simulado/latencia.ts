/**
 * Retardo simulado para que los estados de carga (skeleton, spinners) sean
 * reales durante el desarrollo del esqueleto, en vez de resolverse en 0 ms.
 */
export function latencia(minMs = 120, maxMs = 300): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
