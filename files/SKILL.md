---
name: presupuesto-obra
description: >
  Elabora, importa, valida, reprecia, analiza y exporta presupuestos de obra
  civil con estructura jerarquica de cuentas (capitulo / subcapitulo /
  actividad / subactividad) y analisis de precios unitarios (APU), siguiendo la
  logica de Opus, Presto y Arquimedes-CYPE. Usa esta skill SIEMPRE que el
  usuario mencione presupuesto de obra, APU, analisis de precios unitarios,
  precios unitarios, catalogo de conceptos, explosion de insumos, maestro de
  articulos, maestro de cuentas, capitulos y subcapitulos, cantidades de obra,
  reajuste o escalatoria de precios, comparacion de versiones de presupuesto,
  presupuesto Marval, archivos "PTO CON APUs", ZPRECIOS, ZMAESTRO, o cuando
  suba un Excel que se parezca a un presupuesto de construccion — aunque no
  nombre explicitamente la palabra "presupuesto".
---

# Presupuestos de obra civil (modelo Marval)

Motor de presupuesto jerarquico con APU, catalogo de precios multi-sucursal y
multi-anio, explosion de insumos y control de versiones.

## 1. Modelo mental (leer siempre)

Un presupuesto es un **arbol de cuentas** cuyas hojas son **APU** (matrices de
precio unitario) y cuyos atomos son **insumos** del maestro de articulos.

```
N4   CAPITULO        02000000            CIMENTACION
 N5  SUBCAPITULO     02001000            EXCAVACIONES Y RELLENOS
  N8 ACTIVIDAD       02001001            EXC A MANO EN COMUN      <- multiplicador
   N10 SUBACTIVIDAD  02001001.1002       CIMEN EXC A MANO <2,5m   <- APU, aqui va la cantidad
    N11 INSUMO       152001 / MO 60133   CAL / EXCAVACION          <- articulo + rendimiento
```

**La codificacion ES la jerarquia.** No hay campo "padre": se deriva del codigo.

| Nivel | Formato          | Padre                        |
|-------|------------------|------------------------------|
| N4    | `CC000000`       | raiz                         |
| N5    | `CCSSS000`       | `CC` + `000000`              |
| N8    | `CCSSSAAA`       | `CCSSS` + `000`              |
| N10   | `CCSSSAAA.SSSS`  | los 8 primeros caracteres    |
| N11   | codigo articulo  | el N10 que lo contiene       |

Plantillas por rango de capitulo: **01–21 Edificacion**, **22–28 Urbanismo
interno**, **29–39 Urbanismo externo**.

## 2. Reglas de calculo (no improvisar — verificadas contra obra real)

```
VU(N10) = SUM( rendimiento_i x precio_i )   sobre sus insumos N11
VT(N10) = cantidad(N10) x VU(N10)

VU(N8)  = SUM( VT de sus hijos N10 )
VT(N8)  = cantidad(N8) x VU(N8)             <-- cantidad(N8) es MULTIPLICADOR

VU(N5)  = SUM( VT hijos N8 )    VT(N5) = cantidad(N5) x VU(N5)
VU(N4)  = SUM( VT hijos N5 )    VT(N4) = cantidad(N4) x VU(N4)
TOTAL   = SUM( VT de los N4 )
```

El **multiplicador del N8** es la peculiaridad del modelo: si el N10 tiene
200 m2 y su N8 tiene cantidad 5, el importe efectivo es 200 x 5 x VU. Sirve
para replicar tipologias (5 apartamentos iguales, 20 pisos tipo) sin duplicar
lineas. Por defecto la cantidad de N4/N5/N8 es **1**.

Indicadores de cabecera:

```
valor_por_inmueble = TOTAL / n_inmuebles
valor_por_m2       = TOTAL / (n_inmuebles x area_inmueble_m2)
incidencia_%       = VT(linea) / TOTAL x 100
```

Trabajar con `Decimal`, nunca con `float`, y redondear solo al presentar.
Un presupuesto de $28.000 millones acumula centavos rapido.

## 3. Flujo de trabajo

Todo pasa por `scripts/pto.py`. **No reimplementar el calculo a mano.**

```bash
cd scripts

# 1. Importar un presupuesto existente al formato canonico JSON
python pto.py importar /ruta/PROYECTO_PTO_CON_APUs.xls --out obra.json \
       --sucursal CALI --anio 2025

# 2. Validar contra los maestros
python pto.py validar obra.json \
       --articulos /ruta/ZMAESTRO_DE_ARTICULOS.xls \
       --cuentas   /ruta/Nivel_10_Transformado.xlsx \
       --out hallazgos.csv

# 3. Analizar: resumen por capitulo y explosion de insumos (Pareto)
python pto.py resumen   obra.json --nivel 5
python pto.py explosion obra.json --top 40 --out explosion.csv

# 4. Repreciar a otra sucursal / otro anio
python pto.py reprecio obra.json --precios /ruta/ZPRECIOS_MARVAL.xlsm \
       --sucursal BOGOTA --anio 2027 --out obra_bog27.json

# 5. Comparar versiones
python pto.py comparar obra.json obra_bog27.json --nivel 5

# 6. Exportar a CSV (3 tablas: cabecera, lineas, apu)
python pto.py exportar obra.json --out export/
```

Para trabajo programatico, importar el modulo:

```python
from presupuesto_core import Obra, Linea, Insumo, validar
from fuentes_marval import (cargar_articulos, cargar_cuentas, cargar_precios,
                            importar_presupuesto, reprecio)
```

## 4. Construir un presupuesto desde cero

1. **Elegir plantilla** (Edificacion / Urb. interno / Urb. externo) y filtrar el
   maestro de cuentas por el rango de capitulos.
2. **Elegir sucursal y anio** de precios: definen el catalogo. Nunca mezclar
   sucursales dentro de una misma obra.
3. **Cargar solo las cuentas que se usan.** Una plantilla completa trae ~1.300
   subactividades; una torre real usa 150–200. Arrastrar cuentas vacias
   ensucia los reportes.
4. **Por cada N10: armar el APU** con insumos del maestro de articulos y su
   rendimiento por unidad. El rendimiento es *por unidad de la subactividad*,
   no la cantidad total de obra.
5. **Cargar cantidades de obra en el N10** y el multiplicador en el N8 cuando
   aplique.
6. **Recalcular, validar, revisar la explosion de insumos** antes de dar el
   presupuesto por bueno.

Al pedir datos al usuario, preguntar en este orden: proyecto, sucursal, anio de
precios, plantilla, n.o de inmuebles, area promedio. Sin sucursal y anio no se
puede precificar nada.

## 5. Checklist de calidad antes de entregar

- [ ] `validar` sin ERRORES.
- [ ] Ningun APU vacio ni insumo con precio 0.
- [ ] Un mismo insumo con un solo precio en toda la obra (regla A06).
- [ ] UM del insumo coincide con la del maestro (regla A04).
- [ ] Cobertura de precios: reportar cuantos insumos quedaron sin precio en la
      sucursal/anio elegidos y no ocultarlo.
- [ ] Explosion de insumos revisada: el top 20 debe tener sentido fisico
      (concreto, acero, mano de obra estructura, acabados).
- [ ] Comparar el $/m2 contra obras similares; una desviacion > 15% es una
      bandera, no un resultado.
- [ ] Total conciliado con la version anterior via `comparar`, explicando cada
      delta > 1%.

## 6. Referencias

Leer bajo demanda, no de entrada:

| Archivo | Cuando leerlo |
|---|---|
| `references/fuentes-datos.md` | Al tocar los archivos fuente de Marval (layout exacto de cada hoja, columnas, trampas) |
| `references/reglas-negocio.md` | Dudas sobre plantillas, multiplicadores, proyeccion de precios, tipos de recurso, indirectos/AIU |
| `references/benchmark-opus-presto-cype.md` | Al disenar funcionalidad nueva o justificar decisiones de producto |
| `references/validaciones.md` | Catalogo completo de reglas de validacion con severidad y como corregir |
| `references/zoho-creator.md` | Al implementar la app: limites de plataforma, funciones Deluge, custom API, carga masiva |
| `assets/esquema_obra.json` | Contrato del JSON canonico (para integraciones y para la app web) |

Para preparar la migracion a la app web:

```bash
python scripts/migrar.py --articulos ZMAESTRO_DE_ARTICULOS.xls \
                         --cuentas   Nivel_10_Transformado.xlsx \
                         --precios   ZPRECIOS_MARVAL.xlsm \
                         --obras     *_PTO_CON_APUs.xls \
                         --out       migracion/
```

Genera los 5 CSV de maestros listos para cargar mas un diagnostico de calidad
de datos (`99_diagnostico.md`).

## 7. Errores comunes

- **Tratar la cantidad del N8 como cantidad de obra.** Es un multiplicador; si
  se suma en vez de multiplicar, el presupuesto se descuadra sin aviso.
- **Buscar `MO 60133` en el maestro de articulos.** El prefijo (`MO`, `TC`,
  `EQ`) indica tipo de recurso; la clave de catalogo es `60133`.
- **Asumir que las columnas de anio estan alineadas entre sucursales.** No lo
  estan: en `PRECIOS MATERIALES` unas sucursales arrancan en 2024 y otras en
  2025. Localizar la columna por el par (sucursal, anio), nunca por posicion.
- **Ignorar `#VALUE!` y `#N/A`.** El catalogo tiene cobertura parcial por
  sucursal. Un insumo sin precio no vale 0: vale "sin dato" y hay que
  reportarlo.
- **Reescribir descripciones del catalogo.** La descripcion de obra puede
  diferir de la del catalogo a proposito; conservar ambas.
