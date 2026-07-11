const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Armazena em memoria (buffer) - nao grava o comprovante em disco por padrao,
// reduzindo exposicao de dados sensiveis. So persiste se PERSIST_UPLOADS=true.
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Tipo de arquivo nao permitido. Envie PNG, JPG ou WEBP.'));
  }
  cb(null, true);
}

const maxSize = parseInt(process.env.MAX_UPLOAD_SIZE, 10) || 5 * 1024 * 1024;

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSize, files: 1 },
});

// Gera um id de rastreio para cada tentativa de validacao, sem expor
// nome original do arquivo do usuario nos logs.
function attachTraceId(req, res, next) {
  req.traceId = uuidv4();
  next();
}

module.exports = { upload, attachTraceId };
