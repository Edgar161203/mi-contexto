#!/usr/bin/env node
// Uso: node buscar_precio.js "<pieza>" [tasa_bs_por_dolar]
// Busca una pieza en data/precios-ejemplo.csv y devuelve el resultado en JSON.
// No inventa precio ni tasa: si no hay match, o no se pasa tasa, lo deja explícito en el output.

const fs = require("fs");
const path = require("path");

function normalizar(texto) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function parseCSV(contenido) {
  const [encabezado, ...filas] = contenido.trim().split(/\r?\n/);
  const columnas = encabezado.split(",");
  return filas.map((fila) => {
    const valores = fila.split(",");
    const registro = {};
    columnas.forEach((col, i) => (registro[col] = valores[i]));
    return registro;
  });
}

function main() {
  const [, , piezaBuscada, tasaArg] = process.argv;

  if (!piezaBuscada) {
    console.log(
      JSON.stringify({
        error: "Falta el nombre de la pieza. Uso: buscar_precio.js \"<pieza>\" [tasa_bs_por_dolar]",
      })
    );
    process.exit(1);
  }

  const csvPath = path.join(__dirname, "..", "data", "precios-ejemplo.csv");
  const contenido = fs.readFileSync(csvPath, "utf-8");
  const precios = parseCSV(contenido);

  const consultaNorm = normalizar(piezaBuscada);
  const match = precios.find((p) => {
    const piezaNorm = normalizar(p.pieza);
    return piezaNorm.includes(consultaNorm) || consultaNorm.includes(piezaNorm);
  });

  if (!match) {
    console.log(
      JSON.stringify({
        encontrado: false,
        mensaje: "Pieza no está en la lista de precios. Confirmar con el negocio, no inventar precio.",
        piezas_disponibles: precios.map((p) => p.pieza),
      })
    );
    return;
  }

  const resultado = {
    encontrado: true,
    pieza: match.pieza,
    precio_usd: Number(match.precio_usd),
    disponibilidad: match.disponible,
  };

  const tasa = tasaArg ? Number(tasaArg) : null;
  if (tasa && !Number.isNaN(tasa)) {
    resultado.tasa_bs_por_dolar = tasa;
    resultado.precio_bs = Math.round(Number(match.precio_usd) * tasa);
  } else {
    resultado.precio_bs = null;
    resultado.nota = "No se pasó tasa de cambio: preguntarle a Edgar la tasa del día antes de convertir a Bs.";
  }

  console.log(JSON.stringify(resultado));
}

main();
