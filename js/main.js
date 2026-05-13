/* ============================================================
   VOPAK HOLDING TERMINALS B.V. — MAIN JAVASCRIPT
   ============================================================ */

/* With defer, DOMContentLoaded may already have fired — check readyState */
function domReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

domReady(() => {
  initNav();
  initAccordion();
  initStatCounters();
  initFadeUp();
  initForm();
  initMobileMenu();
  setActiveNavLink();
});

/* ── Navigation scroll effect ── */
function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 50);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ── Active nav link ── */
function setActiveNavLink() {
  const links = document.querySelectorAll('.nav-links a');
  const page = location.pathname.split('/').pop() || 'index.html';
  links.forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === 'index.html' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

/* ── Mobile menu ── */
function initMobileMenu() {
  const btn = document.querySelector('.nav-hamburger');
  const drawer = document.querySelector('.nav-mobile');
  if (!btn || !drawer) return;

  btn.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  drawer.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      drawer.classList.remove('open');
      btn.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* ── Accordion ── */
function initAccordion() {
  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      const body = trigger.nextElementSibling;

      // Close all in same accordion
      const parent = trigger.closest('.accordion');
      if (parent) {
        parent.querySelectorAll('.accordion-trigger').forEach(t => {
          t.setAttribute('aria-expanded', 'false');
          const b = t.nextElementSibling;
          if (b) b.classList.remove('open');
        });
      }

      if (!expanded) {
        trigger.setAttribute('aria-expanded', 'true');
        if (body) body.classList.add('open');
      }
    });
  });
}

/* ── Stat counters — animations.js handles these ── */
function initStatCounters() {
  if (window._vpAnimationsLoaded) return;
  const stats = document.querySelectorAll('[data-count]');
  if (!stats.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(el => observer.observe(el));
}

function animateCount(el) {
  const target = parseFloat(el.dataset.count);
  const duration = 1800;
  const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
  const start = performance.now();

  const tick = now => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = target * ease;
    el.textContent = decimals ? current.toFixed(decimals) : Math.round(current).toLocaleString();
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = decimals ? target.toFixed(decimals) : target.toLocaleString();
  };
  requestAnimationFrame(tick);
}

/* ── Fade-up — animations.js handles this via IntersectionObserver ── */
function initFadeUp() {
  if (window._vpAnimationsLoaded) return;
  const els = document.querySelectorAll('.fade-up');
  if (!els.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const siblings = [...entry.target.parentElement.querySelectorAll('.fade-up:not(.visible)')];
        const idx = siblings.indexOf(entry.target);
        setTimeout(() => entry.target.classList.add('visible'), idx * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => observer.observe(el));
}

/* ── Contact form validation ── */
function initForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;

    // Clear previous errors
    form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    form.querySelectorAll('.form-error').forEach(el => el.classList.remove('show'));

    const required = form.querySelectorAll('[required]');
    required.forEach(field => {
      if (!field.value.trim()) {
        field.classList.add('error');
        const err = field.parentElement.querySelector('.form-error');
        if (err) err.classList.add('show');
        valid = false;
      }
    });

    // Email validation
    const email = form.querySelector('[type="email"]');
    if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      email.classList.add('error');
      const err = email.parentElement.querySelector('.form-error');
      if (err) { err.textContent = 'Please enter a valid email address.'; err.classList.add('show'); }
      valid = false;
    }

    // Terminal checkbox — at least one
    const checkboxes = form.querySelectorAll('[name="terminal"]');
    if (checkboxes.length) {
      const anyChecked = [...checkboxes].some(cb => cb.checked);
      if (!anyChecked) {
        const grp = form.querySelector('.form-check-group');
        if (grp) {
          const err = grp.parentElement.querySelector('.form-error');
          if (err) err.classList.add('show');
        }
        valid = false;
      }
    }

    if (valid) {
      const success = document.getElementById('form-success');
      if (success) success.classList.add('show');
      form.reset();
      setTimeout(() => success && success.classList.remove('show'), 6000);
    }
  });

  // Live clear error on input
  form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(field => {
    field.addEventListener('input', () => {
      field.classList.remove('error');
      const err = field.parentElement.querySelector('.form-error');
      if (err) err.classList.remove('show');
    });
  });
}

/* ── Smooth scroll for anchor links ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
