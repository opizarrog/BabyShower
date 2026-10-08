const targetDate = new Date('2026-12-31T00:00:00');
const countdownEl = document.getElementById('countdown');
const daysEl = document.getElementById('days');
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const discoverBtn = document.getElementById('discoverBtn');
const toastEl = document.getElementById('toast');
const rsvpForm = document.getElementById('rsvpForm');
const attendanceInputs = document.querySelectorAll('input[name="attendance"]');
const companionWrap = document.getElementById('companionWrap');
const companionNameWrap = document.getElementById('companionNameWrap');
const companionInputs = document.querySelectorAll('input[name="withCompanion"]');
const ultrasoundImage = document.getElementById('ultrasoundImage');
const ultrasoundPlaceholder = document.getElementById('ultrasoundPlaceholder');

const GOOGLE_SHEETS_WEBHOOK_URL = window.GOOGLE_SHEETS_WEBHOOK_URL || '';

function padNumber(value) {
  return String(value).padStart(2, '0');
}

function updateCountdown() {
  const now = new Date();
  const remaining = targetDate - now;

  if (remaining <= 0) {
    countdownEl.innerHTML = `
      <div class="time-box" style="grid-column: 1 / -1;">
        <span class="time-value">¡Ya llegó Samuel!</span>
        <span class="time-label">Estamos muy emocionados</span>
      </div>
    `;
    return;
  }

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((remaining / (1000 * 60)) % 60);
  const seconds = Math.floor((remaining / 1000) % 60);

  daysEl.textContent = padNumber(days);
  hoursEl.textContent = padNumber(hours);
  minutesEl.textContent = padNumber(minutes);
  secondsEl.textContent = padNumber(seconds);
}

setInterval(updateCountdown, 1000);
updateCountdown();

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2600);
}

function revealOnScroll() {
  const elements = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  elements.forEach((element) => observer.observe(element));
}

revealOnScroll();

function showUltrasoundImage() {
  if (ultrasoundImage.complete && ultrasoundImage.naturalWidth > 0) {
    ultrasoundImage.classList.remove('hidden');
    ultrasoundPlaceholder.classList.add('hidden');
  }
}

ultrasoundImage.addEventListener('load', showUltrasoundImage);
showUltrasoundImage();

function showFamilyPhoto(image) {
  if (image.complete && image.naturalWidth > 0) {
    image.classList.remove('hidden');
    image.nextElementSibling.classList.add('hidden');
  }
}

const familyPhotoImages = document.querySelectorAll('.family-photo-image');
familyPhotoImages.forEach((image) => {
  image.addEventListener('load', () => showFamilyPhoto(image));
  showFamilyPhoto(image);
});

if (discoverBtn) {
  discoverBtn.addEventListener('click', () => {
    document.getElementById('countdown-heading').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

const parallaxItems = document.querySelectorAll('.moon, .cloud, .floating-card');
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  parallaxItems.forEach((item, index) => {
    const baseTransform = item.dataset.baseTransform || 'none';
    const speed = (index + 1) * 0.08;
    const translateY = scrollY * speed * 0.18;
    const transformValue = baseTransform === 'none'
      ? `translate3d(0, ${translateY}px, 0)`
      : `${baseTransform} translate3d(0, ${translateY}px, 0)`;
    item.style.transform = transformValue;
  });
}, { passive: true });

function toggleCompanionFields() {
  const selected = document.querySelector('input[name="attendance"]:checked');
  const shouldShow = selected && selected.value === 'yes';
  companionWrap.classList.toggle('hidden', !shouldShow);

  if (!shouldShow) {
    companionNameWrap.classList.add('hidden');
    const companionNameInput = document.getElementById('companionName');
    if (companionNameInput) companionNameInput.value = '';
    document.querySelectorAll('input[name="withCompanion"]').forEach((radio) => {
      radio.checked = false;
    });
  }
}

attendanceInputs.forEach((input) => {
  input.addEventListener('change', toggleCompanionFields);
});

function toggleCompanionNameField() {
  const selectedCompanion = document.querySelector('input[name="withCompanion"]:checked');
  const shouldShow = selectedCompanion && selectedCompanion.value === 'yes';
  companionNameWrap.classList.toggle('hidden', !shouldShow);
}

companionInputs.forEach((input) => {
  input.addEventListener('change', toggleCompanionNameField);
});

function validateForm(formData) {
  if (!formData.guestName.trim()) {
    return 'Por favor, escribe tu nombre.';
  }

  if (!formData.attendance) {
    return 'Selecciona si podrás asistir o no.';
  }

  if (formData.attendance === 'yes' && formData.withCompanion === 'yes' && !formData.companionName.trim()) {
    return 'Indica el nombre del acompañante.';
  }

  return '';
}

async function submitGuestResponse(payload) {
  if (!GOOGLE_SHEETS_WEBHOOK_URL) {
    const saved = JSON.parse(localStorage.getItem('baby-shower-rsvps') || '[]');
    saved.push(payload);
    localStorage.setItem('baby-shower-rsvps', JSON.stringify(saved));
    return { ok: true, localOnly: true };
  }

  const body = new URLSearchParams(payload);
  await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
    method: 'POST',
    mode: 'no-cors',
    body
  });

  return { ok: true, localOnly: false };
}

rsvpForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = {
    guestName: document.getElementById('guestName').value.trim(),
    attendance: document.querySelector('input[name="attendance"]:checked')?.value || '',
    withCompanion: document.querySelector('input[name="withCompanion"]:checked')?.value || '',
    companionName: document.getElementById('companionName').value.trim(),
    timestamp: new Date().toISOString()
  };

  const validationMessage = validateForm(formData);
  if (validationMessage) {
    showToast(validationMessage);
    return;
  }

  const submitButton = rsvpForm.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = 'Enviando...';

  try {
    const result = await submitGuestResponse(formData);
    const message = result.localOnly
      ? '¡Gracias! Tu respuesta quedó guardada en este dispositivo y está lista para conectarse a Google Sheets.'
      : '¡Gracias! Tu confirmación fue registrada.';

    showToast(message);
    rsvpForm.reset();
    toggleCompanionFields();
    companionNameWrap.classList.add('hidden');
  } catch (error) {
    console.error(error);
    showToast('Hubo un problema al confirmar tu asistencia. Inténtalo de nuevo.');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
});

if (localStorage.getItem('baby-shower-rsvps')) {
  const savedLength = JSON.parse(localStorage.getItem('baby-shower-rsvps') || '[]').length;
  if (savedLength > 0) {
    console.info(`${savedLength} respuestas locales guardadas para sincronizar.`);
  }
}
