const express = require('express');
const { upload, attachTraceId } = require('../middleware/upload');
const { validationLimiter } = require('../middleware/rateLimiter');
const { extractTextFromImage } = require('../services/ocrService');
const { parsePixReceipt } = require('../services/pixParser');

const router = express.Router();

const MIN_OCR_CONFIDENCE = parseFloat(process.env.MIN_OCR_CONFIDENCE || '0.55');
const EXPECTED_MIN_AMOUNT = parseFloat(process.env.EXPECTED_MIN_AMOUNT || '0');
const WHATSAPP_GROUP_LINK = process.env.WHATSAPP_GROUP_LINK || '';

router.post(
  '/validate-payment',
  validationLimiter,
  attachTraceId,
  upload.single('receipt'),
  async (req, res) => {
    const { traceId } = req;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        traceId,
        error: 'Nenhum arquivo enviado. Envie uma imagem do comprovante.',
      });
    }

    try {
      const { text, confidence: ocrConfidence } = await extractTextFromImage(req.file.buffer);
      const parsed = parsePixReceipt(text, ocrConfidence);

      const meetsConfidence = parsed.confidence >= MIN_OCR_CONFIDENCE;
      const meetsAmount = EXPECTED_MIN_AMOUNT === 0
        || (parsed.amount !== null && parsed.amount >= EXPECTED_MIN_AMOUNT);

      const isValid = meetsConfidence && meetsAmount && parsed.hasPixKeyword;

      // Nunca retorna o texto bruto do OCR pro cliente - apenas o resultado
      // estruturado, evitando vazar dados sensiveis do comprovante.
      const response = {
        success: true,
        traceId,
        valid: isValid,
        details: {
          bankDetected: parsed.bank,
          amountDetected: parsed.amount,
          confidence: parsed.confidence,
        },
      };

      if (isValid) {
        response.accessLink = WHATSAPP_GROUP_LINK;
      } else {
        response.reason = !parsed.hasPixKeyword
          ? 'Nao identificamos um comprovante Pix valido na imagem.'
          : 'Nao foi possivel confirmar os dados do comprovante com confianca suficiente.';
      }

      return res.json(response);
    } catch (err) {
      console.error(`[${traceId}] Erro ao processar comprovante:`, err.message);
      return res.status(500).json({
        success: false,
        traceId,
        error: 'Erro ao processar o comprovante. Tente novamente.',
      });
    }
  },
);

module.exports = router;
