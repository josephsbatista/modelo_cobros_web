// Motor del bosque aleatorio: replica en JavaScript el Pipeline de scikit-learn.
//
// 1. Preparación (igual que el ColumnTransformer del notebook 2):
//    - numéricas: faltante -> mediana del entrenamiento, más un indicador de faltante para las
//      columnas que tuvieron faltantes al entrenar; luego (x - media) / escala, indicadores incluidos.
//    - categóricas: faltante -> valor más frecuente; one-hot de las categorías frecuentes y una
//      columna «poco frecuente» que recoge las raras y las desconocidas.
// 2. Bosque: cada árbol compara float32(x) <= umbral (como scikit-learn) y devuelve la proporción
//    de clase 1 de la hoja; el puntaje es el promedio de los 300 árboles.
//
// Sirve igual en el navegador (window.Motor) y en Node (require), para la prueba de paridad.
(function (raiz) {
  'use strict';

  function faltante(v) {
    return v === null || v === undefined || Number.isNaN(v);
  }

  function crearMotor(binario, cfg) {
    const N = cfg.n_nodos;
    const umbral = new Float32Array(binario, 0, N);       // umbral, o probabilidad en la hoja
    const derecho = new Int32Array(binario, 4 * N, N);    // el izquierdo es siempre nodo + 1
    const columna = new Int16Array(binario, 8 * N, N);    // -1 = hoja
    const nNum = cfg.numericas.length;

    function preparar(fila) {
      const x = new Float64Array(cfg.n_columnas);
      const falta = new Array(nNum);
      for (let i = 0; i < nNum; i++) {
        let v = fila[cfg.numericas[i]];
        falta[i] = faltante(v);
        if (falta[i]) v = cfg.medianas[i];
        x[i] = (v - cfg.media[i]) / cfg.escala[i];
      }
      let k = nNum;
      for (const i of cfg.indicadores) {
        x[k] = ((falta[i] ? 1 : 0) - cfg.media[k]) / cfg.escala[k];
        k++;
      }
      for (const c of cfg.categoricas) {
        let v = fila[c.columna];
        if (faltante(v)) v = c.mas_frecuente;
        const pos = c.frecuentes.indexOf(Number(v));
        if (pos >= 0) x[k + pos] = 1;
        k += c.frecuentes.length;
        if (c.tiene_poco_frecuente) {
          x[k] = pos >= 0 ? 0 : 1;
          k++;
        }
      }
      return x;
    }

    function puntuar(fila) {
      const x = Float32Array.from(preparar(fila));   // scikit-learn compara en float32
      let suma = 0;
      for (let a = 0; a < cfg.n_arboles; a++) {
        const base = cfg.inicios[a];
        let n = 0;
        while (columna[base + n] !== -1) {
          n = x[columna[base + n]] <= umbral[base + n] ? n + 1 : derecho[base + n];
        }
        suma += umbral[base + n];
      }
      return suma / cfg.n_arboles;
    }

    return { preparar, puntuar };
  }

  const Motor = { crearMotor };
  if (typeof module !== 'undefined' && module.exports) module.exports = Motor;
  else raiz.Motor = Motor;
})(typeof window !== 'undefined' ? window : globalThis);
