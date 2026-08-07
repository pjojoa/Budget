# Benchmark: Opus, Presto y Arquimedes (CYPE)

Que hace cada uno bien y que vale la pena copiar. Fuentes: documentacion de
producto de CYPE, Opus/Opus Planet y practica estandar de presupuestacion.

## 1. Estructura de datos: los tres coinciden

Los tres organizan el presupuesto como **arbol de conceptos** con jerarquia
capitulo -> subcapitulo -> apartado -> partida -> descompuesto, y todos separan
dos cosas que Excel mezcla:

- **El banco de precios** (catalogo maestro, reutilizable entre obras)
- **La obra** (que conceptos se usan, con que medicion)

Marval ya tiene esa separacion (maestro de articulos + maestro de cuentas vs.
presupuesto de proyecto). Es la decision arquitectonica correcta y hay que
preservarla: **el precio vive en el catalogo, la cantidad vive en la obra.**

Un concepto puede ser *simple* (insumo) o *descompuesto* (se explica por otros
conceptos). Arquimedes permite anidar descompuestos en varios niveles; Marval
hoy solo permite un nivel (N10 -> N11). Vale la pena dejar la puerta abierta a
sub-APU (un APU de "concreto puesto" reutilizado dentro de otros APU).

## 2. Opus — lo que hay que copiar

| Funcion | Que es | Prioridad para Marval |
|---|---|---|
| **Explosion de insumos** | Consolidado de todos los recursos de la obra con cantidad total e incidencia | **Critica.** Ya implementada en `pto.py explosion` |
| **Matriz / tarjeta de APU** | Vista de un solo concepto con su desglose, imprimible | **Critica.** Es el entregable de sustentacion |
| **Pie de precios unitarios** | Aplicacion en cascada de indirectos, financiamiento, utilidad y cargos adicionales sobre el costo directo | Alta, si Marval decide manejar AIU |
| **Matrices parametricas** | Se arrastra una matriz, se definen variables tecnicas y se genera el APU con su precio | Alta. Reduce el 80% del trabajo repetitivo |
| **Escalatoria por explosion** | Ajuste de precios por periodo usando la explosion como base | Alta para obras plurianuales |
| **Homologar insumos** | Detectar y unificar insumos duplicados con distinta clave | Media. Con 20.784 articulos es inevitable |
| **Presupuesto programable** | Vincula presupuesto con cronograma y programa de suministros | Baja en fase 1 |
| **Drag & drop entre obras** | Copiar conceptos de una obra a otra | Media. Es como se construye una obra nueva en la practica |

Aprendizaje transversal de Opus: **la verificacion de consistencia de precios**
—que un mismo insumo tenga el mismo precio en todos los APU— es criterio de
validez de la propuesta. Ya es la regla A06 del validador.

## 3. Presto — lo que hay que copiar

| Funcion | Que es | Prioridad |
|---|---|---|
| **Lineas de medicion** | La cantidad no se digita: se compone de `n x largo x ancho x alto` con comentario por linea | **Critica.** Hace auditable la cantidad, hoy el punto mas debil de Marval |
| **Referencias y textos** | Cada concepto arrastra especificacion tecnica, pliego, fotos | Media. Sirve para contratacion |
| **Comparacion de ofertas** | Varias columnas de precio por concepto (presupuesto, contratista A, B…) | Alta. Marval contrata casi todo |
| **Certificacion** | Avance por partida contra lo presupuestado | Alta en fase 2 |
| **Estructura de precios de venta vs. coste** | Dos importes paralelos por linea | Media |
| **Conceptos "tipo"** | Plantillas de partida reutilizables | Alta |

## 4. Arquimedes / CYPE — lo que hay que copiar

| Funcion | Que es | Prioridad |
|---|---|---|
| **Generador de precios** | Base de datos parametrica: se eligen caracteristicas y el sistema arma la partida con su descompuesto y su texto | Alta (es la version CYPE de las matrices parametricas) |
| **Predimensionadores** | Con datos minimos del proyecto genera un presupuesto completo con estructura y mediciones | **Muy alta para Marval**: permite presupuestar en fase de prefactibilidad a partir de area, n.o de pisos y tipologia |
| **FIEBDC-3 (.bc3)** | Estandar de intercambio de bases de precios y presupuestos entre programas | Media-alta. Es la via de interoperar sin acoplarse a un proveedor |
| **Jerarquia configurable** | El usuario decide cuantos niveles usa | Baja: Marval tiene 4/5/8/10 fijos, y eso es una fortaleza (comparabilidad) |
| **Importacion CSV por arbol** | Importar arbol de capitulos o arbol de partidas con descomposicion | Alta para la migracion |
| **Decimales configurables** | Decimales distintos para mediciones/rendimientos y para importes | Alta. Explica las diferencias de centavos |

## 5. Diferencias del modelo Marval que hay que respetar

No copiar ciegamente: hay cosas que Marval hace distinto **a proposito**.

1. **Multiplicador de nivel 8.** No existe en los tres programas. Es la forma
   compacta de manejar tipologias repetidas de vivienda. Conservarlo.
2. **Codificacion parlante fija (CC-SSS-AAA.SSSS).** Los tres permiten codigos
   libres. La rigidez de Marval es lo que permite comparar obras entre si y
   consolidar por capitulo a nivel compania. Conservarla y validarla duro.
3. **Precios por sucursal y por anio en el mismo catalogo.** Opus y Presto
   manejan un banco de precios por obra. El esquema matricial de Marval es
   superior para una constructora multi-region. Conservarlo.
4. **Contratacion "todo costo".** Gran parte del costo es TC, no descompuesto
   en material + mano de obra. Los APU de Marval son mas planos que los de
   obra publica mexicana o espanola, y eso esta bien.
5. **Indicadores por inmueble y por m2 en la cabecera.** Opus/Presto no los
   traen porque no son de vivienda seriada. Para Marval son el KPI principal.

## 6. Backlog priorizado que sale del benchmark

**Fase 1 — paridad con el Excel actual, sin sus defectos**
1. Arbol de cuentas con calculo en cascada y multiplicador N8
2. APU con insumos del maestro y precio por (sucursal, anio)
3. Validador (consistencia, huerfanos, precios faltantes)
4. Explosion de insumos con Pareto
5. Resumen por capitulo con $/m2 y $/inmueble
6. Versionado y comparacion de versiones

**Fase 2 — donde el software comercial saca ventaja**
7. Lineas de medicion (estilo Presto)
8. Matrices parametricas / APU tipo (estilo Opus-CYPE)
9. Repricing masivo y escalatoria por periodo
10. Comparacion de ofertas de contratistas
11. Import/export FIEBDC-3 y export al formato Opus ya existente

**Fase 3 — lo que ninguno resuelve bien para vivienda seriada**
12. Predimensionador Marval: presupuesto de prefactibilidad desde area,
    n.o de pisos, tipologia y sucursal, alimentado por el historico de obras
13. Benchmarking automatico entre proyectos ($/m2 por capitulo, deteccion de
    outliers)
14. Control de avance y certificacion contra presupuesto
