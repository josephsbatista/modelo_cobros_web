// Prueba de paridad: el mismo web/motor.js que usa la página debe dar el mismo puntaje que
// scikit-learn sobre las filas de pruebas/paridad.json (sintéticas, no son afiliados).
// Uso: node pruebas/prueba_paridad.js     (sale con código 1 si alguna fila no coincide)
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const Motor = require('../web/motor.js');

const raiz = path.join(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(raiz, 'web/modelo.json'), 'utf8'));
const comprimido = fs.readFileSync(path.join(raiz, 'web/modelo.bin.gz'));
const crudo = zlib.gunzipSync(comprimido);
// Copia a un ArrayBuffer propio: los Float32Array/Int32Array necesitan alineación
const binario = crudo.buffer.slice(crudo.byteOffset, crudo.byteOffset + crudo.byteLength);
const motor = Motor.crearMotor(binario, cfg);
const { filas, esperado } = JSON.parse(fs.readFileSync(path.join(__dirname, 'paridad.json'), 'utf8'));

const TOLERANCIA = 1e-6;
let maxDif = 0;
let fallas = 0;
let decisionesDistintas = 0;
filas.forEach((fila, i) => {
  const p = motor.puntuar(fila);
  const dif = Math.abs(p - esperado[i]);
  maxDif = Math.max(maxDif, dif);
  if (dif > TOLERANCIA) fallas++;
  if ((p >= cfg.umbral) !== (esperado[i] >= cfg.umbral)) decisionesDistintas++;
});

console.log(`Filas: ${filas.length} | diferencia máxima: ${maxDif.toExponential(2)} | ` +
            `fuera de tolerancia (${TOLERANCIA}): ${fallas} | decisiones distintas: ${decisionesDistintas}`);
const notificadas = esperado.filter((p) => p >= cfg.umbral).length;
console.log(`Variedad de la prueba: ${notificadas} filas sobre el umbral y ${filas.length - notificadas} debajo`);
if (fallas > 0 || decisionesDistintas > 0) {
  console.error('PARIDAD FALLIDA: la página no reproduce el modelo de scikit-learn.');
  process.exit(1);
}
console.log('PARIDAD OK: la página reproduce el modelo de scikit-learn.');
