const { createWorker } = require('tesseract.js');

/**
 * Extrai texto de uma imagem (buffer) usando Tesseract.js.
 * Roda 100% local, sem enviar a imagem pra nenhuma API externa.
 *
 * @param {Buffer} imageBuffer
 * @returns {Promise<{ text: string, confidence: number }>}
 */
async function extractTextFromImage(imageBuffer) {
  const worker = await createWorker('por'); // idioma portugues

  try {
    const { data } = await worker.recognize(imageBuffer);
    return {
      text: data.text || '',
      confidence: (data.confidence || 0) / 100, // normaliza pra 0-1
    };
  } finally {
    await worker.terminate();
  }
}

module.exports = { extractTextFromImage };
