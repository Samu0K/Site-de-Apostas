// Lista simples de bancos comuns em comprovantes Pix brasileiros.
// Facil de estender conforme aparecerem novos casos reais.
const KNOWN_BANKS = [
  'nubank', 'itau', 'itaú', 'bradesco', 'banco do brasil', 'caixa',
  'santander', 'inter', 'c6 bank', 'picpay', 'mercado pago', 'sicoob',
  'sicredi', 'next', 'original', 'will bank', 'neon',
];

// Regex para valores em formato R$ 1.234,56 ou R$ 123,45
const AMOUNT_REGEX = /r\$\s*([\d.]{1,10},\d{2})/i;

function parseAmount(text) {
  const match = text.match(AMOUNT_REGEX);
  if (!match) return null;
  const normalized = match[1].replace(/\./g, '').replace(',', '.');
  const value = parseFloat(normalized);
  return Number.isNaN(value) ? null : value;
}

function parseBank(text) {
  const lowerText = text.toLowerCase();
  return KNOWN_BANKS.find((bank) => lowerText.includes(bank)) || null;
}

/**
 * Analisa o texto extraido do OCR e retorna os dados estruturados
 * do comprovante junto com um score de confianca da extracao.
 *
 * @param {string} rawText - texto bruto retornado pelo OCR
 * @param {number} ocrConfidence - confianca do proprio OCR (0-1)
 */
function parsePixReceipt(rawText, ocrConfidence) {
  const amount = parseAmount(rawText);
  const bank = parseBank(rawText);
  const hasPixKeyword = /pix/i.test(rawText);

  // Confianca combinada: pondera o quanto reconhecemos do documento
  // (valor + banco + palavra "pix") com a confianca bruta do OCR.
  let fieldsFound = 0;
  if (amount !== null) fieldsFound += 1;
  if (bank !== null) fieldsFound += 1;
  if (hasPixKeyword) fieldsFound += 1;

  const fieldScore = fieldsFound / 3;
  const combinedConfidence = (fieldScore * 0.6) + (ocrConfidence * 0.4);

  return {
    amount,
    bank,
    hasPixKeyword,
    ocrConfidence,
    confidence: Number(combinedConfidence.toFixed(2)),
  };
}

module.exports = { parsePixReceipt };
