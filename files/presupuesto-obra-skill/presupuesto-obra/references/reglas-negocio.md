# Reglas de negocio

## 1. Plantillas de presupuesto

Se derivan del rango del capitulo (primeros 2 digitos del codigo):

| Plantilla | Capitulos | Contenido tipico |
|---|---|---|
| Edificacion | 01–21 | Preliminares, cimentacion, estructura, mamposteria, acabados, instalaciones, gastos de personal |
| Urbanismo interno | 22–28 | Obras dentro del lindero del proyecto: vias internas, zonas comunes, paisajismo |
| Urbanismo externo | 29–39 | Obras de cesion y conexion a redes publicas |

Capitulos 40, 50, 60, 70, 80 y 90 existen en el maestro de cuentas y quedan
fuera de las tres plantillas. Definir con el usuario si son plantillas
adicionales (dotacion, comercializacion, indirectos) o cuentas de uso puntual.

El rango 29 aparece en ambas definiciones del requerimiento original
(interno hasta 29, externo desde 29). Aqui se resuelve como
**interno 22–28, externo 29–39**. Confirmar con el area de costos.

Crear un presupuesto desde una plantilla = clonar la rama de cuentas del rango
correspondiente, con cantidades en 0 y sin APU. El usuario luego poda lo que no
usa. Alternativa recomendada: **plantilla ligera** (solo N4 y N5, y que el
usuario invoque los N8/N10 por buscador), que es como trabaja Presto y evita
arrastrar 1.300 lineas muertas.

## 2. El multiplicador del nivel 8

Es la caracteristica distintiva del modelo Marval y no existe igual en Opus ni
en Presto (donde el equivalente se resuelve con lineas de medicion
`n x largo x ancho x alto`).

```
N8  06003001  PLACA TIPO           cantidad = 20     <- 20 pisos iguales
 N10 06003001.1001 CONCRETO PLACA  cantidad = 320 m2
 N10 06003001.1002 ACERO PLACA     cantidad = 4.100 kg
```
Importe = 20 x (320 x VU1 + 4.100 x VU2)

Reglas:
- Por defecto **1**. Un 0 anula toda la rama en silencio: la validacion lo
  marca como AVISO.
- Se acumula en cascada: la explosion de insumos multiplica el rendimiento por
  la cantidad del N10 y por las cantidades de **todos** sus ancestros.
- En la UI debe verse como campo distinto ("repeticiones" / "factor"), no como
  "cantidad", o los presupuestadores lo confunden.

## 3. Tipos de recurso

| Tipo | Prefijo en el codigo | Catalogo | Naturaleza |
|---|---|---|---|
| MAT | sin prefijo (numerico) | PRECIOS MATERIALES | Material puesto en obra |
| MO | `MO ` | LISTAS DE PRECIOS MARVAL | Mano de obra por contrato |
| EQ | `EQ ` | LISTAS DE PRECIOS MARVAL | Equipo |
| TC | `TC ` | LISTAS DE PRECIOS MARVAL | Todo costo (suministro + instalacion) |

El campo `TIPO` del N10 (`M.O`, `T.C`, `MAT`, `EQ`) clasifica el APU completo
por su componente dominante, no por su unico contenido: un APU tipo `M.O` puede
llevar materiales. Sirve para reportes de composicion del costo, no para
calcular.

Distribucion en BAIKAL TORRE 3: 91 APU tipo M.O, 68 T.C, 6 MAT, 3 EQ. La
compania trabaja mayoritariamente por contrato, no por administracion directa.

## 4. Precios: sucursal, anio y proyeccion

Un precio queda determinado por la terna **(articulo, sucursal, anio)**.

- Sucursales en los datos: Bucaramanga, Bogota, Barranquilla, Cartagena, Cali,
  Zipaquira, Ricaurte.
- Anios: 4 columnas por sucursal. En contratos, 2025–2028 con **8% anual**
  compuesto. En materiales, el anio inicial varia por sucursal.
- La hoja `%PROYECCIONES` define ajustes diferenciados por familia.

Reglas de uso:
1. Una obra usa **una sola** sucursal y **un solo** anio base. Mezclar invalida
   la comparabilidad.
2. Repreciar es una operacion explicita que genera **una version nueva**, nunca
   una edicion en sitio. El presupuesto aprobado es un documento congelado.
3. Un insumo sin precio en la sucursal elegida no vale 0. Opciones, en orden:
   (a) usar el precio de la sucursal de referencia con marca visible,
   (b) capturar precio manual con justificacion, (c) dejarlo pendiente y
   bloquear la aprobacion. Nunca (d) asumir 0.
4. Para obras plurianuales, la escalatoria se aplica por periodo segun el
   cronograma, usando la explosion de insumos como base — es exactamente lo
   que hacen Opus (escalatoria por explosion) y Presto.

## 5. Versionado

El nombre de archivo actual (`BAIKAL_TORRE_3_V01`) codifica la version. En la
app debe ser un campo, con estados:

```
BORRADOR -> EN REVISION -> APROBADO -> [SUPERSEDIDO]
```

Una version APROBADA es inmutable. Cualquier cambio crea V02 con trazabilidad
de que cambio (usar `pto.py comparar`). Los reportes al comite siempre citan
version, sucursal y anio de precios.

## 6. Indicadores obligatorios

| Indicador | Formula |
|---|---|
| Valor por inmueble | TOTAL / n_inmuebles |
| Valor por m2 | TOTAL / (n_inmuebles x area_promedio) |
| Incidencia de capitulo | VT(N4) / TOTAL |
| Incidencia de insumo | importe_explosion / TOTAL |
| Concentracion (Pareto) | % de insumos que acumulan el 80% del costo |

Referencia medida en BAIKAL TORRE 3: 66 de 446 insumos (14,8%) concentran el
80% del costo. Ese subconjunto es el que merece negociacion y seguimiento de
precio; el resto se puede indexar.

## 7. Lo que este modelo NO tiene todavia (y Opus/Presto si)

Levantar con el usuario antes de disenar la app:

- **AIU / indirectos, financiacion y utilidad.** Los totales observados son
  costo directo. Opus los aplica en cascada como "pie de precios unitarios".
- **Rendimientos y cuadrillas.** Aqui el rendimiento viene incorporado en el
  precio del contrato de MO; no hay jornada-hombre ni FSR.
- **Programacion de obra.** No hay fechas ni duraciones, luego no hay curva S
  ni programa de suministros.
- **Mediciones / numeros generadores.** Las cantidades entran digitadas, sin
  desglose `n x largo x ancho x alto` auditable.
- **Certificacion y control de avance.** Nada compara presupuesto vs ejecutado.
