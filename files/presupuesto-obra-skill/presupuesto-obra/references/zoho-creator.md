# Implementacion en Zoho Creator

Artefactos concretos: funciones Deluge, contrato del widget y estrategia de
carga. **Todo el codigo de esta pagina requiere prueba en el entorno real** —
la sintaxis de Deluge varia entre versiones de Creator.

## Indice

1. Limites de plataforma que condicionan el diseno
2. Funciones Deluge de utilidad
3. Recalculo en cascada
4. Traida de precio
5. Validacion en formulario
6. Custom API para el widget
7. Contrato del widget
8. Carga masiva inicial
9. Que NO hacer en Deluge

---

## 1. Limites de plataforma que condicionan el diseno

| Limite | Valor | Consecuencia de diseno |
|---|---|---|
| Registros por peticion API v2 | 200 | Todo lote se parte de a 200; para volumen usar Bulk API |
| Throttle | 50 llamadas API / usuario / minuto (error 2955) | Backoff obligatorio en la carga masiva |
| Tareas de integracion Deluge | Cada `zoho.creator.getRecords` consume 1 llamada | **Nunca dentro de un bucle sobre lineas** |
| Timeout de funcion Deluge | Acotado | El recalculo debe ser por lotes con estado, no monolitico |

La regla que sale de aqui: **una operacion = una lectura masiva + calculo en
memoria + una escritura masiva.** Nunca registro a registro.

---

## 2. Funciones Deluge de utilidad

```javascript
// ─── derivar el codigo padre a partir del codigo de cuenta ───
// N10 "02001001.1002" -> "02001001"
// N8  "02001001"      -> "02001000"
// N5  "02001000"      -> "02000000"
// N4  "02000000"      -> ""
string presupuesto.codigo_padre(string codigo)
{
    c = codigo.trim();
    if (c.contains("."))
    {
        return c.getPrefix(".");
    }
    if (c.length() != 8)
    {
        return "";
    }
    sub = c.subString(2, 5);
    act = c.subString(5, 8);
    if (act != "000")
    {
        return c.subString(0, 5) + "000";       // N8 -> N5
    }
    else if (sub != "000")
    {
        return c.subString(0, 2) + "000000";    // N5 -> N4
    }
    return "";                                   // N4 es raiz
}
```

```javascript
// ─── nivel a partir del codigo ───
int presupuesto.nivel_de(string codigo)
{
    c = codigo.trim();
    if (c.contains("."))
    {
        return 10;
    }
    if (c.length() != 8)
    {
        return 0;
    }
    sub = c.subString(2, 5);
    act = c.subString(5, 8);
    if (sub == "000" && act == "000")
    {
        return 4;
    }
    else if (act == "000")
    {
        return 5;
    }
    return 8;
}
```

```javascript
// ─── plantilla a partir del capitulo ───
string presupuesto.plantilla_de(string codigo)
{
    cap = codigo.subString(0, 2).toLong();
    if (cap >= 1 && cap <= 21)  { return "EDIFICACION"; }
    if (cap >= 22 && cap <= 28) { return "URBANISMO_INTERNO"; }
    if (cap >= 29 && cap <= 39) { return "URBANISMO_EXTERNO"; }
    return "ESPECIAL";
}
```

```javascript
// ─── clave de catalogo: "MO 60133" -> "60133" ───
string presupuesto.clave_catalogo(string codigo)
{
    c = codigo.trim().toUpperCase();
    if (c.startsWith("MO ") || c.startsWith("TC ") || c.startsWith("EQ "))
    {
        return c.subString(3).trim();
    }
    return c;
}
```

---

## 3. Recalculo en cascada

Se dispara desde un **boton** en el reporte de presupuesto, nunca desde
`on_validate` de la linea.

```javascript
void presupuesto.recalcular(int presupuesto_id)
{
    // ── 1. UNA lectura masiva: lineas + insumos ─────────────────────────
    lineas = LineaPresupuesto[presupuesto == presupuesto_id];

    vu     = Map();   // codigo -> valor unitario
    vt     = Map();   // codigo -> valor total
    cant   = Map();   // codigo -> cantidad / multiplicador
    hijos  = Map();   // codigo padre -> lista de codigos hijos

    for each l in lineas
    {
        cant.put(l.codigo, ifnull(l.cantidad, 1.0));
        p = l.codigo_padre;
        if (p != null && p != "")
        {
            lst = ifnull(hijos.get(p), List());
            lst.add(l.codigo);
            hijos.put(p, lst);
        }
    }

    // ── 2. N10: VU = suma de (rendimiento x precio) del subformulario ───
    for each l in lineas
    {
        if (l.nivel == 10)
        {
            s = 0.0;
            for each ins in l.insumos
            {
                s = s + (ifnull(ins.rendimiento, 0.0) * ifnull(ins.precio, 0.0));
            }
            vu.put(l.codigo, s);
            vt.put(l.codigo, s * cant.get(l.codigo));
        }
    }

    // ── 3. Cascada 8 -> 5 -> 4. La cantidad del padre MULTIPLICA ────────
    for each nv in {8, 5, 4}
    {
        for each l in lineas
        {
            if (l.nivel == nv)
            {
                s = 0.0;
                for each h in ifnull(hijos.get(l.codigo), List())
                {
                    s = s + ifnull(vt.get(h), 0.0);
                }
                vu.put(l.codigo, s);
                vt.put(l.codigo, s * cant.get(l.codigo));
            }
        }
    }

    // ── 4. UNA escritura por linea (Creator no tiene update masivo nativo)
    total = 0.0;
    for each l in lineas
    {
        l.valor_unitario = ifnull(vu.get(l.codigo), 0.0);
        l.valor_total    = ifnull(vt.get(l.codigo), 0.0);
        if (l.nivel == 4)
        {
            total = total + l.valor_total;
        }
    }

    // ── 5. Cabecera ─────────────────────────────────────────────────────
    ptoRec = Presupuesto[ID == presupuesto_id];
    n   = ifnull(ptoRec.n_inmuebles, 1);
    m2  = ifnull(ptoRec.area_inmueble_m2, 1.0);
    ptoRec.total           = total;
    ptoRec.valor_inmueble  = total / n;
    ptoRec.valor_m2        = total / (n * m2);
    ptoRec.fecha_recalculo = zoho.currenttime;
}
```

> **Nota de rendimiento.** El paso 4 escribe linea por linea dentro del mismo
> contexto Deluge (no consume API, pero si tiempo). Con 400 lineas es
> aceptable; sobre ~1.500 hay que mover el calculo al servicio Python y
> devolver el resultado por Bulk API. Medir antes de optimizar.

---

## 4. Traida de precio

```javascript
// Devuelve el precio del articulo para la sucursal y anio del presupuesto.
// El catalogo es ANCHO: anio_base + precio_anio_1..4
map presupuesto.traer_precio(string cod_articulo, int sucursal_id, int anio)
{
    res = Map();
    res.put("precio", 0.0);
    res.put("origen", "SIN_PRECIO");

    clave = thisapp.presupuesto.clave_catalogo(cod_articulo);
    art   = Articulo[codigo == clave];
    if (art.count() == 0)
    {
        res.put("origen", "ARTICULO_INEXISTENTE");
        return res;
    }

    pr = Precio[articulo == art.ID && sucursal == sucursal_id];
    if (pr.count() == 0)
    {
        // fallback a la sucursal de referencia, marcado como tal
        suc = Sucursal[ID == sucursal_id];
        if (suc.sucursal_referencia != null)
        {
            pr = Precio[articulo == art.ID && sucursal == suc.sucursal_referencia];
            if (pr.count() > 0)
            {
                res.put("origen", "SUCURSAL_REFERENCIA");
            }
        }
    }
    else
    {
        res.put("origen", "CATALOGO");
    }
    if (pr.count() == 0)
    {
        return res;
    }

    // el anio base VARIA por sucursal: 2024 en materiales Cali, 2025 en el resto
    offset = anio - pr.anio_base;
    valor  = 0.0;
    if (offset == 0)      { valor = pr.precio_anio_1; }
    else if (offset == 1) { valor = pr.precio_anio_2; }
    else if (offset == 2) { valor = pr.precio_anio_3; }
    else if (offset == 3) { valor = pr.precio_anio_4; }
    else
    {
        res.put("origen", "ANIO_FUERA_DE_RANGO");
        return res;
    }

    res.put("precio", ifnull(valor, 0.0));
    res.put("unidad", art.unidad_medida);
    res.put("descripcion_catalogo", art.descripcion);
    if (ifnull(valor, 0.0) == 0.0)
    {
        res.put("origen", "SIN_PRECIO");
    }
    return res;
}
```

---

## 5. Validacion en formulario

`LineaPresupuesto` → workflow `on validate`:

```javascript
nv = thisapp.presupuesto.nivel_de(input.codigo);
if (nv == 0)
{
    alert "Codigo invalido. Formato: CCSSSAAA o CCSSSAAA.SSSS";
    cancel submit;
}
input.nivel        = nv;
input.codigo_padre = thisapp.presupuesto.codigo_padre(input.codigo);

// el padre debe existir en el mismo presupuesto
if (input.codigo_padre != "")
{
    padre = LineaPresupuesto[presupuesto == input.presupuesto
                             && codigo == input.codigo_padre];
    if (padre.count() == 0)
    {
        alert "Falta la cuenta padre " + input.codigo_padre + " en este presupuesto.";
        cancel submit;
    }
}

// multiplicador en cero anula toda la rama: exigir confirmacion
if (nv < 10 && ifnull(input.cantidad, 1.0) == 0.0 && input.confirma_cero != true)
{
    alert "Cantidad 0 en un nivel de agrupacion anula toda la rama. "
        + "Marque 'Confirmo' si es intencional.";
    cancel submit;
}

// el presupuesto aprobado es inmutable
pto = Presupuesto[ID == input.presupuesto];
if (pto.estado == "APROBADO")
{
    alert "Presupuesto APROBADO. Genere una version nueva para editar.";
    cancel submit;
}
```

Aprobacion, en `Presupuesto` → `on validate`:

```javascript
if (input.estado == "APROBADO")
{
    abiertos = Hallazgo[presupuesto == input.ID
                        && severidad == "ERROR"
                        && estado == "ABIERTO"];
    if (abiertos.count() > 0)
    {
        alert "No se puede aprobar: " + abiertos.count()
            + " hallazgos ERROR abiertos.";
        cancel submit;
    }
}
```

---

## 6. Custom API para el widget

Tres endpoints. Se publican como **Custom API** de Creator o como funciones de
Catalyst con la API de Creator por detras.

### `GET /obra/{id}` — carga completa del arbol

Devuelve exactamente el JSON canonico de `assets/esquema_obra.json`. Una sola
llamada; el widget no vuelve a pedir nada para navegar.

### `POST /obra/{id}/guardar` — guardado en lote

```json
{
  "cambios": [
    { "op": "update", "codigo": "02001001.1002", "cantidad": 250 },
    { "op": "update", "codigo": "02001001", "cantidad": 5 },
    { "op": "insert", "codigo": "02001001.1008", "nivel": 10,
      "descripcion": "…", "unidad": "M3", "cantidad": 40,
      "insumos": [ { "codigo": "152001", "rendimiento": 0.5, "precio": 1540 } ] },
    { "op": "delete", "codigo": "02001001.1003" }
  ]
}
```

Respuesta: `{ "aplicados": 4, "rechazados": [], "total": 28399232614.23 }`.
El servidor recalcula y devuelve los totales; el widget no es la fuente de
verdad del numero final.

### `POST /obra/{id}/validar` — corre el validador

Devuelve la lista de hallazgos y los persiste en el formulario `Hallazgo`.

### `POST /obra/{id}/repreciar`

```json
{ "sucursal": "BOGOTA", "anio": 2027, "crear_version": true }
```

Devuelve el informe de impacto: insumos actualizados, sin precio, total
anterior, total nuevo, variacion %.

---

## 7. Contrato del widget

El widget es una app React empaquetada como widget de Creator, montada en una
**Page**. Usa el JS SDK de Creator para autenticacion y navegacion.

Responsabilidades:

| Del widget | Del servidor |
|---|---|
| Render del arbol colapsable | Fuente de verdad de los importes |
| Edicion inline de cantidad, multiplicador y rendimiento | Recalculo autoritativo |
| Calculo optimista en caliente (feedback inmediato) | Validacion |
| Buffer de cambios y guardado en lote | Persistencia |
| Navegacion por teclado y pegado desde Excel | Permisos |

Reglas de UX no negociables:
- **Flechas + Tab + Enter** para moverse. Sin mouse.
- **Pegar desde Excel** en un rango de celdas.
- El multiplicador N8 se muestra en columna aparte, rotulada
  **"Repeticiones"**, nunca como "Cantidad" — es la confusion mas cara posible.
- Indicador visible de cambios sin guardar y de origen del precio
  (CATALOGO / MANUAL / SUCURSAL_REFERENCIA / SIN_PRECIO).

---

## 8. Carga masiva inicial

Los CSV de `migrar.py` se cargan en este orden:

```
01_sucursales.csv     7
02_familias.csv      74
03_articulos.csv 20.784   ← depende de familias
04_cuentas.csv    1.829   ← cargar por nivel: 4, luego 5, 8, 10
05_precios.csv   14.843   ← depende de articulos y sucursales
```

Estrategia:

1. **Import de Creator (UI)** para los archivos pequenos (1, 2, 4).
2. **Bulk API** para articulos y precios: lotes de 200, con pausa que respete
   las 50 llamadas/minuto (~2,4 s entre lotes). 20.784 articulos ≈ 105 lotes
   ≈ 4–5 minutos. Precios ≈ 75 lotes.
3. Cargar `04_cuentas.csv` **por nivel ascendente**, o la validacion de padre
   existente rechazara las hijas.
4. Desactivar temporalmente los workflows `on validate` durante la carga y
   correr una validacion completa despues.

---

## 9. Que NO hacer en Deluge

| Antipatron | Por que | Alternativa |
|---|---|---|
| `zoho.creator.getRecords` dentro de un bucle | Consume 1 llamada API por iteracion; agota la cuota en segundos | Una lectura masiva a una Map en memoria |
| Recalcular en `on_validate` de cada linea | 400 recalculos por sesion de edicion | Boton explicito "Recalcular" |
| Guardar el arbol registro a registro desde el widget | Cientos de llamadas | Endpoint de guardado en lote |
| Formula fields para la cascada | Creator no resuelve dependencias jerarquicas arbitrarias | Calculo imperativo en Deluge o Python |
| Almacenar precios en formato largo (articulo × sucursal × anio) | ~60.000 registros y consultas de 3 campos | Formato ancho: ~15.000 registros, consulta de 2 campos |
| Confiar en `float` para importes | Errores de centavos que se acumulan sobre $28.000 millones | `Decimal` en Python; en Deluge, redondear solo al presentar |
