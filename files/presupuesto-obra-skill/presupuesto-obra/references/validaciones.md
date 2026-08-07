# Catalogo de validaciones

Implementadas en `presupuesto_core.validar()`. Salida ordenada por severidad.

## Severidades

| Nivel | Significado | Efecto |
|---|---|---|
| ERROR | El presupuesto esta mal: el numero no es confiable | Bloquea aprobacion. `pto.py validar` devuelve exit code 1 |
| AVISO | Sospechoso, puede ser intencional | Requiere revision explicita del presupuestador |
| INFO | Observacion de estructura | Solo informativo |

## Reglas

### ERROR

| Codigo | Regla | Como se corrige |
|---|---|---|
| `E01_DUPLICADO` | Codigo de cuenta repetido en la obra | Fusionar las lineas o recodificar. Si son dos tipologias distintas, usar dos N10 distintos, no repetir |
| `E02_NIVEL` | El nivel declarado no coincide con la forma del codigo | El codigo manda. Corregir el nivel o el codigo, nunca ambos a la vez |
| `E03_HUERFANO` | Falta la cuenta padre en la obra | Insertar la cuenta padre desde el maestro. La cascada de calculo la ignora y el total sale corto |
| `E04_APU_VACIO` | Subactividad N10 sin insumos | Cargar el APU o eliminar la linea. Un N10 sin insumos vale 0 y falsea el capitulo |
| `E05_PRECIO_CERO` | Insumo con precio 0 o nulo | Buscar precio en el catalogo de la sucursal; si no existe, capturar manual con justificacion o escalar |
| `E06_ART_INEXISTENTE` | El insumo no esta en el maestro de articulos | Crear el articulo en el maestro (proceso controlado) o sustituir por un codigo valido. No inventar codigos en la obra |
| `E07_CODIGO_MALFORMADO` | El codigo de insumo no cumple `[MO\|TC\|EQ ]NNNNN` | Caso real: `TC 2161 60847`. Alguien concateno dos claves. Decidir cual aplica y recodificar |

### AVISO

| Codigo | Regla | Interpretacion |
|---|---|---|
| `A01_FUERA_MAESTRO` | La cuenta no existe en el maestro de cuentas | Normalmente significa que el maestro esta desactualizado, no que la obra este mal. Levantar solicitud de alta de cuenta |
| `A02_CANT_CERO` | Cantidad o multiplicador en 0 | En N10 puede ser una linea reservada. En N4/N5/N8 **anula toda la rama**: revisar siempre |
| `A03_REND_CERO` | Rendimiento del insumo <= 0 | Insumo decorativo o error de digitacion |
| `A04_UM_DISTINTA` | La UM del insumo en obra difiere de la del maestro | Riesgo alto de error de magnitud (M3 vs M2 cambia el costo en ordenes). Verificar antes de aprobar |
| `A05_SIN_HIJOS` | Cuenta de agrupacion sin lineas hijas | Cuenta arrastrada de la plantilla y no usada. Podar |
| `A06_PRECIO_INCONSISTENTE` | El mismo insumo con precios distintos en distintos APU | Es el criterio de validez que usa la revision de obra publica. Unificar salvo justificacion documentada (p.ej. suministro con transporte distinto) |

### INFO

| Codigo | Regla |
|---|---|
| `I01_MULTIPLANTILLA` | La obra mezcla capitulos de edificacion y urbanismo. Legitimo en proyectos integrales, pero conviene separar presupuestos para comparar $/m2 |

## Resultado de referencia

Sobre `BAIKAL_TORRE_3_V01` con los maestros actuales:

```
 2 ERROR  E06_ART_INEXISTENTE + E07_CODIGO_MALFORMADO   TC 2161 60847
81 AVISO  A01_FUERA_MAESTRO      cuentas usadas que faltan en Nivel_10_Transformado
21 AVISO  A06_PRECIO_INCONSISTENTE
---
104 hallazgos, exit code 1
```

Ninguno es de calculo: el motor reproduce el total del Excel con $12 de
diferencia sobre $28.399 millones. Los hallazgos son de **gobierno del dato**,
que es exactamente el problema que la app web debe resolver.

## Validaciones pendientes de implementar

Candidatas para cuando existan los datos:

- `E07_CIRCULAR`: sub-APU que se referencia a si mismo (cuando se permitan APU anidados)
- `A07_OUTLIER_M2`: capitulo cuyo $/m2 se desvia > 2 sigma del historico de obras similares
- `A08_PRECIO_VENCIDO`: precio con anio anterior al anio base de la obra
- `A09_INSUMO_HUERFANO`: articulo del maestro sin precio en ninguna sucursal
- `A10_FAMILIA_INCOHERENTE`: insumo tipo MAT dentro de un APU marcado T.C con incidencia > 50%
