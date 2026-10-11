// Fecha posible del parto.
const targetDate = new Date(2026, 11, 31, 14, 0, 0);
const countdownEl = document.getElementById('countdown');
const daysEl = document.getElementById('days');
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const discoverBtn = document.getElementById('discoverBtn');
const toastEl = document.getElementById('toast');
const rsvpForm = document.getElementById('rsvpForm');
const guestNameDisplay = document.getElementById('guestNameDisplay');
const guestGreeting = document.getElementById('guestGreeting');
const guestCapacity = document.getElementById('guestCapacity');
const guestStatus = document.getElementById('guestStatus');
const attendanceInputs = document.querySelectorAll('input[name="attendance"]');
const companionWrap = document.getElementById('companionWrap');
const companionNameWrap = document.getElementById('companionNameWrap');
const companionInputs = document.querySelectorAll('input[name="withCompanion"]');
const ultrasoundImage = document.getElementById('ultrasoundImage');
const ultrasoundPlaceholder = document.getElementById('ultrasoundPlaceholder');

const SUPABASE_URL = 'https://echlxupvtvfuxomahydh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VnFWOxjhTbMtCDZb7Wa2jg_GOy4tdaT';
const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentGuest = null;
let currentGuestToken = null;

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
  const shouldShow = currentGuest
    && currentGuest.maxGuests > 1
    && selected
    && selected.value === 'yes';
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

function setGuestStatus(message) {
  guestStatus.textContent = message;
  guestStatus.classList.remove('hidden');
}

function showExistingResponseMessage() {
  rsvpForm.classList.add('hidden');
  setGuestStatus('Ya registramos tu respuesta. Si necesitas realizar algún cambio, comunícate con los organizadores.');
}

function normalizeGuest(data) {
  const record = Array.isArray(data) ? data[0] : data;
  if (
    !record
    || record.id === undefined
    || typeof record.name !== 'string'
    || !Number.isInteger(Number(record.max_guests))
    || Number(record.max_guests) < 1
  ) {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    maxGuests: Number(record.max_guests),
    active: record.active
  };
}

async function loadGuestInvitation() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('i');

  if (!token) {
    setGuestStatus('Para confirmar tu asistencia, utiliza el enlace personalizado que recibiste.');
    return;
  }

  if (!supabaseClient) {
    setGuestStatus('No pudimos conectar con el servicio de invitaciones. Inténtalo nuevamente más tarde.');
    return;
  }

  guestGreeting.textContent = 'Estamos verificando tu invitación...';
  guestStatus.classList.add('hidden');

  const { data, error } = await supabaseClient.rpc('get_guest_by_token', {
    p_token: token
  });

  if (error) {
    console.error(error);
    guestGreeting.textContent = '';
    setGuestStatus('No pudimos verificar tu invitación. Inténtalo nuevamente más tarde.');
    return;
  }

  currentGuest = normalizeGuest(data);
  if (!currentGuest) {
    guestGreeting.textContent = '';
    setGuestStatus('Esta invitación no es válida o ya no está disponible. Si tienes alguna duda, comunícate con los organizadores.');
    return;
  }

  if (currentGuest.active === false) {
    guestGreeting.textContent = '';
    setGuestStatus('Esta invitación ya no está disponible. Si tienes alguna duda, comunícate con los organizadores.');
    return;
  }

  currentGuestToken = token;
  guestNameDisplay.textContent = currentGuest.name;
  guestNameDisplay.classList.remove('hidden');

  const { data: hasResponded, error: responseCheckError } = await supabaseClient.rpc(
    'has_guest_responded',
    { p_token: token }
  );

  if (responseCheckError) {
    console.error(responseCheckError);
    guestGreeting.textContent = '';
    setGuestStatus('No pudimos comprobar si tu respuesta ya está registrada. Inténtalo nuevamente más tarde.');
    return;
  }

  if (typeof hasResponded !== 'boolean') {
    guestGreeting.textContent = '';
    setGuestStatus('No pudimos comprobar si tu respuesta ya está registrada. Inténtalo nuevamente más tarde.');
    return;
  }

  if (hasResponded) {
    showExistingResponseMessage();
    return;
  }

  const supportedGuestCount = Math.min(currentGuest.maxGuests, 2);
  guestGreeting.textContent = 'Nos encantaría contar contigo para celebrar la llegada de Samuel.';
  guestGreeting.classList.remove('hidden');
  guestCapacity.textContent = supportedGuestCount === 1
    ? 'Tu invitación está reservada para 1 persona.'
    : 'Tu invitación contempla hasta 2 personas: tú y 1 acompañante.';
  guestCapacity.classList.remove('hidden');
  companionWrap.classList.toggle('hidden', supportedGuestCount < 2);
  rsvpForm.classList.remove('hidden');
}

function toggleCompanionNameField() {
  const selectedCompanion = document.querySelector('input[name="withCompanion"]:checked');
  const shouldShow = selectedCompanion && selectedCompanion.value === 'yes';
  companionNameWrap.classList.toggle('hidden', !shouldShow);
}

companionInputs.forEach((input) => {
  input.addEventListener('change', toggleCompanionNameField);
});

function validateForm(formData) {
  if (!formData.attendance) {
    return 'Selecciona si podrás asistir o no.';
  }

  if (
    formData.attendance === 'yes'
    && currentGuest.maxGuests > 1
    && !formData.withCompanion
  ) {
    return 'Indica si vendrás con acompañante.';
  }

  if (
    formData.attendance === 'yes'
    && formData.withCompanion === 'yes'
    && !formData.companionName.trim()
  ) {
    return 'Indica el nombre del acompañante.';
  }

  return '';
}

async function submitGuestResponse(payload) {
  const { data: result, error } = await supabaseClient.rpc('register_guest_rsvp', {
    p_token: currentGuestToken,
    p_attendance: payload.attendance,
    p_with_companion: payload.withCompanion,
    p_companion_name: payload.companionName
  });

  if (error) {
    throw error;
  }

  if (result === 'already_responded') {
    showExistingResponseMessage();
    return false;
  }

  if (result === 'invalid_invitation') {
    rsvpForm.classList.add('hidden');
    setGuestStatus('Esta invitación ya no está disponible. Si tienes alguna duda, comunícate con los organizadores.');
    return false;
  }

  if (result !== 'registered') {
    throw new Error(`Unexpected RSVP registration result: ${result}`);
  }

  return true;
}

rsvpForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!currentGuest) {
    setGuestStatus('Para confirmar tu asistencia, utiliza el enlace personalizado que recibiste.');
    rsvpForm.classList.add('hidden');
    return;
  }

  const formData = {
    attendance: document.querySelector('input[name="attendance"]:checked')?.value || '',
    withCompanion: document.querySelector('input[name="withCompanion"]:checked')?.value || 'no',
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
    const saved = await submitGuestResponse(formData);
    if (saved) {
      const message = formData.attendance === 'yes'
        ? `¡Gracias, ${currentGuest.name}! Tu asistencia quedó registrada. 💛`
        : `Gracias por avisarnos, ${currentGuest.name}. Te tendremos presente con mucho cariño. 💛`;
      rsvpForm.classList.add('hidden');
      setGuestStatus(message);
    }
  } catch (error) {
    console.error(error);
    setGuestStatus('Hubo un problema al confirmar tu asistencia. Inténtalo de nuevo.');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
});

loadGuestInvitation().catch((error) => {
  console.error(error);
  guestGreeting.textContent = '';
  setGuestStatus('No pudimos verificar tu invitación. Inténtalo nuevamente más tarde.');
});
