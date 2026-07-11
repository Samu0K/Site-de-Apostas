const API_BASE_URL = 'http://localhost:3333/api';

const steps = {
  upload: document.getElementById('step-upload'),
  loading: document.getElementById('step-loading'),
  success: document.getElementById('step-success'),
  error: document.getElementById('step-error'),
};

const receiptInput = document.getElementById('receipt-input');
const uploadArea = document.getElementById('upload-area');
const uploadLabel = document.getElementById('upload-label');
const preview = document.getElementById('preview');
const submitBtn = document.getElementById('submit-btn');
const retryBtn = document.getElementById('retry-btn');
const successDetails = document.getElementById('success-details');
const errorMessage = document.getElementById('error-message');
const whatsappBtn = document.getElementById('whatsapp-btn');

let selectedFile = null;

// --- Tracking (GA4 / Meta Pixel) --------------------------------
// Substitua pelos snippets reais de gtag/fbq no <head> do index.html.
// Aqui so disparamos os eventos combinados no briefing.
function trackEvent(eventName, params = {}) {
  if (typeof gtag === 'function') gtag('event', eventName, params);
  if (typeof fbq === 'function') fbq('track', eventName, params);
  console.log('[track]', eventName, params);
}

trackEvent('PageView');

// --- Upload handling ---------------------------------------------
uploadArea.addEventListener('click', () => receiptInput.click());

receiptInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  selectedFile = file;

  const reader = new FileReader();
  reader.onload = (ev) => {
    preview.src = ev.target.result;
    preview.hidden = false;
    uploadLabel.textContent = file.name;
  };
  reader.readAsDataURL(file);

  submitBtn.disabled = false;
});

function showStep(stepName) {
  Object.values(steps).forEach((el) => { el.hidden = true; });
  steps[stepName].hidden = false;
}

submitBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  trackEvent('InitiateCheckout');
  showStep('loading');

  const formData = new FormData();
  formData.append('receipt', selectedFile);

  try {
    const res = await fetch(`${API_BASE_URL}/validate-payment`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();

    if (data.success && data.valid) {
      trackEvent('Purchase', {
        value: data.details.amountDetected,
        currency: 'BRL',
      });
      successDetails.textContent = data.details.bankDetected
        ? `Comprovante do ${data.details.bankDetected} confirmado.`
        : 'Comprovante confirmado.';
      whatsappBtn.href = data.accessLink || '#';
      showStep('success');
    } else {
      errorMessage.textContent = data.reason || data.error || 'Não conseguimos validar seu comprovante.';
      showStep('error');
    }
  } catch (err) {
    console.error('Erro ao validar pagamento:', err);
    errorMessage.textContent = 'Erro de conexão com o servidor. Tente novamente.';
    showStep('error');
  }
});

retryBtn.addEventListener('click', () => {
  selectedFile = null;
  receiptInput.value = '';
  preview.hidden = true;
  uploadLabel.textContent = 'Clique ou arraste o print do comprovante aqui';
  submitBtn.disabled = true;
  showStep('upload');
});
