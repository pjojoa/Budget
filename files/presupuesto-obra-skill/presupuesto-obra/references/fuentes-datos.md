# Fuentes de datos Marval — layout exacto

Medido sobre los archivos reales. Si un archivo cambia de estructura, actualizar
esta tabla antes de tocar el codigo.

## Indice

1. ZMAESTRO_DE_ARTICULOS.xls
2. Nivel_10_Transformado.xlsx (maestro de cuentas)
3. ZPRECIOS_MARVAL.xlsm (catalogo de precios)
4. \<PROYECTO\>_PTO_CON_APUs.xls (presupuesto exportado)
5. Resolucion codigo -> precio
6. Trampas conocidas

---

## 1. ZMAESTRO_DE_ARTICULOS.xls

Hoja unica `MAESTRO ARTICULOS`. Encabezado en la fila 1. **20.784 articulos.**

| Col | Nombre | Notas |
|-----|--------|-------|
| A | `2º Nº de artículo` | Clave numerica (5–6 digitos). Es la PK del catalogo |
| B | `Descripción` | Texto libre, ~30 caracteres |
| C | `U M` | UN (14.413), M2 (2.890), ML (1.198), M3 (959), KG (535), GA, EA, RL, BT, LT, LB, PR… |
| D | `FAMILIA` | 74 valores: `02`..`93`, mas `OAD`. Es texto con cero a la izquierda |
| E | `TIPO LINEA` | `S` = stockable/suministro (17.507), `B` = bien/servicio (3.277) |

`FAMILIA` es el agrupador que pide el requerimiento. Familias observadas
relevantes: `02` contratos de obra, `06` aditivos, `07` agregados,
`15` cementos y cales, `19` concretos, `27` aceros, `43` topografia.

> La familia **no** determina por si sola el tipo de recurso (MAT/MO/EQ/TC).
> Eso lo da el prefijo del codigo tal como se usa en el presupuesto.

## 2. Nivel_10_Transformado.xlsx — maestro de cuentas

Hoja `Nivel 10`. **1.290 filas** = una por subactividad, con sus ancestros
desnormalizados. De aqui se reconstruyen 1.748 cuentas:
**27 N4, 118 N5, 315 N8, 1.288 N10.**

Columnas: `Código N10 | Código N8 | Código N5 | Código N4 | Descripción N10 |
Descripción N8 | Descripción N5 | Descripción N4 | N10 Completo | N8 Completo |
N5 Completo | N4 Completo | U M`

Las columnas `* Completo` son `codigo - descripcion` concatenados (para
combos/lookups en Excel). No son fuente de verdad.

Capitulos presentes: 01–21 (edificacion), 22–31 (urbanismo), 40, 50, 60, 70,
80, 90 (capitulos especiales / no edificacion).

> **Este archivo esta incompleto respecto a las obras reales.** Al validar
> BAIKAL TORRE 3 aparecen 81 cuentas usadas en obra que no existen aqui
> (p.ej. `02002003`, `03001000`). En la app web el maestro de cuentas debe ser
> la fuente de verdad y este archivo, un insumo de migracion.

## 3. ZPRECIOS_MARVAL.xlsm — catalogo de precios

8 hojas. Solo tres son fuente:

### 3.1 `PRECIOS MATERIALES` — materiales

- Fila 8 (indice 7): nombre de **sucursal**, repetido en bloques de 5 columnas.
- Fila 9 (indice 8): dentro de cada bloque -> `LISTA DE PRECIO?`, luego 4 anios.
- Datos desde la fila 10.

| Col | Contenido |
|-----|-----------|
| A–E | `COD`, `Descripción`, `U M`, `FAMILIA`, `TIPO LINEA` |
| F–J | BUCARAMANGA: lista, 2025, 2026, 2027, 2028 |
| K–O | BOGOTA: lista, 2025..2028 |
| P–T | BARRANQUILLA: lista, 2025..2028 |
| U–Y | CALI: lista, **2024..2027** |
| Z–AD | CARTAGENA: lista, 2025..2028 |

**Los anios NO estan alineados entre sucursales.** Buscar siempre por el par
(sucursal, anio), nunca por offset fijo.

`LISTA DE PRECIO?` guarda el origen de la tarifa (`OG MARVAL V03`, etc.).
Celdas con `#VALUE!` / vacio = sin precio para esa sucursal.

### 3.2 `LISTAS DE PRECIOS MARVAL` — contratos (MO / TC / EQ)

2.202 filas de datos desde la fila 8.

- Fila 4 (indice 3): sucursal. Fila 5 (indice 4): `%AUMENTO` = **0.08** anual.
- Fila 6 (indice 5): anio (2025–2028 en todas las sucursales aqui).

| Col | Contenido |
|-----|-----------|
| A | `ID` correlativo |
| B | `COD` interno (A1, A28, L40, B4…) |
| C | `NO INV` -> **clave de catalogo**, la que se usa en el presupuesto |
| D | `DESCRIPCION NO INVENTARIABLE` |
| E | `UND` |
| F | `FAMILIA` |
| I | `ACTIVIDAD LISTA NACIONAL` |
| K–N | BUCARAMANGA 2025–2028 |
| O–R | BOGOTA · S–V BARRANQUILLA · W–Z CARTAGENA · AA–AD CALI · AE–AH ZIPAQUIRA · AI–AL RICAURTE |
| AM | `DESCRIPCION` (alcance corto) |
| AN | `ALCANCE` (que incluye / que no) |
| AO | `OBSERVACION DE PRECIO` |

**Hay 7 sucursales, no 4:** Bucaramanga, Bogota, Barranquilla, Cartagena, Cali,
Zipaquira, Ricaurte. Confirmar con el usuario cuales quedan activas en la app.

Cobertura real medida (sucursal / anio -> precios cargables):

| Sucursal | Materiales | Contratos | Total |
|---|---|---|---|
| Bogota 2026 | 2.753 | 470 | 3.223 |
| Bucaramanga 2026 | 2.210 | 506 | 2.716 |
| Cali 2026 | 1.466 | 408 | 1.874 |

Menos del 15% del maestro de articulos tiene precio vigente. Es normal (el
maestro es historico) pero la app debe hacerlo visible.

### 3.3 `%PROYECCIONES`

`NUMERO | DESCRIPCION | CAT 5 | % AJUSTE POR CAMBIO AÑO`. Ajuste por familia
(p.ej. familia `02` mano de obra -> categoria 3). Combinar con el 8% general.

### 3.4 Hojas de trabajo (ignorar como fuente)

`MAESTRO ARTICULOS` (copia), `TEMP`, `R-LISTADO NACIONAL`,
`CATALOGO MATERIALES OPUS` (export a Opus: `COMPUESTO | CLAVE | TIPO |
DESCRIPCION | DESCRIPCION CONTRATO | UN | COSTO BASE M.N | PRECIO U. | FECHA |
FAMILIA`, filtrado por ciudad+anio en D4/D5), `LISTA PRECIOS COMPRAS`.

> La hoja `CATALOGO MATERIALES OPUS` demuestra que hoy el flujo real es
> Excel -> Opus. La app web debe reproducir ese export para no romper el
> proceso vigente durante la transicion.

## 4. \<PROYECTO\>_PTO_CON_APUs.xls — presupuesto

Formato `FT-PGC-PLA-002`. Dos hojas.

### Hoja `PTO CON APUs`

Cabecera (columna base 0):

| Celda | Dato |
|---|---|
| D7 | Nombre del proyecto |
| C9 | Fecha · C10 Version |
| C11 | Total presupuesto |
| C12 | N.o de inmuebles |
| C13 | Area inmueble (m2) |
| C14 | Valor m2 · C15 Valor inmueble |
| H10/H11 | Elaboro / cargo · H13/H14 Aprobo / cargo |

Tabla desde la fila 17 (encabezado) / 18 (datos):

`CÓDIGO COSTO | ND | DESCRIPCION | TIPO | UN | CANTIDAD | VALOR UNITARIO |
VALOR TOTAL | VALOR POR INMUEBLE | VALOR POR M2 | %`

- `ND` = nivel: 4, 5, 8, 10, **11**. El 11 es el insumo dentro del APU.
- `TIPO` solo en N10: `M.O`, `T.C`, `MAT`, `EQ` (clasificacion dominante del APU).
- En las filas N11, `CANTIDAD` es el **rendimiento por unidad** y
  `VALOR UNITARIO` el precio del insumo.
- Las columnas `VALOR POR INMUEBLE`, `VALOR POR M2` y `%` solo se llenan en
  N4/N5/N8.

Ejemplo verificado (BAIKAL TORRE 3 V01): 20 N4, 67 N5, 130 N8, 170 N10, 733 N11.
Total $28.399.232.626,43 · 144 inmuebles · 94,37 m2 · $2.089.826/m2.
El motor reproduce ese total con una diferencia de **$12** (redondeos del
origen), es decir 4e-10 relativo.

### Hoja `DATOS`

Misma informacion en formato plano por APU, con la cabecera repetida en cada
bloque. Es un artefacto del generador; usar `PTO CON APUs`.

## 5. Resolucion codigo -> precio

```
codigo en presupuesto      tipo   clave de busqueda   hoja
-------------------------  -----  ------------------  --------------------------
152001                     MAT    152001              PRECIOS MATERIALES
MO 60133                   MO     60133               LISTAS DE PRECIOS MARVAL
TC 01101                   TC     01101               LISTAS DE PRECIOS MARVAL
EQ xxxxx                   EQ     xxxxx               LISTAS DE PRECIOS MARVAL
```

Verificado: `TC 01101` -> fila `A1` COMISION TOPOGRAFICA · `MO 60133` -> `A28`
EXCAVACION COMUN CON PALADRAGA · `152001` -> CAL.

## 6. Trampas conocidas

1. **Descripcion divergente.** `MO 60133` se llama "CIM-EXCAVACION BORDILLO" en
   la obra y "EXCAVACION COMUN CON PALADRAGA" en el catalogo. Es intencional:
   guardar `descripcion_obra` y `descripcion_catalogo` por separado.
2. **Precios del presupuesto != precios del catalogo.** BAIKAL usa 1.500 para
   CAL; el catalogo Cali 2025 dice 1.540. El presupuesto congela precios al
   momento de elaborarlo. Nunca sobrescribir sin dejar traza.
3. **`.xls` legacy** requiere `xlrd>=2.0`; openpyxl lo rechaza.
4. **Codigos con ceros a la izquierda.** `01001000` se convierte en `1001000`
   si pandas lo lee como numero. Normalizar siempre con `normaliza_codigo()`.
5. **Insumos compuestos raros.** Existe `TC 2161 60847` (doble espacio): la
   clave de catalogo no se resuelve. Marcar y consultar, no adivinar.
6. **Hoja `TEMP` con 100.000 filas vacias** infla el archivo a 22 MB. Al
   migrar, no importar hojas de trabajo.
