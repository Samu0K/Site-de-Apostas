require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const validateRoutes = require('./routes/validate');

const app = express();
const PORT = process.env.PORT || 3333;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', validateRoutes);

// Handler de erro do multer (ex: arquivo grande demais ou tipo invalido)
app.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
