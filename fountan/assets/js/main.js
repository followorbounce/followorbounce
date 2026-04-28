/* ===========================
   MERIDIAN MIND — MAIN JS
   =========================== */

// --- NAV SCROLL ---
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });
}

// --- MOBILE NAV TOGGLE ---
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

// --- FADE-UP SCROLL REVEAL ---
const fadeEls = document.querySelectorAll('.fade-up');
if (fadeEls.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  fadeEls.forEach(el => observer.observe(el));
}

// --- BOOKING FORM (AJAX) ---
const bookingForm = document.getElementById('bookingForm');
const bookingSuccess = document.getElementById('bookingSuccess');
const bookingFormCard = document.getElementById('bookingFormCard');

if (bookingForm) {
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate
    let valid = true;
    const fields = bookingForm.querySelectorAll('[required]');
    fields.forEach(field => {
      const error = field.parentElement.querySelector('.error-msg');
      if (!field.value.trim()) {
        field.classList.add('error');
        if (error) error.classList.add('show');
        valid = false;
      } else {
        field.classList.remove('error');
        if (error) error.classList.remove('show');
      }
    });

    // Email validation
    const emailField = bookingForm.querySelector('[type="email"]');
    if (emailField && emailField.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
      emailField.classList.add('error');
      const err = emailField.parentElement.querySelector('.error-msg');
      if (err) { err.textContent = 'Please enter a valid email address.'; err.classList.add('show'); }
      valid = false;
    }

    if (!valid) return;

    // Simulate AJAX submission
    const submitBtn = bookingForm.querySelector('[type="submit"]');
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;

    await new Promise(r => setTimeout(r, 1400));

    // Show success
    bookingForm.style.display = 'none';
    if (bookingSuccess) {
      bookingSuccess.classList.add('show');
    }
  });

  // Live validation on input
  bookingForm.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input', () => {
      if (field.value.trim()) {
        field.classList.remove('error');
        const err = field.parentElement.querySelector('.error-msg');
        if (err) err.classList.remove('show');
      }
    });
  });
}

// --- SMOOTH ACTIVE NAV ---
const currentPath = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav__links a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPath || (currentPath === '' && href === 'index.html')) {
    link.classList.add('active');
  } else {
    link.classList.remove('active');
  }
});
