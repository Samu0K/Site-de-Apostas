const rateLimit = require('express-rate-limit');

// Limita tentativas de validacao por IP para evitar abuso
// (ex: forcar varios uploads pra tentar "acertar" a validacao).
const validationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
  },
});

module.exports = { validationLimiter };
