"""
presupuesto_core.py — Motor de presupuestos de obra civil (modelo Marval).

Modelo jerarquico:
    N4  capitulo        CCSSSAAA -> CC + "000000"
    N5  subcapitulo     CCSSSAAA -> CCSSS + "000"
    N8  actividad       CCSSSAAA          (multiplicador)
    N10 subactividad    CCSSSAAA.SSSS     (APU / matriz)
    N11 insumo          codigo del maestro de articulos

Regla de calculo (verificada contra BAIKAL TORRE 3 V01):
    VU(N10) = SUM( rendimiento_i * precio_i )      sobre insumos N11
    VT(N10) = cantidad(N10) * VU(N10)
    VU(N8)  = SUM( VT(hijos N10) )
    VT(N8)  = cantidad(N8) * VU(N8)                 <- cantidad(N8) es MULTIPLICADOR
    idem para N5 y N4.

Sin dependencias fuera de la libreria estandar salvo pandas/openpyxl para los
lectores de Excel (opcionales: solo se importan cuando se usan).
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field, asdict
from decimal import Decimal, ROUND_HALF_UP
from typing import Iterable

# --------------------------------------------------------------------------
# Codificacion de cuentas
# --------------------------------------------------------------------------

RE_N10 = re.compile(r"^(\d{8})\.(\d{4})$")
RE_N8 = re.compile(r"^(\d{2})(\d{3})(\d{3})$")
RE_ART = re.compile(r"^((MO|TC|EQ) )?\d+$")   # codigo de insumo (nivel 11)

PLANTILLAS = {
    "EDIFICACION": range(1, 22),        # capitulos 01..21
    "URBANISMO_INTERNO": range(22, 29),  # capitulos 22..28
    "URBANISMO_EXTERNO": range(29, 40),  # capitulos 29..39
}

TIPOS_RECURSO = {"MAT": "Material", "MO": "Mano de obra",
                 "EQ": "Equipo", "TC": "Todo costo"}


def normaliza_codigo(cod) -> str:
    """'1001001' -> '01001001'; conserva el sufijo .SSSS y los prefijos MO/TC/EQ."""
    s = str(cod).strip().upper()
    if s.endswith(".0"):
        s = s[:-2]
    m = re.match(r"^(MO|TC|EQ|MAT)\s*[-_ ]?\s*(.+)$", s)
    if m:
        return f"{m.group(1)} {m.group(2).strip()}"
    if "." in s:
        izq, der = s.split(".", 1)
        return f"{izq.zfill(8)}.{der.ljust(4, '0')[:4]}"
    if s.isdigit() and len(s) in (7, 8):
        return s.zfill(8)
    return s


def nivel_de(cod: str) -> int | None:
    """Devuelve 4, 5, 8 o 10 segun la forma del codigo de cuenta."""
    c = normaliza_codigo(cod)
    if RE_N10.match(c):
        return 10
    m = RE_N8.match(c)
    if not m:
        return None
    cap, sub, act = m.groups()
    if sub == "000" and act == "000":
        return 4
    if act == "000":
        return 5
    return 8


def padre_de(cod: str) -> str | None:
    """Codigo del nivel inmediatamente superior."""
    c = normaliza_codigo(cod)
    n = nivel_de(c)
    if n == 10:
        return c.split(".")[0]
    if n == 8:
        return c[:5] + "000"
    if n == 5:
        return c[:2] + "000000"
    return None


def cadena_padres(cod: str) -> list[str]:
    out, actual = [], padre_de(cod)
    while actual:
        out.append(actual)
        actual = padre_de(actual)
    return out


def plantilla_de(cod: str) -> str | None:
    c = normaliza_codigo(cod)
    if not c[:2].isdigit():
        return None
    cap = int(c[:2])
    for nombre, rango in PLANTILLAS.items():
        if cap in rango:
            return nombre
    return None


def tipo_recurso_de(cod_articulo: str) -> str:
    """Deriva el tipo de recurso del prefijo del codigo de insumo."""
    c = normaliza_codigo(cod_articulo)
    for p in ("MO", "TC", "EQ", "MAT"):
        if c.startswith(p + " "):
            return p if p != "MAT" else "MAT"
    return "MAT"


def clave_catalogo(cod_articulo: str) -> str:
    """'MO 60133' -> '60133'; '152001' -> '152001'. Clave de busqueda de precio."""
    c = normaliza_codigo(cod_articulo)
    return c.split(" ", 1)[1].strip() if " " in c else c


# --------------------------------------------------------------------------
# Estructuras
# --------------------------------------------------------------------------

def _d(x) -> Decimal:
    if x is None or x == "":
        return Decimal(0)
    if isinstance(x, Decimal):
        return x
    return Decimal(str(x))


def redondea(x: Decimal, dec: int = 2) -> Decimal:
    q = Decimal(1).scaleb(-dec)
    return _d(x).quantize(q, rounding=ROUND_HALF_UP)


@dataclass
class Insumo:
    """Linea nivel 11 dentro de un APU."""
    codigo: str
    descripcion: str = ""
    unidad: str = ""
    rendimiento: Decimal = Decimal(1)   # cantidad por unidad de la subactividad
    precio: Decimal = Decimal(0)
    tipo: str = "MAT"

    @property
    def parcial(self) -> Decimal:
        return _d(self.rendimiento) * _d(self.precio)


@dataclass
class Linea:
    """Linea de presupuesto de nivel 4, 5, 8 o 10."""
    codigo: str
    nivel: int
    descripcion: str = ""
    unidad: str = "UN"
    cantidad: Decimal = Decimal(1)
    tipo: str = ""                       # M.O / T.C / MAT / EQ (clasificacion N10)
    insumos: list[Insumo] = field(default_factory=list)
    # calculados
    vu: Decimal = Decimal(0)
    vt: Decimal = Decimal(0)
    hijos: list["Linea"] = field(default_factory=list, repr=False)
    padre: str | None = None


@dataclass
class Obra:
    proyecto: str = ""
    version: str = "01"
    sucursal: str = ""
    anio_precios: int = 0
    n_inmuebles: int = 1
    area_inmueble_m2: Decimal = Decimal(1)
    lineas: list[Linea] = field(default_factory=list)

    # ---- indexado / jerarquia -------------------------------------------
    def indexar(self) -> dict[str, Linea]:
        idx = {l.codigo: l for l in self.lineas}
        for l in self.lineas:
            l.hijos = []
        for l in self.lineas:
            p = padre_de(l.codigo)
            l.padre = p
            if p and p in idx:
                idx[p].hijos.append(l)
        return idx

    # ---- motor de calculo ------------------------------------------------
    def recalcular(self) -> "Obra":
        idx = self.indexar()
        for l in self.lineas:
            if l.nivel == 10:
                l.vu = sum((i.parcial for i in l.insumos), Decimal(0))
                l.vt = _d(l.cantidad) * l.vu
        for nivel in (8, 5, 4):
            for l in (x for x in self.lineas if x.nivel == nivel):
                l.vu = sum((h.vt for h in l.hijos), Decimal(0))
                l.vt = _d(l.cantidad) * l.vu
        return self

    @property
    def total(self) -> Decimal:
        return sum((l.vt for l in self.lineas if l.nivel == 4), Decimal(0))

    @property
    def valor_inmueble(self) -> Decimal:
        return self.total / _d(self.n_inmuebles or 1)

    @property
    def valor_m2(self) -> Decimal:
        div = _d(self.n_inmuebles or 1) * _d(self.area_inmueble_m2 or 1)
        return self.total / div

    # ---- explosion de insumos -------------------------------------------
    def explosion_insumos(self) -> list[dict]:
        """Consolida todos los insumos con su cantidad total de obra.

        cantidad_total = rendimiento * cantidad(N10) * PROD(cantidades de ancestros)
        """
        idx = self.indexar()
        acc: dict[str, dict] = {}
        for l in (x for x in self.lineas if x.nivel == 10):
            factor = _d(l.cantidad)
            for p in cadena_padres(l.codigo):
                if p in idx:
                    factor *= _d(idx[p].cantidad)
            for ins in l.insumos:
                k = normaliza_codigo(ins.codigo)
                r = acc.setdefault(k, {
                    "codigo": k, "descripcion": ins.descripcion,
                    "unidad": ins.unidad, "tipo": ins.tipo,
                    "cantidad": Decimal(0), "precio": _d(ins.precio),
                    "importe": Decimal(0), "apariciones": 0,
                    "precios_distintos": set(),
                })
                cant = _d(ins.rendimiento) * factor
                r["cantidad"] += cant
                r["importe"] += cant * _d(ins.precio)
                r["apariciones"] += 1
                r["precios_distintos"].add(str(_d(ins.precio)))
        filas = []
        total = self.total or Decimal(1)
        for r in acc.values():
            r["precios_distintos"] = sorted(r["precios_distintos"])
            r["incidencia_pct"] = float(r["importe"] / total * 100)
            filas.append(r)
        filas.sort(key=lambda r: r["importe"], reverse=True)
        acum = Decimal(0)
        for r in filas:
            acum += r["importe"]
            r["acumulado_pct"] = float(acum / total * 100)
        return filas

    # ---- serializacion ---------------------------------------------------
    def to_dict(self) -> dict:
        def conv(o):
            if isinstance(o, Decimal):
                return float(o)
            if isinstance(o, (set, tuple)):
                return list(o)
            return o
        d = {
            "meta": {
                "proyecto": self.proyecto, "version": self.version,
                "sucursal": self.sucursal, "anio_precios": self.anio_precios,
                "n_inmuebles": self.n_inmuebles,
                "area_inmueble_m2": float(self.area_inmueble_m2),
                "total": float(self.total),
                "valor_inmueble": float(self.valor_inmueble),
                "valor_m2": float(self.valor_m2),
            },
            "lineas": [],
        }
        for l in self.lineas:
            row = {k: conv(v) for k, v in asdict(l).items()
                   if k not in ("hijos", "insumos")}
            row["insumos"] = [{k: conv(v) for k, v in asdict(i).items()}
                              for i in l.insumos]
            d["lineas"].append(row)
        return d

    def to_json(self, path: str) -> None:
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(self.to_dict(), fh, ensure_ascii=False, indent=2)

    @staticmethod
    def from_dict(d: dict) -> "Obra":
        m = d.get("meta", {})
        o = Obra(
            proyecto=m.get("proyecto", ""), version=str(m.get("version", "01")),
            sucursal=m.get("sucursal", ""), anio_precios=int(m.get("anio_precios") or 0),
            n_inmuebles=int(m.get("n_inmuebles") or 1),
            area_inmueble_m2=_d(m.get("area_inmueble_m2") or 1),
        )
        for row in d["lineas"]:
            l = Linea(
                codigo=row["codigo"], nivel=int(row["nivel"]),
                descripcion=row.get("descripcion", ""), unidad=row.get("unidad", "UN"),
                cantidad=_d(row.get("cantidad", 1)), tipo=row.get("tipo", ""),
                insumos=[Insumo(codigo=i["codigo"], descripcion=i.get("descripcion", ""),
                                unidad=i.get("unidad", ""),
                                rendimiento=_d(i.get("rendimiento", 1)),
                                precio=_d(i.get("precio", 0)),
                                tipo=i.get("tipo", "MAT"))
                         for i in row.get("insumos", [])],
            )
            o.lineas.append(l)
        return o.recalcular()


# --------------------------------------------------------------------------
# Validaciones
# --------------------------------------------------------------------------

SEVERIDADES = ("ERROR", "AVISO", "INFO")


def validar(obra: Obra, articulos: dict | None = None,
            cuentas: dict | None = None) -> list[dict]:
    """Reglas de consistencia. articulos/cuentas: dicts codigo -> registro."""
    issues: list[dict] = []

    def add(sev, regla, codigo, msg):
        issues.append({"severidad": sev, "regla": regla,
                       "codigo": codigo, "mensaje": msg})

    idx = obra.indexar()
    vistos: set[str] = set()

    for l in obra.lineas:
        # duplicados
        if l.codigo in vistos:
            add("ERROR", "E01_DUPLICADO", l.codigo, "Codigo repetido en la obra")
        vistos.add(l.codigo)
        # nivel coherente con el codigo
        if nivel_de(l.codigo) != l.nivel:
            add("ERROR", "E02_NIVEL", l.codigo,
                f"Nivel declarado {l.nivel} no coincide con la codificacion "
                f"({nivel_de(l.codigo)})")
        # huerfanos
        p = padre_de(l.codigo)
        if p and p not in idx:
            add("ERROR", "E03_HUERFANO", l.codigo, f"Falta la cuenta padre {p}")
        # cuenta inexistente en el maestro
        if cuentas is not None and l.codigo not in cuentas:
            add("AVISO", "A01_FUERA_MAESTRO", l.codigo,
                "Cuenta no existe en el maestro de cuentas")
        if l.nivel == 10:
            if not l.insumos:
                add("ERROR", "E04_APU_VACIO", l.codigo, "Subactividad sin insumos")
            if _d(l.cantidad) == 0:
                add("AVISO", "A02_CANT_CERO", l.codigo, "Cantidad en cero")
            for ins in l.insumos:
                if _d(ins.precio) <= 0:
                    add("ERROR", "E05_PRECIO_CERO", f"{l.codigo}/{ins.codigo}",
                        "Insumo sin precio")
                if _d(ins.rendimiento) <= 0:
                    add("AVISO", "A03_REND_CERO", f"{l.codigo}/{ins.codigo}",
                        "Rendimiento en cero o negativo")
                if not RE_ART.match(normaliza_codigo(ins.codigo)):
                    add("ERROR", "E07_CODIGO_MALFORMADO", f"{l.codigo}/{ins.codigo}",
                        "Codigo de insumo no cumple el patron [MO|TC|EQ ]NNNNN")
                if articulos is not None:
                    k = clave_catalogo(ins.codigo)
                    if k not in articulos:
                        add("ERROR", "E06_ART_INEXISTENTE",
                            f"{l.codigo}/{ins.codigo}",
                            "Insumo no existe en el maestro de articulos")
                    elif ins.unidad and articulos[k].get("um") and \
                            ins.unidad.strip().upper() != str(articulos[k]["um"]).strip().upper():
                        add("AVISO", "A04_UM_DISTINTA", f"{l.codigo}/{ins.codigo}",
                            f"UM en obra '{ins.unidad}' != maestro "
                            f"'{articulos[k]['um']}'")
        else:
            if not l.hijos:
                add("AVISO", "A05_SIN_HIJOS", l.codigo,
                    f"Nivel {l.nivel} sin lineas hijas")
            if _d(l.cantidad) == 0:
                add("AVISO", "A02_CANT_CERO", l.codigo,
                    "Multiplicador en cero: anula toda la rama")

    # precio inconsistente del mismo insumo en APUs distintos
    for r in obra.explosion_insumos():
        if len(r["precios_distintos"]) > 1:
            add("AVISO", "A06_PRECIO_INCONSISTENTE", r["codigo"],
                f"Mismo insumo con {len(r['precios_distintos'])} precios distintos: "
                + ", ".join(r["precios_distintos"][:5]))

    # mezcla de plantillas
    plantillas = {plantilla_de(l.codigo) for l in obra.lineas if l.nivel == 4}
    plantillas.discard(None)
    if len(plantillas) > 1:
        add("INFO", "I01_MULTIPLANTILLA", "-",
            "La obra mezcla plantillas: " + ", ".join(sorted(plantillas)))

    orden = {s: i for i, s in enumerate(SEVERIDADES)}
    issues.sort(key=lambda x: (orden[x["severidad"]], x["regla"], x["codigo"]))
    return issues
