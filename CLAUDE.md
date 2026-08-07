# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is **not** an application codebase — it is the planning workspace for Marval's
"App de Presupuestos de Obra Civil" (construction-budget app), meant to eventually run
inside Zoho Creator. It contains:

- `files/PLAN_APP_PRESUPUESTOS_MARVAL.md` — the full product/architecture plan (phases,
  data model, screens, Zoho integration strategy, security, rollout schedule). Read this
  first for any question about scope, architecture decisions, or roadmap.
- `files/zoho-creator.md` — copy of `references/zoho-creator.md` (see below).
- `files/presupuesto-obra-skill/presupuesto-obra/` — a **Claude Code skill** containing a
  working, verified Python calculation engine. This is simultaneously the executable
  specification for Phase 1 of the plan above.
- `Bases de datos/Estructura de Presupuesto.xlsx` — source spreadsheet data.

The only runnable code lives under `files/presupuesto-obra-skill/presupuesto-obra/` and
`budget/` (see below). Everything else is markdown documentation/specs.

### The one canonical data folder — no duplicates elsewhere

`budget/datos-mock/maestros/` is the **single source of truth** for every CSV that feeds
the `budget/` app's relational model: `01_sucursales.csv`, `02_familias.csv`,
`03_articulos.csv`, `04_cuentas.csv`, `05_precios.csv`, `06_mano_obra_precios.csv`, plus the
`99_diagnostico.md`/`.json` data-quality report. Raw source spreadsheets get transformed
into this folder **once** and are then deleted — they don't linger at the repo root or
anywhere else. This has already happened for the original 4 Marval Excel exports, for
`FAMILIAS.csv`, for `Maestro de Acividades.xlsx`/`Lista de Precios.xlsx`, and for the
Sprint-0 `files/migracion-zoho.zip` bundle and its duplicate copy of `99_diagnostico.md` —
none of those exist in the repo anymore; if you need the original Marval exports, they live
untouched under `Bases de datos/` (see below). Before adding any new data file to the repo,
check whether its content already belongs in `budget/datos-mock/maestros/` instead of a new
location — never keep two copies of the same master data.

## The `presupuesto-obra` skill

### Setup

```bash
pip install pandas openpyxl "xlrd>=2.0.1" jsonschema
```

(`xlrd>=2.0` is required for legacy `.xls` files; openpyxl alone rejects them.)

### Commands

All commands go through `scripts/pto.py` — never reimplement the calculation by hand.

```bash
cd files/presupuesto-obra-skill/presupuesto-obra/scripts

# Import a legacy Excel budget into the canonical JSON format
python pto.py importar /ruta/PROYECTO_PTO_CON_APUs.xls --out obra.json --sucursal CALI --anio 2025

# Validate against the master data (accounts/articles)
python pto.py validar obra.json --articulos /ruta/ZMAESTRO_DE_ARTICULOS.xls --cuentas /ruta/Nivel_10_Transformado.xlsx --out hallazgos.csv
# exit code 1 if any ERROR-severity finding exists — usable as a CI gate

# Chapter summary / input (insumo) explosion with Pareto cutoff
python pto.py resumen obra.json --nivel 5
python pto.py explosion obra.json --top 40 --out explosion.csv

# Reprice to another sucursal/year, producing a new version (never edits in place)
python pto.py reprecio obra.json --precios /ruta/ZPRECIOS_MARVAL.xlsm --sucursal BOGOTA --anio 2027 --out obra_bog27.json

# Compare two versions
python pto.py comparar obra.json obra_bog27.json --nivel 5

# Export to CSV (cabecera / lineas / apu tables)
python pto.py exportar obra.json --out export/
```

Sprint-0 master-data migration (produces the 5 Zoho-ready CSVs plus the data-quality
diagnostic in `99_diagnostico.md`/`.json`):

```bash
python migrar.py --articulos ZMAESTRO_DE_ARTICULOS.xls \
                  --cuentas   Nivel_10_Transformado.xlsx \
                  --precios   ZPRECIOS_MARVAL.xlsm \
                  --obras     *_PTO_CON_APUs.xls \
                  --out       migracion/
```

There is no test suite; correctness is checked by reconciling `pto.py importar` +
`resumen` totals against the source Excel (see "Verified reference result" below).

### Installing the skill for auto-invocation

```bash
mkdir -p .claude/skills && cp -r files/presupuesto-obra-skill/presupuesto-obra .claude/skills/
```

## Architecture

### The data model: an account tree, not a flat table

A budget (`Obra`) is a tree of accounts (`Linea`) whose leaves are unit-price analyses
(APU, level 10) built from raw inputs (`Insumo`, level 11) drawn from the article master.
**There is no explicit parent field** — the hierarchy is derived purely from the account
code:

```
N4  CAPITULO       CC000000            (chapter)
N5  SUBCAPITULO    CCSSS000            (sub-chapter)
N8  ACTIVIDAD      CCSSSAAA            (activity — carries a MULTIPLIER, not a quantity)
N10 SUBACTIVIDAD   CCSSSAAA.SSSS       (sub-activity — the APU; quantity of work lives here)
N11 INSUMO         article code        (MAT: bare number; MO/TC/EQ: "MO 60133" style prefix)
```

Code → parent/level/template derivation lives in `presupuesto_core.py`
(`nivel_de`, `padre_de`, `plantilla_de`, `normaliza_codigo`, `clave_catalogo`) and is
re-implemented in Deluge in `references/zoho-creator.md` — keep both in sync if the
encoding rules ever change. Chapter ranges: **01–21 Edificación, 22–28 Urbanismo interno,
29–39 Urbanismo externo**.

### Calculation cascade (verified against real project data)

```
VU(N10) = SUM(rendimiento_i * precio_i)   over its N11 inputs
VT(N10) = cantidad(N10) * VU(N10)

VU(N8)  = SUM(VT of its N10 children)
VT(N8)  = cantidad(N8) * VU(N8)            <- cantidad(N8) is a MULTIPLIER, not a quantity

VU(N5)  = SUM(VT of N8 children);  VT(N5) = cantidad(N5) * VU(N5)
VU(N4)  = SUM(VT of N5 children);  VT(N4) = cantidad(N4) * VU(N4)
TOTAL   = SUM(VT of all N4)
```

The **N8 multiplier** is the model's distinguishing (and most error-prone) feature: it
replicates identical typologies (e.g. 20 equal floors) without duplicating lines. Default
quantity for N4/N5/N8 is always **1**; a `0` silently zeroes the whole branch (flagged as
`A02_CANT_CERO`, not blocked). Never treat it as an addable quantity.

All monetary math uses `Decimal` (never `float`) and rounds only at presentation time —
budgets run into the billions of pesos and cents compound fast.

Verified reference result (`BAIKAL_TORRE_3_V01`): 20 N4 / 67 N5 / 130 N8 / 170 N10 / 733
insumos, total $28,399,232,614.23 vs. Excel's $28,399,232,626.43 (a $12, ~4e-10 relative
rounding difference).

### Price resolution

Prices are keyed by **(articulo, sucursal, año)** and stored in **wide format**
(`anio_base` + `precio_anio_1..4` per row) rather than long/normalized — this cuts ~90k
rows to ~15-22k and reduces lookups to a 2-field query instead of 3. `anio_base` differs
per branch (`sucursal`) — e.g. Cali materials start at 2024, others at 2025 — so always
locate the year column by the `(sucursal, anio)` pair, never by fixed offset. A missing
price means "no data", never `0`.

### Core files

| File | Role |
|---|---|
| `scripts/presupuesto_core.py` | The engine: code parsing, `Obra`/`Linea`/`Insumo` dataclasses, cascade recalculation, `explosion_insumos()` (Pareto-sorted input breakdown), `validar()` (rule engine). No dependency on pandas/openpyxl — pure stdlib. |
| `scripts/fuentes_marval.py` | Excel readers for the 4 real Marval source files (article master, account master, price catalog, exported budget) plus `reprecio()`. Depends on pandas/openpyxl/xlrd. |
| `scripts/pto.py` | CLI wrapping the two modules above (see Commands). |
| `scripts/migrar.py` | Sprint-0 script: reads all 4 sources, derives missing/orphaned accounts, flags inactive articles, and emits the 5 CSVs + diagnostic report for the eventual Zoho Creator bulk load. |
| `assets/esquema_obra.json` | JSON Schema for the canonical `Obra` JSON — the contract between the engine, the future web widget, and Zoho Creator integrations. |

### Reference docs (read on demand, not up front)

| File | When to read it |
|---|---|
| `references/fuentes-datos.md` | Before touching any of the 4 raw Marval Excel files — exact sheet/column layout and known traps (misaligned year columns, leading-zero codes, a 100k-row empty `TEMP` sheet, malformed codes like `TC 2161 60847`, `.xls` requiring `xlrd`). |
| `references/reglas-negocio.md` | Questions about templates, the N8 multiplier, price/year projection, resource types, or what's intentionally out of scope (AIU/indirects, scheduling, measurement lines). |
| `references/validaciones.md` | Full catalog of validation rules (E01-E07 errors, A01-A06 warnings, I01 info) with severity and how to fix each. |
| `references/zoho-creator.md` | When implementing the actual app: Creator API limits (200 records/request, 50 calls/min throttle), Deluge cascade-recalc function, custom API contract for the React widget, bulk-load ordering/strategy, anti-patterns to avoid. |
| `references/benchmark-opus-presto-cype.md` | When designing new functionality — what to borrow from Opus/Presto/Arquimedes-CYPE. |

## Key business rules to respect when editing anything in this area

- `codigo_padre` is always derived from the code, never stored/entered directly.
- A budget in state `APROBADO` is immutable; any change creates a new version instead of
  editing in place (applies to repricing too — it must never mutate the original JSON).
- A budget with open `ERROR`-severity findings must not be approvable — this is the one
  governance control the plan is built around.
- Resource type (MAT/MO/EQ/TC) is derived from the article code's prefix, not from its
  family; the family groups articles for reporting but doesn't imply resource type.
- Keep `descripcion_obra` (what's in the budget) and the catalog description separate —
  they're allowed to diverge on purpose.
