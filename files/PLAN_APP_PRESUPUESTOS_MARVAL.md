# Plan de construccion — App de Presupuestos de Obra Civil (Marval)
### Compatible con Zoho Creator · Inspirada en Opus, Presto y Arquimedes-CYPE

---

## 0. Diagnostico: que dicen tus datos hoy

Antes de disenar nada, esto es lo que se midio sobre los cuatro archivos reales:

| Fuente | Volumen | Hallazgo |
|---|---|---|
| `ZMAESTRO_DE_ARTICULOS.xls` | **20.784 articulos**, 74 familias, 12 UM principales | Es un maestro historico. Solo ~15% tiene precio vigente |
| `Nivel_10_Transformado.xlsx` | **1.290 subactividades** → 27 N4, 118 N5, 315 N8, 1.288 N10 | **Incompleto**: 81 cuentas usadas en BAIKAL no existen aqui |
| `ZPRECIOS_MARVAL.xlsm` | 7 sucursales × 4 anios; 2.202 contratos + materiales | Cobertura desigual: Bogota 3.223 precios, Cali 1.874. Anios desalineados entre sucursales. Archivo de 22 MB inflado por una hoja `TEMP` con 100.000 filas vacias |
| `BAIKAL_TORRE_3_V01_PTO_CON_APUs.xls` | 387 lineas (20 N4 / 67 N5 / 130 N8 / 170 N10) + 733 insumos | $28.399.232.626 · 144 inmuebles · 94,37 m² · **$2.089.826/m²** |

**El motor de calculo ya esta escrito y verificado**: reproduce el total de
BAIKAL con **$12 de diferencia sobre $28.399 millones** (4×10⁻¹⁰ relativo,
puro redondeo del origen). Las reglas del negocio estan confirmadas, no
supuestas.

Y ya sabemos que 446 insumos distintos mueven la obra, de los cuales
**66 (14,8%) concentran el 80% del costo**. Ese numero es el argumento
comercial de la app: hoy nadie puede verlo sin abrir Excel a mano.

> **Lo que la app debe resolver no es el calculo.** El calculo esta bien.
> Lo que esta roto es el **gobierno del dato**: maestros desactualizados,
> precios inconsistentes entre APU, codigos malformados, cero trazabilidad
> de versiones y ninguna comparabilidad entre proyectos.

---

## 1. Alcance por fases

### Fase 1 — Paridad con el Excel, sin sus defectos (MVP, 10–12 semanas)
Objetivo: que un presupuestador arme BAIKAL TORRE 3 completo en la app y el
total cuadre al peso con el Excel.

1. Maestros: articulos, familias, cuentas, sucursales, catalogo de precios
2. Presupuesto jerarquico N4/N5/N8/N10 con multiplicador N8
3. APU (nivel 11) con insumos del maestro y precio por (sucursal, anio)
4. Motor de recalculo en cascada
5. Validador con las 13 reglas
6. Explosion de insumos con Pareto
7. Resumen por capitulo con $/m² y $/inmueble
8. Versionado y comparacion de versiones
9. Import del Excel actual / export al formato Opus vigente

### Fase 2 — Donde el software comercial saca ventaja (8–10 semanas)
10. Lineas de medicion auditables (`n × largo × ancho × alto`, estilo Presto)
11. APU tipo / matrices parametricas (estilo Opus y Generador de precios CYPE)
12. Repricing masivo y escalatoria por periodo
13. Comparacion de ofertas de contratistas
14. Import/export FIEBDC-3 (.bc3)

### Fase 3 — Lo que ningun programa resuelve bien para vivienda seriada (10+ semanas)
15. **Predimensionador Marval**: presupuesto de prefactibilidad desde area,
    pisos, tipologia y sucursal, alimentado por el historico de obras
16. Benchmarking automatico entre proyectos y deteccion de outliers por capitulo
17. Certificacion y control de avance contra presupuesto

---

## 2. Arquitectura recomendada

### 2.1 La decision critica: donde vive el calculo

Zoho Creator es excelente como **sistema de registro** (formularios, permisos,
reportes, flujos de aprobacion) y malo como **motor de calculo masivo**.
Los limites que fuerzan la decision:

- La API v2 procesa **maximo 200 registros por peticion**; para mas, hay que
  usar las Bulk APIs.
- Hay un **throttle de 50 llamadas API por usuario por minuto** (error 2955).
- Las tareas Deluge de integracion (`zoho.creator.getRecords`, etc.) **consumen
  cuota de API cada una**, y dentro de bucles la agotan rapido.

Un recalculo de BAIKAL toca 387 lineas y 733 insumos. Hacerlo con Deluge fila a
fila es inviable.

**Arquitectura en tres capas:**

```
┌─────────────────────────────────────────────────────────────┐
│  CAPA 1 — Zoho Creator (sistema de registro)                │
│  Formularios, subformularios, reportes, permisos, workflow  │
│  de aprobacion, notificaciones, auditoria                   │
└─────────────────────────────────────────────────────────────┘
                            ▲ ▼  Custom API / Bulk API
┌─────────────────────────────────────────────────────────────┐
│  CAPA 2 — Widget de presupuesto (React dentro de Creator)   │
│  Arbol editable, edicion inline, calculo en caliente        │
│  Todo el arbol se carga UNA vez y se guarda en lote         │
└─────────────────────────────────────────────────────────────┘
                            ▲ ▼  REST
┌─────────────────────────────────────────────────────────────┐
│  CAPA 3 — Servicio de calculo (Zoho Catalyst o contenedor)  │
│  presupuesto_core.py: cascada, explosion, validacion,       │
│  repricing, import/export. Es el codigo YA escrito.         │
└─────────────────────────────────────────────────────────────┘
```

**Por que asi:**
- El presupuestador vive en una hoja tipo Excel. Un formulario Creator
  registro-a-registro le resultara inaceptable — es la razon numero uno por la
  que fracasan estas migraciones. El widget resuelve la UX.
- El calculo pesado corre en Python (Catalyst Functions o un contenedor propio
  con la API de Creator), reutilizando `presupuesto_core.py` sin reescribirlo
  en Deluge.
- Creator conserva lo que hace bien: permisos por sucursal, flujo de
  aprobacion, historial de auditoria, integracion con el resto del ecosistema
  Zoho.

**Alternativa 100% Creator** (si hay restriccion de plataforma): calculo en
Deluge disparado por un boton "Recalcular" a nivel de presupuesto (nunca en
`on_validate` de cada fila), procesando por lotes de 200 con Bulk API y
mostrando barra de progreso. Funciona, pero espera 30–90 s por recalculo en una
obra grande. Documentarlo como deuda tecnica desde el dia uno.

### 2.2 Alternativa si Zoho Creator no es requisito duro

Si la compatibilidad con Zoho puede ser via **integracion** en vez de
**plataforma**, la ruta mas eficiente es: app propia (Next.js + PostgreSQL) con
el motor Python, sincronizada con Zoho por API. Se gana rendimiento, control de
UX y costo por usuario; se pierde el "sin codigo". Vale la pena plantear la
comparacion al comite antes de comprometer la arquitectura.

---

## 3. Modelo de datos (formularios Zoho Creator)

### 3.1 Maestros

**`Sucursal`**
| Campo | Tipo | Nota |
|---|---|---|
| `codigo` | Single line, unico | BUC, BOG, BAQ, CTG, CAL, ZIP, RIC |
| `nombre` | Single line | |
| `activa` | Decision box | Hoy hay **7** sucursales en los datos, no 4 |
| `sucursal_referencia` | Lookup → Sucursal | Fallback de precios |

**`Familia`**
| Campo | Tipo |
|---|---|
| `codigo` | Single line, unico (`02`..`93`, `OAD`) — **texto**, conserva el cero |
| `nombre`, `tipo_recurso_default` | Single line / Dropdown (MAT, MO, EQ, TC) |

**`Articulo`** — ~20.784 registros
| Campo | Tipo |
|---|---|
| `codigo` | Single line, unico, indexado |
| `descripcion` | Single line |
| `unidad_medida` | Dropdown (UN, M2, ML, M3, KG, GA, EA, RL, BT, LT, LB, PR…) |
| `familia` | Lookup → Familia |
| `tipo_linea` | Dropdown (S, B) |
| `tipo_recurso` | Dropdown (MAT, MO, EQ, TC) |
| `activo` | Decision box — **clave para poder retirar los 17.000 historicos sin borrarlos** |

**`Cuenta`** — maestro de cuentas, ~1.750 registros
| Campo | Tipo |
|---|---|
| `codigo` | Single line, unico (`CCSSSAAA` o `CCSSSAAA.SSSS`) |
| `nivel` | Dropdown (4, 5, 8, 10) |
| `codigo_padre` | Single line, indexado (**derivado del codigo, no digitado**) |
| `descripcion`, `unidad_medida` | Single line |
| `plantilla` | Dropdown (EDIFICACION, URB_INTERNO, URB_EXTERNO, ESPECIAL) — derivada del capitulo |
| `activa` | Decision box |

**`Precio`** — formato ancho, ~22.000 registros
| Campo | Tipo |
|---|---|
| `articulo` | Lookup → Articulo |
| `sucursal` | Lookup → Sucursal |
| `lista_origen` | Single line (`OG MARVAL V03`) |
| `anio_1..anio_4` | Number (etiqueta dinamica) |
| `anio_base` | Number — **2024 en Cali, 2025 en el resto: no asumir** |
| `alcance`, `observacion` | Multi line |

> **Por que formato ancho y no largo.** Normalizado por anio serian ~90.000
> registros y cada consulta de precio implicaria filtrar por 3 campos. En
> formato ancho son ~22.000 y la consulta es por (articulo, sucursal). En
> Creator, esa diferencia se nota en cada reporte.

### 3.2 Presupuesto

**`Presupuesto`** (cabecera)
| Campo | Tipo |
|---|---|
| `proyecto`, `version` | Single line |
| `estado` | Dropdown: BORRADOR → EN_REVISION → APROBADO → SUPERSEDIDO |
| `sucursal` | Lookup → Sucursal (**bloquea el catalogo de precios**) |
| `anio_precios` | Number |
| `plantilla` | Dropdown |
| `n_inmuebles`, `area_inmueble_m2` | Number / Decimal |
| `total`, `valor_inmueble`, `valor_m2` | Currency — **solo escritura del motor** |
| `elaboro`, `aprobo` | Lookup → Users |
| `presupuesto_origen` | Lookup → Presupuesto (para versionar) |

**`LineaPresupuesto`**
| Campo | Tipo | Nota |
|---|---|---|
| `presupuesto` | Lookup → Presupuesto | |
| `codigo` | Single line, indexado | |
| `nivel` | Dropdown (4,5,8,10) | Validado contra el codigo |
| `codigo_padre` | Single line, indexado | Derivado |
| `descripcion`, `unidad` | Single line | |
| `cantidad` | Decimal (6 dec) | En N4/N5/N8 es **MULTIPLICADOR** |
| `tipo_apu` | Dropdown (M.O, T.C, MAT, EQ) | Solo N10 |
| `valor_unitario`, `valor_total` | Currency | Solo escritura del motor |
| `orden` | Number | Para conservar el orden de impresion |
| `insumos` | **Subformulario** | Solo se usa en N10 |

**Subformulario `Insumo`** (nivel 11)
| Campo | Tipo |
|---|---|
| `articulo` | Lookup → Articulo |
| `descripcion_obra` | Single line — **puede diferir de la del catalogo, a proposito** |
| `unidad` | Single line |
| `rendimiento` | Decimal (6 dec) — cantidad **por unidad** de la subactividad |
| `precio` | Currency — **congelado** al elaborar |
| `origen_precio` | Dropdown: CATALOGO / MANUAL / SUCURSAL_REFERENCIA |
| `parcial` | Formula: `rendimiento × precio` |

**`Hallazgo`** (salida del validador)
`presupuesto`, `severidad` (ERROR/AVISO/INFO), `regla`, `codigo`, `mensaje`,
`estado` (ABIERTO / JUSTIFICADO / CORREGIDO), `justificacion`, `usuario`, `fecha`.

> Regla de negocio dura: **un presupuesto con ERRORES abiertos no puede pasar
> a APROBADO.** Es el unico control que evita que se repita el Excel.

### 3.3 Reglas de integridad que la app debe imponer

1. `codigo_padre` **siempre** derivado del codigo, nunca digitado.
2. `cantidad` por defecto **1** en N4/N5/N8. Un 0 exige confirmacion explicita.
3. `valor_unitario` y `valor_total` son de solo lectura para el usuario.
4. Un presupuesto APROBADO es inmutable; editar crea la version siguiente.
5. Cambiar sucursal o anio de precios de un presupuesto existente **no se
   permite**: se genera version nueva via "repreciar".

---

## 4. Pantallas

| Pantalla | Contenido | Referencia |
|---|---|---|
| **Arbol de presupuesto** | Vista jerarquica colapsable, edicion inline de cantidad y multiplicador, totales que se actualizan en caliente, columna de incidencia % | Presto / Arquimedes: arbol arriba, detalle abajo |
| **Editor de APU** | Panel inferior: insumos del N10 seleccionado, buscador de articulos por codigo/descripcion/familia, precio traido del catalogo con badge de origen | "Tarjeta de APU" de Opus |
| **Buscador de articulos** | Modal con filtro por familia, tipo de recurso, disponibilidad de precio en la sucursal activa. Debe ser rapido con 20.784 registros → paginacion server-side, nunca cargar todo | F5 de Opus |
| **Explosion de insumos** | Tabla ordenada por importe con % y % acumulado, corte Pareto 80% visible, filtro por tipo de recurso, export a Excel | Explosion de Opus |
| **Resumen ejecutivo** | Capitulos con importe, %, $/m², $/inmueble + grafico de barras de incidencia | Resumen por capitulos de CYPE |
| **Panel de hallazgos** | Validaciones agrupadas por severidad, con accion "justificar" y bloqueo de aprobacion | No existe en los comerciales — ventaja propia |
| **Comparador de versiones** | Dos presupuestos lado a lado, delta por linea, resaltando > 1% | Comparacion de Presto |
| **Repricing** | Elegir sucursal + anio destino, previsualizar impacto, generar version nueva | Escalatoria de Opus |

**Principio de UX no negociable:** el arbol debe navegarse con teclado
(flechas, Tab, Enter) y aceptar pegado desde Excel. Los presupuestadores vienen
de Excel; si tienen que usar el mouse para cada celda, no adoptaran la app.

---

## 5. Migracion de datos

| Paso | Origen | Destino | Volumen | Cuidados |
|---|---|---|---|---|
| 1 | `MAESTRO ARTICULOS` | `Familia` | 74 | Texto con cero a la izquierda |
| 2 | `MAESTRO ARTICULOS` | `Articulo` | 20.784 | Marcar `activo=No` a los que no tienen precio en ninguna sucursal |
| 3 | manual | `Sucursal` | 7 | Confirmar cuales quedan activas |
| 4 | `Nivel_10_Transformado` | `Cuenta` | 1.748 | **Completar antes** con las 81 cuentas faltantes detectadas en obras reales |
| 5 | `PRECIOS MATERIALES` + `LISTAS DE PRECIOS MARVAL` | `Precio` | ~22.000 | Localizar columnas por par (sucursal, anio), no por posicion. Descartar `#VALUE!` |
| 6 | `*_PTO_CON_APUs.xls` | `Presupuesto` + lineas | 3–5 obras piloto | Correr el validador y resolver hallazgos antes de cargar |

Carga por **Bulk API en lotes de 200**, con reintentos y respetando el throttle
de 50 llamadas/minuto. Toda la migracion sale del script `pto.py exportar`, que
ya produce los tres CSV con la estructura correcta.

**Regla de oro de la migracion:** no cargar datos sucios "para arreglarlos
despues". Los 81 huecos del maestro de cuentas y el codigo `TC 2161 60847` se
resuelven antes, no dentro de la app.

---

## 6. Integraciones

| Sistema | Direccion | Contenido | Prioridad |
|---|---|---|---|
| **Excel / Opus** | Salida | La hoja `CATALOGO MATERIALES OPUS` ya existe: replicarla exactamente para no romper el flujo vigente durante la transicion | **Alta** |
| **Zoho Analytics** | Salida | Historico de $/m² por capitulo, sucursal y anio → base del predimensionador | Alta |
| **ERP / compras** | Salida | Explosion de insumos como plan de compras | Alta |
| **Zoho Sign** | Salida | Aprobacion formal del presupuesto | Media |
| **FIEBDC-3 (.bc3)** | Ambas | Intercambio estandar con Presto, Arquimedes y bases de precios externas | Media |
| **Zoho Projects** | Salida | Fase 3, cuando exista programacion de obra | Baja |

---

## 7. Seguridad y permisos

| Rol | Puede |
|---|---|
| Presupuestador | Crear/editar BORRADOR de su sucursal; no aprueba |
| Director CPC sucursal | Aprobar presupuestos de su sucursal; justificar hallazgos |
| Administrador de maestros | Alta/baja de articulos, cuentas y precios. **Rol separado**: es el control que hoy no existe |
| Direccion / comite | Lectura de todas las sucursales + tableros comparativos |
| Auditoria | Solo lectura, incluido historial de versiones |

Los maestros deben tener flujo de aprobacion propio. La causa raiz del desorden
actual es que cualquiera puede agregar una fila a un Excel.

---

## 8. Plan de implementacion

| Sprint | Semanas | Entregable |
|---|---|---|
| 0 | 1–2 | Limpieza de maestros: completar cuentas faltantes, depurar articulos inactivos, corregir codigos malformados. **Sin esto no arranca nada** |
| 1 | 3–4 | Formularios de maestros + migracion de articulos, familias, sucursales, cuentas |
| 2 | 5–6 | Migracion del catalogo de precios + buscador de articulos con precio por sucursal/anio |
| 3 | 7–9 | Presupuesto y lineas; widget de arbol con edicion inline; motor de recalculo |
| 4 | 10–11 | Editor de APU con subformulario y traida de precios |
| 5 | 12–13 | Validador + panel de hallazgos + bloqueo de aprobacion |
| 6 | 14–15 | Explosion de insumos, resumen ejecutivo, exports |
| 7 | 16–17 | Versionado, repricing y comparador |
| 8 | 18–19 | Piloto con BAIKAL TORRE 3 + 2 obras mas; conciliacion al peso contra Excel |
| 9 | 20 | Capacitacion y salida a produccion en una sucursal |

Despues: Fase 2 y 3 segun el backlog priorizado en
`references/benchmark-opus-presto-cype.md`.

---

## 9. Riesgos

| Riesgo | Impacto | Mitigacion |
|---|---|---|
| **Rendimiento de Creator con el arbol completo** | Alto | Widget con carga unica + guardado en lote; Bulk API; nunca calcular en `on_validate` de fila |
| **Rechazo de los presupuestadores** | Alto | UX tipo hoja de calculo, navegacion por teclado, pegado desde Excel, y el Excel disponible en paralelo durante el piloto |
| **Maestros sucios** | Alto | Sprint 0 dedicado, con dueno asignado del dato |
| **Cobertura de precios incompleta** | Medio | Hacerla visible: badge de origen, contador de insumos sin precio, bloqueo de aprobacion |
| **Cuota de API** | Medio | Bulk API, backoff, monitoreo de las 50 llamadas/min |
| **Alcance creciente hacia cronograma y certificacion** | Medio | Congelar Fase 1 en costo directo. AIU, programacion y avance son fases posteriores |
| **Dependencia de una sola persona que "sabe el Excel"** | Alto | Las reglas ya estan documentadas y codificadas en la skill: ese riesgo se cierra en Sprint 0 |

---

## 10. Criterios de aceptacion del MVP

1. Un presupuestador arma una obra de 400 lineas sin salir de la app.
2. El total de BAIKAL TORRE 3 en la app coincide con el Excel **al peso**.
3. Recalcular una obra completa tarda **< 10 segundos**.
4. El validador corre sobre cualquier presupuesto en < 30 s y bloquea la
   aprobacion si hay ERRORES abiertos.
5. La explosion de insumos de una obra se genera y exporta en < 15 s.
6. Repreciar de Cali 2025 a Bogota 2027 genera una version nueva con informe de
   impacto y sin tocar la version original.
7. Toda cifra de la app es rastreable hasta un insumo con su codigo, precio,
   sucursal, anio y origen.

---

## Anexo — Que se entrega junto con este plan

- `presupuesto-obra/` — skill para Claude Code con el motor **ya funcionando**:
  importa, valida, reprecia, explota insumos, compara versiones y exporta.
  Es simultaneamente la especificacion ejecutable de la Fase 1.
- El JSON canonico (`assets/esquema_obra.json`) es el contrato entre el motor,
  el widget y Zoho Creator. Disenar los formularios contra ese esquema.
