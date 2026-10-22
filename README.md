# Predicción de no pago de cuota · Bodytech (página web)

Demo del modelo del proyecto final de **Machine Learning I**, Universidad EAN: un **bosque aleatorio de
300 árboles** que ordena las cuotas por riesgo de no pago, 3 días antes del corte, para que cobranza
notifique al 20 % de mayor riesgo.

- **Página:** https://josephsbatista.github.io/modelo_cobros_web/ (GitHub Pages; se publica sola con cada cambio en `main`).
- El modelo **corre en el navegador**: no hay servidor y no se envía ningún dato.

## Cómo funciona

```
notebook 2 (bosque elegido) ──► exportar_web.py ──► web/modelo.bin.gz + web/modelo.json ──► GitHub Actions ──► GitHub Pages
                                                    (árboles en binario)   (preparación)     prueba de paridad
```

1. Los 300 árboles se exportan como números a `web/modelo.bin.gz` (11,8 MB comprimido). La preparación
   de datos del `Pipeline` (medianas, indicadores de faltante, escalado y one-hot) va en `web/modelo.json`.
2. `web/motor.js` replica esa preparación y recorre los árboles: cada uno devuelve la proporción de
   impagos de su hoja y el puntaje es el promedio.
3. **Prueba de paridad:** `pruebas/prueba_paridad.js` carga el mismo `web/motor.js` que usa la página y
   verifica, sobre 3.000 filas, que JavaScript y scikit-learn den el mismo puntaje (tolerancia 1e-6) y
   la misma decisión. Si falla, GitHub Actions no publica.

## Datos y confidencialidad

Este repositorio **no contiene registros de afiliados**:

- Las filas de `pruebas/paridad.json` son **sintéticas**: se generan alrededor de los perfiles con ruido,
  faltantes y categorías desconocidas.
- Los perfiles de la demo son **medianas de grupos** de decenas de miles de cuotas.
- La distribución de puntajes se dibuja desde **cuantiles** de validación.

Los notebooks y los datos viven en un repositorio privado aparte.

## Estructura

```
web/
  index.html        la página
  motor.js          preparación de datos + recorrido de los árboles
  modelo.bin.gz     los 300 árboles (binario comprimido)
  modelo.json       preparación, umbral del cupo, perfiles y cuantiles
  figuras/          figuras del notebook de modelado
pruebas/
  prueba_paridad.js prueba JavaScript vs scikit-learn
  paridad.json      filas sintéticas con el puntaje de scikit-learn
.github/workflows/
  pages.yml         paridad y, si pasa, publicación en GitHub Pages
```

**Uso responsable.** El puntaje ordena cuotas para priorizar avisos preventivos; no es una probabilidad
calibrada ni debe usarse para sancionar ni excluir a un afiliado.
