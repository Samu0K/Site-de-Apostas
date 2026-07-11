# Grupo VIP de Dicas — Acesso via Validação de Pix

Landing page que recebe um comprovante Pix, valida seu conteúdo com OCR (Tesseract.js)
e libera o acesso ao grupo de WhatsApp apenas quando o comprovante é reconhecido
com confiança suficiente.

## Stack

- **Frontend:** HTML + CSS + JavaScript puro (sem framework, sem build step)
- **Backend:** Node.js + Express
- **OCR:** Tesseract.js (roda 100% local, sem enviar a imagem para APIs externas)
- **Segurança:** Helmet, CORS restrito, rate limiting, validação de tipo/tamanho de arquivo

## Como rodar

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm start
```

Servidor sobe em `http://localhost:3333`.

### Frontend

Abra `frontend/index.html` com uma extensão de live server (ex: Live Server do VS Code),
ou sirva a pasta com qualquer servidor estático:

```bash
cd frontend
npx serve .
```

Ajuste `API_BASE_URL` em `app.js` e `FRONTEND_ORIGIN` no `.env` do backend caso a porta mude.

## Arquitetura e decisões técnicas

**Upload em memória, não em disco.** O comprovante fica só em buffer durante o
processamento (`multer.memoryStorage()`) e não é persistido por padrão. Isso
reduz a superfície de exposição de um dado sensível (comprovante bancário).

**Texto bruto do OCR nunca volta pro cliente.** A API retorna apenas o resultado
estruturado (banco detectado, valor detectado, confiança), nunca o texto cru
extraído da imagem.

**Validação combinada de confiança.** `pixParser.js` cruza três sinais: presença
da palavra "pix", banco reconhecido e valor no formato esperado — combinados
com a confiança nativa do OCR — pra chegar a um score final. Isso evita que um
único falso positivo (ex: OCR "leu" a palavra pix em ruído de imagem) libere
acesso sozinho.

**Rate limiting no endpoint de validação.** Evita tentativas repetidas de
manipular o resultado por força bruta (10 tentativas / 15 min por IP).

**Trace ID por requisição.** Cada tentativa de validação recebe um ID de
rastreio nos logs, sem depender do nome original do arquivo do usuário — facilita
debug sem expor dado desnecessário em log.

## Limitações conhecidas

- OCR local tem acurácia menor que soluções pagas (Google Vision, AWS Textract)
  em comprovantes com fontes pequenas ou baixa qualidade de imagem. Em produção,
  vale considerar fallback para uma API paga em casos de baixa confiança.
- A lista de bancos em `pixParser.js` é estática; em produção, valeria validar
  contra a lista oficial de instituições do Banco Central (SPI).
- Não há integração real com gateway de pagamento — a validação é baseada em
  leitura de imagem, não em confirmação via API bancária. Isso é uma limitação
  de design do próprio teste (Opção A), não uma escolha técnica minha.

## Por que a Opção A e não a Opção B

Escolhi a Opção A (Pix + OCR) em vez da B (VSL + Quiz + Lead) porque:

1. **Mais superfície de engenharia real.** A opção A exige lidar com upload de
   arquivo, processamento de imagem, extração de texto e uma camada de decisão
   (validar ou não) — isso testa fullstack de ponta a ponta, incluindo tratamento
   de dado sensível. A opção B é majoritariamente formulário + geração de texto
   por IA, com menos complexidade de backend.
2. **Segurança como parte central do problema**, não um extra: decidir o que
   persistir, o que logar, o que devolver ao cliente e como limitar abuso são
   decisões de arquitetura, não só de UI.
3. **Menor dependência de serviços de terceiros pagos** para demonstrar o
   conceito: Tesseract.js roda local, então o projeto é 100% reproduzível sem
   nenhuma chave de API externa.

## Eventos de tracking implementados

| Evento | Momento |
|---|---|
| `PageView` | Ao carregar a página |
| `InitiateCheckout` | Ao clicar em "Validar pagamento" |
| `Purchase` | Quando o backend confirma o comprovante como válido |

*(Snippets reais de GA4/Meta Pixel devem ser inseridos no `<head>` do `index.html`;
por ora, `trackEvent()` em `app.js` centraliza os disparos para facilitar essa troca.)*
