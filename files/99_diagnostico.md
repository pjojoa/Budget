# Diagnostico Sprint 0 — depuracion de maestros

Generado por `migrar.py` sobre los archivos fuente reales.

## Resumen

| Maestro | Registros | Accion requerida |
|---|---|---|
| Sucursales | 7 | Confirmar cuales quedan activas |
| Familias | 74 | **67 sin nombre descriptivo** |
| Articulos | 20784 | **15229 sugeridos como inactivos (73.3%)** |
| Cuentas | 1829 | **81 altas requeridas** |
| Precios | 14801 | Cobertura desigual por sucursal |

## 1. Articulos

- Total en el maestro: **20784**
- Con precio vigente en al menos una sucursal, o usados en obra: **5555**
- Sin precio y sin uso -> marcar `activo = false`: **15229** (73.3%)

> No borrar: los articulos inactivos siguen referenciados por
> presupuestos historicos. Solo se ocultan del buscador.

## 2. Cuentas

- En `Nivel_10_Transformado.xlsx`: **1748**
- Usadas en obras reales pero ausentes del maestro: **81**
- De esas, sin descripcion conocida (ancestros derivados): **0** — requieren definicion manual

Distribucion por plantilla:

- `EDIFICACION`: 1271
- `URBANISMO_EXTERNO`: 26
- `URBANISMO_INTERNO`: 532

## 3. Precios

| Sucursal | Registros | Anio base |
|---|---|---|
| BOGOTA | 3228 | 2025 |
| BUCARAMANGA | 2816 | 2025 |
| CARTAGENA | 2489 | 2025 |
| BARRANQUILLA | 2187 | 2025 |
| CALI | 1880 | 2024, 2025 |
| ZIPAQUIRA | 1741 | 2025 |
| RICAURTE | 460 | 2025 |

Articulos distintos con al menos un precio: **5461** de 20784 (26.3%).

> Los anios base difieren entre sucursales. Al cargar, respetar el
> campo `anio_base` de cada fila: `precio_anio_1` NO es siempre 2025.

## 4. Insumos problematicos en obras

| Obra | Subactividad | Codigo | Descripcion |
|---|---|---|---|
| BAIKAL TORRE 3 V01 | 21006001.1001 | `TC 2161 60847` | COORDINADOR SISO |

## 5. Orden de carga en Zoho Creator

```
01_sucursales.csv
02_familias.csv
03_articulos.csv    (depende de familias)
04_cuentas.csv      (cargar por nivel: 4, luego 5, 8, 10)
05_precios.csv      (depende de articulos y sucursales)
```

Cargar por Bulk API en lotes de 200, respetando el limite de 50
llamadas por minuto.
