# Skill `presupuesto-obra` — instalacion y uso en Claude Code

Motor y guia para presupuestos de obra civil con estructura de cuentas
jerarquica y APU, siguiendo la logica de Opus, Presto y Arquimedes-CYPE.

## Instalacion

Copiar la carpeta completa a la ruta de skills de Claude Code:

```bash
# Solo para este proyecto
mkdir -p .claude/skills
cp -r presupuesto-obra .claude/skills/

# O para todos los proyectos
mkdir -p ~/.claude/skills
cp -r presupuesto-obra ~/.claude/skills/
```

Dependencias del motor:

```bash
pip install pandas openpyxl "xlrd>=2.0.1" jsonschema
```

Verificar que quedo instalada:

```
> /skills
```

## Estructura

```
presupuesto-obra/
├── SKILL.md                                  modelo, reglas de calculo, flujo
├── README.md
├── requirements.txt
├── references/
│   ├── fuentes-datos.md                      layout exacto de cada Excel de Marval
│   ├── reglas-negocio.md                     plantillas, multiplicador N8, precios, versionado
│   ├── benchmark-opus-presto-cype.md         que copiar de cada programa comercial
│   ├── validaciones.md                       13 reglas con severidad y correccion
│   └── zoho-creator.md                       Deluge, custom API, limites, carga masiva
├── scripts/
│   ├── presupuesto_core.py                   motor: jerarquia, cascada, explosion, validador
│   ├── fuentes_marval.py                     lectores de los 4 archivos fuente + repricing
│   ├── pto.py                                CLI
│   └── migrar.py                             Sprint 0: CSV para Zoho + diagnostico
└── assets/
    └── esquema_obra.json                     contrato JSON canonico
```

## Prueba rapida

```bash
cd scripts

python pto.py importar  ../../BAIKAL_TORRE_3_V01_PTO_CON_APUs.xls --out obra.json
python pto.py resumen   obra.json --nivel 4
python pto.py explosion obra.json --top 20
python pto.py validar   obra.json --articulos ../../ZMAESTRO_DE_ARTICULOS.xls \
                                  --cuentas   ../../Nivel_10_Transformado.xlsx
python pto.py reprecio  obra.json --precios ../../ZPRECIOS_MARVAL.xlsm \
                                  --sucursal BOGOTA --anio 2027
```

Resultado esperado con BAIKAL TORRE 3 V01:

```
Lineas : N4=20 N5=67 N8=130 N10=170 insumos=733
TOTAL  : 28,399,232,614.23        (Excel: 28,399,232,626.43 — dif. $12 por redondeo)
Vr/m2  : 2,089,826.14
446 insumos distintos. 66 concentran el 80% del costo.
```

## Como invocarla

La skill se activa sola cuando la conversacion menciona presupuesto de obra,
APU, precios unitarios, explosion de insumos, capitulos y subcapitulos,
cantidades de obra, repricing, o cuando se sube un Excel con pinta de
presupuesto. Tambien se puede forzar:

```
> usa la skill presupuesto-obra para importar y validar este presupuesto
```

## Codigos de salida

`pto.py validar` devuelve **1** si hay ERRORES. Util en CI para bloquear la
aprobacion de un presupuesto con hallazgos criticos abiertos.
