# Regenerar los datos mock desde el oráculo Python

El motor de cálculo verificado vive en
`../../../files/presupuesto-obra-skill/presupuesto-obra/`, no en este
proyecto. Este archivo documenta cómo volver a generar
`datos-mock/*.json` cuando cambien los Excel fuente en `Bases de datos/`.

## 1. Instalar dependencias del motor (una sola vez)

```bash
pip install -r ../../../files/presupuesto-obra-skill/presupuesto-obra/requirements.txt
```

## 2. Regenerar la salida cruda

Desde `files/presupuesto-obra-skill/presupuesto-obra/scripts/`:

```bash
BRUTO="../../../../budget/datos-mock/_bruto"

python pto.py importar "../../../../Bases de datos/BAIKAL TORRE 3 V01 PTO CON APUs.xls" \
       --out "$BRUTO/baikal_v01.json" --sucursal CALI --anio 2025

python pto.py validar "$BRUTO/baikal_v01.json" \
       --articulos "../../../../Bases de datos/ZMAESTRO DE ARTICULOS.xls" \
       --cuentas   "../../../../Bases de datos/Estructura de Presupuesto.xlsx" \
       --out "$BRUTO/hallazgos_baikal.csv" --max 0

python pto.py explosion "$BRUTO/baikal_v01.json" --top 500 --out "$BRUTO/explosion_baikal.csv"

python pto.py reprecio "$BRUTO/baikal_v01.json" \
       --precios "../../../../Bases de datos/ZPRECIOS MARVAL.xlsm" \
       --sucursal BOGOTA --anio 2027 --out "$BRUTO/baikal_v02_bogota2027.json"
```

## 3. Normalizar para el frontend

Desde `budget/`:

```bash
npm run mock:preparar   # produce datos-mock/*.json (camelCase, Decimal-string)
npm run verificar:total # exige exactamente 28399232614.23
```

## Criterio de verdad

```
Líneas   : N4=20 N5=67 N8=130 N10=170 insumos=733
TOTAL    : 28.399.232.614,23   (Excel: 28.399.232.626,43 — diferencia de $12 por redondeo del origen)
Hallazgos: 104 (2 ERROR, 102 AVISO)
Explosión: 446 insumos distintos, 66 concentran el 80% del costo
```

Si estos números no coinciden tras un cambio en los Excel fuente, el motor
Python (el oráculo) es la fuente de verdad — no el frontend.
