/* ================================================================
   VOPAK — LIGHTWEIGHT ANIMATION ENGINE (no GSAP dependency)
   Uses CSS transitions + IntersectionObserver + vanilla JS only.
   Keeps: scroll reveals, cursor, scroll progress, page entrance,
          nav hide/show, counter animation, nav underlines.
   Removed: particle canvas, film grain, card tilt, magnetic
            buttons, parallax scrub (all were causing slow loads).
================================================================ */
'use strict';

(function () {

  /* ── 1. Scroll Progress Bar ── */
  function initScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'vp-scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        bar.style.transform = `scaleX(${Math.min(pct, 1)})`;
        ticking = false;
      });
    }, { passive: true });
  }

  /* ── 2. Custom Cursor (desktop only) ── */
  function initCursor() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const dot  = document.createElement('div');
    const ring = document.createElement('div');
    dot.className  = 'vp-cursor-dot';
    ring.className = 'vp-cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.classList.add('vp-custom-cursor');

    let mx = 0, my = 0, rx = 0, ry = 0, rafId;

    window.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform  = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
      if (!rafId) rafId = requestAnimationFrame(lerpRing);
    }, { passive: true });

    function lerpRing() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      const dx = Math.abs(mx - rx), dy = Math.abs(my - ry);
      rafId = (dx > 0.2 || dy > 0.2) ? requestAnimationFrame(lerpRing) : null;
    }

    document.querySelectorAll('a,button,.btn,.team-card,.terminal-card,.sidebar-card,.accordion-trigger').forEach(el => {
      el.addEventListener('mouseenter', () => { dot.classList.add('active'); ring.classList.add('active'); });
      el.addEventListener('mouseleave', () => { dot.classList.remove('active'); ring.classList.remove('active'); });
    });

    window.addEventListener('mousedown', () => dot.classList.add('clicking'),   { passive: true });
    window.addEventListener('mouseup',   () => dot.classList.remove('clicking'), { passive: true });
  }

  /* ── 3. Page Entrance Overlay ── */
  function initPageEntrance() {
    const overlay = document.createElement('div');
    overlay.className = 'vp-page-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);

    /* Force reflow then remove to trigger CSS transition */
    overlay.getBoundingClientRect();
    requestAnimationFrame(() => {
      overlay.classList.add('vp-overlay-out');
      overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
    });
  }

  /* ── 4. Scroll Reveal (IntersectionObserver) ── */
  function initScrollReveals() {
    /* Elements get opacity:0 / translateY via CSS class .vp-reveal,
       then .vp-reveal-visible is added when they enter the viewport. */
    const targets = document.querySelectorAll(
      '.fade-up, .terminal-card, .team-card, .sidebar-card, ' +
      '.value-card, .feature-item, .approach-item, .cert-item, ' +
      '.stat-row-item, .region-item, .timeline-item, .cta-banner, ' +
      '.accordion-item, .form-card, .location-row'
    );

    if (!targets.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        /* Stagger siblings that appear together */
        const siblings = [...(el.parentElement?.querySelectorAll('.vp-reveal:not(.vp-reveal-visible)') || [])];
        const idx = siblings.indexOf(el);
        const delay = Math.min(idx * 70, 350);
        setTimeout(() => {
          el.classList.add('vp-reveal-visible');
          el.classList.add('visible'); /* also satisfy main.js .fade-up check */
        }, delay);
        observer.unobserve(el);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(el => {
      el.classList.add('vp-reveal');
      observer.observe(el);
    });
  }

  /* ── 5. Smart Nav (hide on scroll down) ── */
  function initNavBehavior() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    let lastY = 0, ticking = false;

    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        nav.classList.toggle('nav-hidden', y > lastY && y > 100);
        lastY = y;
        ticking = false;
      });
    }, { passive: true });
  }

  /* ── 6. Counter Animation ── */
  function initCounters() {
    const els = document.querySelectorAll('[data-count]');
    if (!els.length) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    els.forEach(el => observer.observe(el));
  }

  function animateCounter(el) {
    const target   = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0');
    const suffix   = el.dataset.suffix || '';
    const dur      = 1800;
    const t0       = performance.now();

    (function tick(now) {
      const p   = Math.min((now - t0) / dur, 1);
      const val = target * (1 - Math.pow(1 - p, 3));
      el.textContent = (decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString()) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = (decimals ? target.toFixed(decimals) : target.toLocaleString()) + suffix;
    })(t0);
  }

  /* ── 7. Nav Underline Hover ── */
  function initNavUnderlines() {
    document.querySelectorAll('.nav-links a').forEach(a => {
      const line = document.createElement('span');
      line.style.cssText =
        'position:absolute;bottom:-2px;left:0;width:100%;height:1.5px;' +
        'background:#d4af37;transform:scaleX(0);transform-origin:left;' +
        'transition:transform 0.3s cubic-bezier(.4,0,.2,1);pointer-events:none;';
      a.style.position = 'relative';
      a.appendChild(line);
      a.addEventListener('mouseenter', () => line.style.transform = 'scaleX(1)');
      a.addEventListener('mouseleave', () => line.style.transform = 'scaleX(0)');
    });
  }

  /* ── 8. Page Exit Transition ── */
  function initPageTransitions() {
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (!href || href.startsWith('#') || href.startsWith('mailto:') ||
          href.startsWith('tel:') || href.startsWith('http') || href.startsWith('//')) return;

      a.addEventListener('click', e => {
        e.preventDefault();
        const overlay = document.createElement('div');
        overlay.className = 'vp-page-overlay vp-overlay-exit';
        overlay.setAttribute('aria-hidden', 'true');
        document.body.appendChild(overlay);
        overlay.getBoundingClientRect();
        requestAnimationFrame(() => {
          overlay.classList.add('vp-overlay-in');
          overlay.addEventListener('transitionend', () => {
            window.location.href = href;
          }, { once: true });
        });
      });
    });
  }

  /* ── Boot ── */
  function boot() {
    window._vpAnimationsLoaded = true;
    initScrollProgress();
    initCursor();
    initPageEntrance();
    initScrollReveals();
    initNavBehavior();
    initCounters();
    initNavUnderlines();
    initPageTransitions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
