#!/usr/bin/env python3
"""
pto.py — CLI del motor de presupuestos de obra civil.

Uso:
  python pto.py importar   PTO.xls --out obra.json
  python pto.py validar    obra.json [--articulos ZMAESTRO.xls] [--cuentas Nivel10.xlsx]
  python pto.py explosion  obra.json [--out explosion.csv] [--top 50]
  python pto.py reprecio   obra.json --precios ZPRECIOS.xlsm --sucursal CALI --anio 2026
                                     [--out obra_2026.json]
  python pto.py resumen    obra.json [--nivel 4]
  python pto.py comparar   obra_a.json obra_b.json [--nivel 8]
  python pto.py exportar   obra.json --formato csv|zoho --out carpeta/

Todos los comandos imprimen un resumen legible en stdout y devuelven codigo 1
si hay ERRORES de validacion (util en CI).
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from presupuesto_core import Obra, validar, _d  # noqa: E402
import fuentes_marval as fm  # noqa: E402


def _cargar(path: str) -> Obra:
    with open(path, encoding="utf-8") as fh:
        return Obra.from_dict(json.load(fh))


def _money(x) -> str:
    return f"{float(x):,.2f}"


# --------------------------------------------------------------------------

def cmd_importar(a):
    obra = fm.importar_presupuesto(a.archivo, hoja=a.hoja)
    if a.sucursal:
        obra.sucursal = a.sucursal
    if a.anio:
        obra.anio_precios = a.anio
    obra.to_json(a.out)
    n = {k: sum(1 for l in obra.lineas if l.nivel == k) for k in (4, 5, 8, 10)}
    ins = sum(len(l.insumos) for l in obra.lineas)
    print(f"Proyecto : {obra.proyecto} v{obra.version}")
    print(f"Lineas   : N4={n[4]} N5={n[5]} N8={n[8]} N10={n[10]} insumos={ins}")
    print(f"TOTAL    : {_money(obra.total)}")
    print(f"Vr/m2    : {_money(obra.valor_m2)}   Vr/inmueble: {_money(obra.valor_inmueble)}")
    print(f"-> {a.out}")
    return 0


def cmd_validar(a):
    obra = _cargar(a.obra)
    art = fm.cargar_articulos(a.articulos) if a.articulos else None
    cta = fm.cargar_cuentas(a.cuentas) if a.cuentas else None
    issues = validar(obra, art, cta)
    errores = [i for i in issues if i["severidad"] == "ERROR"]
    for i in issues[: a.max]:
        print(f"[{i['severidad']:<5}] {i['regla']:<24} {i['codigo']:<30} {i['mensaje']}")
    if len(issues) > a.max:
        print(f"... {len(issues) - a.max} hallazgos mas")
    print(f"\nTotal: {len(issues)} hallazgos ({len(errores)} ERROR)")
    if a.out:
        with open(a.out, "w", encoding="utf-8", newline="") as fh:
            w = csv.DictWriter(fh, fieldnames=["severidad", "regla", "codigo", "mensaje"])
            w.writeheader()
            w.writerows(issues)
        print(f"-> {a.out}")
    return 1 if errores else 0


def cmd_explosion(a):
    obra = _cargar(a.obra)
    filas = obra.explosion_insumos()
    print(f"{'CODIGO':<14}{'DESCRIPCION':<34}{'CANTIDAD':>14} {'UM':<4}"
          f"{'IMPORTE':>18}{'%':>7}{'ACUM%':>8}")
    for r in filas[: a.top]:
        print(f"{r['codigo']:<14}{r['descripcion'][:32]:<34}"
              f"{float(r['cantidad']):>14,.2f} {r['unidad']:<4}"
              f"{float(r['importe']):>18,.0f}{r['incidencia_pct']:>7.2f}"
              f"{r['acumulado_pct']:>8.2f}")
    p80 = next((i + 1 for i, r in enumerate(filas) if r["acumulado_pct"] >= 80), len(filas))
    print(f"\n{len(filas)} insumos distintos. {p80} concentran el 80% del costo "
          f"({p80 / len(filas) * 100:.1f}% del catalogo).")
    if a.out:
        with open(a.out, "w", encoding="utf-8", newline="") as fh:
            w = csv.writer(fh)
            w.writerow(["codigo", "descripcion", "unidad", "tipo", "cantidad",
                        "precio", "importe", "incidencia_pct", "acumulado_pct",
                        "apariciones", "precios_distintos"])
            for r in filas:
                w.writerow([r["codigo"], r["descripcion"], r["unidad"], r["tipo"],
                            float(r["cantidad"]), float(r["precio"]),
                            float(r["importe"]), round(r["incidencia_pct"], 4),
                            round(r["acumulado_pct"], 4), r["apariciones"],
                            "|".join(r["precios_distintos"])])
        print(f"-> {a.out}")
    return 0


def cmd_reprecio(a):
    obra = _cargar(a.obra)
    precios = fm.cargar_precios(a.precios, a.sucursal, a.anio)
    res = fm.reprecio(obra, precios, a.sucursal, a.anio)
    print(f"Catalogo {a.sucursal} {a.anio}: {len(precios)} precios")
    print(f"Insumos actualizados : {res['insumos_actualizados']}")
    print(f"Insumos sin precio   : {res['sin_precio']}")
    print(f"Total anterior       : {_money(res['total_anterior'])}")
    print(f"Total nuevo          : {_money(res['total_nuevo'])}  "
          f"({res['variacion_pct']:+.2f}%)")
    out = a.out or a.obra.replace(".json", f"_{a.sucursal}_{a.anio}.json")
    obra.to_json(out)
    print(f"-> {out}")
    return 0


def cmd_resumen(a):
    obra = _cargar(a.obra)
    total = obra.total or Decimal(1)
    print(f"{obra.proyecto}  v{obra.version}   {obra.sucursal} {obra.anio_precios or ''}")
    print(f"{'CODIGO':<16}{'DESCRIPCION':<36}{'VALOR TOTAL':>20}{'%':>8}{'$/m2':>14}")
    div = _d(obra.n_inmuebles) * _d(obra.area_inmueble_m2)
    for l in obra.lineas:
        if l.nivel > a.nivel:
            continue
        sang = "  " * ({4: 0, 5: 1, 8: 2, 10: 3}[l.nivel])
        print(f"{sang + l.codigo:<16}{l.descripcion[:34]:<36}{float(l.vt):>20,.0f}"
              f"{float(l.vt / total * 100):>8.2f}{float(l.vt / div):>14,.0f}")
    print(f"{'TOTAL':<52}{float(obra.total):>20,.0f}")
    return 0


def cmd_comparar(a):
    o1, o2 = _cargar(a.obra_a), _cargar(a.obra_b)
    i1 = {l.codigo: l for l in o1.lineas if l.nivel <= a.nivel}
    i2 = {l.codigo: l for l in o2.lineas if l.nivel <= a.nivel}
    codigos = sorted(set(i1) | set(i2))
    print(f"{'CODIGO':<16}{'DESCRIPCION':<32}{'A':>18}{'B':>18}{'DELTA':>18}{'%':>9}")
    for c in codigos:
        va = i1[c].vt if c in i1 else Decimal(0)
        vb = i2[c].vt if c in i2 else Decimal(0)
        if va == vb:
            continue
        d = vb - va
        pct = float(d / va * 100) if va else float("inf")
        desc = (i1.get(c) or i2[c]).descripcion[:30]
        print(f"{c:<16}{desc:<32}{float(va):>18,.0f}{float(vb):>18,.0f}"
              f"{float(d):>18,.0f}{pct:>9.2f}")
    d = o2.total - o1.total
    print(f"\nTOTAL A {_money(o1.total)}  |  TOTAL B {_money(o2.total)}  |  "
          f"DELTA {_money(d)} ({float(d / (o1.total or 1) * 100):+.2f}%)")
    return 0


def cmd_exportar(a):
    obra = _cargar(a.obra)
    os.makedirs(a.out, exist_ok=True)
    # cuentas / lineas
    with open(os.path.join(a.out, "presupuesto_lineas.csv"), "w",
              encoding="utf-8", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["codigo", "nivel", "padre", "descripcion", "unidad",
                    "cantidad", "tipo", "valor_unitario", "valor_total"])
        for l in obra.lineas:
            w.writerow([l.codigo, l.nivel, l.padre or "", l.descripcion, l.unidad,
                        float(l.cantidad), l.tipo, float(l.vu), float(l.vt)])
    # apus
    with open(os.path.join(a.out, "presupuesto_apu.csv"), "w",
              encoding="utf-8", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["codigo_n10", "codigo_articulo", "descripcion", "unidad",
                    "tipo", "rendimiento", "precio", "parcial"])
        for l in obra.lineas:
            for i in l.insumos:
                w.writerow([l.codigo, i.codigo, i.descripcion, i.unidad, i.tipo,
                            float(i.rendimiento), float(i.precio), float(i.parcial)])
    # cabecera
    with open(os.path.join(a.out, "presupuesto_cabecera.csv"), "w",
              encoding="utf-8", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["proyecto", "version", "sucursal", "anio_precios", "n_inmuebles",
                    "area_inmueble_m2", "total", "valor_inmueble", "valor_m2"])
        w.writerow([obra.proyecto, obra.version, obra.sucursal, obra.anio_precios,
                    obra.n_inmuebles, float(obra.area_inmueble_m2),
                    float(obra.total), float(obra.valor_inmueble),
                    float(obra.valor_m2)])
    print(f"-> {a.out}/presupuesto_cabecera.csv, presupuesto_lineas.csv, "
          f"presupuesto_apu.csv")
    return 0


# --------------------------------------------------------------------------

def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("importar"); s.set_defaults(f=cmd_importar)
    s.add_argument("archivo"); s.add_argument("--hoja", default="PTO CON APUs")
    s.add_argument("--out", default="obra.json")
    s.add_argument("--sucursal", default=""); s.add_argument("--anio", type=int, default=0)

    s = sub.add_parser("validar"); s.set_defaults(f=cmd_validar)
    s.add_argument("obra"); s.add_argument("--articulos"); s.add_argument("--cuentas")
    s.add_argument("--out"); s.add_argument("--max", type=int, default=60)

    s = sub.add_parser("explosion"); s.set_defaults(f=cmd_explosion)
    s.add_argument("obra"); s.add_argument("--out"); s.add_argument("--top", type=int, default=30)

    s = sub.add_parser("reprecio"); s.set_defaults(f=cmd_reprecio)
    s.add_argument("obra"); s.add_argument("--precios", required=True)
    s.add_argument("--sucursal", required=True); s.add_argument("--anio", type=int, required=True)
    s.add_argument("--out")

    s = sub.add_parser("resumen"); s.set_defaults(f=cmd_resumen)
    s.add_argument("obra"); s.add_argument("--nivel", type=int, default=4)

    s = sub.add_parser("comparar"); s.set_defaults(f=cmd_comparar)
    s.add_argument("obra_a"); s.add_argument("obra_b")
    s.add_argument("--nivel", type=int, default=5)

    s = sub.add_parser("exportar"); s.set_defaults(f=cmd_exportar)
    s.add_argument("obra"); s.add_argument("--formato", default="csv")
    s.add_argument("--out", default="export")

    a = p.parse_args()
    sys.exit(a.f(a))


if __name__ == "__main__":
    main()
