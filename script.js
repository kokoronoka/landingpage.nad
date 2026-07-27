/* ============================================================
   ZELL-V NAD+  |  Interactions
   ============================================================ */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Nav: scrolled state ---------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('mobileMenu');
  function closeMenu() {
    toggle.classList.remove('open');
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  toggle.addEventListener('click', function () {
    var open = toggle.classList.toggle('open');
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !prefersReduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Animated counters ---------- */
  var counters = document.querySelectorAll('.counter');
  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-target'), 10) || 0;
    if (prefersReduced) { el.textContent = target; return; }
    var start = 0, dur = 1600, t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCounter(e.target); cObs.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cObs.observe(c); });
  } else {
    counters.forEach(function (c) { c.textContent = c.getAttribute('data-target'); });
  }

  /* ---------- Feature rotator ---------- */
  var cards = document.querySelectorAll('#rotator .fcard');
  var dots = document.querySelectorAll('#dots span');
  if (cards.length) {
    var idx = 0, timer = null;
    function show(i) {
      cards[idx].classList.remove('is-active');
      if (dots[idx]) dots[idx].classList.remove('is-active');
      idx = (i + cards.length) % cards.length;
      cards[idx].classList.add('is-active');
      if (dots[idx]) dots[idx].classList.add('is-active');
    }
    function start() { timer = setInterval(function () { show(idx + 1); }, 3800); }
    function stop() { clearInterval(timer); }
    dots.forEach(function (d, i) {
      d.style.cursor = 'pointer';
      d.addEventListener('click', function () { stop(); show(i); start(); });
    });
    var strip = document.getElementById('rotator');
    strip.addEventListener('mouseenter', stop);
    strip.addEventListener('mouseleave', start);
    if (!prefersReduced) start();
  }

  /* ---------- Smooth-scroll offset for fixed nav ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var top = el.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: top, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Contact form ---------- */
  var form = document.getElementById('ctaForm');
  var note = document.getElementById('formNote');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.name;
      var email = form.email;
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      var nameOk = name.value.trim().length >= 2;

      name.classList.toggle('invalid', !nameOk);
      email.classList.toggle('invalid', !emailOk);

      if (!nameOk) { note.style.color = '#e6b98e'; note.textContent = 'Please enter your name.'; name.focus(); return; }
      if (!emailOk) { note.style.color = '#e6b98e'; note.textContent = 'Please enter a valid email.'; email.focus(); return; }

      note.style.color = '';
      note.textContent = 'Thank you, ' + name.value.trim().split(' ')[0] + '. Our team will respond within 24 hours.';
      form.reset();
    });
  }

  /* ============================================================
     HERO: cursor-following spotlight reveal
     ============================================================ */
  var hero = document.getElementById('hero');
  var revealLayer = document.getElementById('heroReveal');
  if (hero && revealLayer) {
    var SPOTLIGHT_R = window.innerWidth < 640 ? 170 : 260;
    revealLayer.style.setProperty('--r', SPOTLIGHT_R + 'px');

    if (prefersReduced) {
      // Static, centered reveal for reduced-motion users — no cursor dependency.
      revealLayer.style.setProperty('--mx', '50%');
      revealLayer.style.setProperty('--my', '45%');
    } else {
      var mouse = { x: -999, y: -999 };
      var smooth = { x: -999, y: -999 };
      var rafRef = null;

      function onMove(clientX, clientY) {
        var rect = hero.getBoundingClientRect();
        mouse.x = clientX - rect.left;
        mouse.y = clientY - rect.top;
      }
      hero.addEventListener('mousemove', function (e) { onMove(e.clientX, e.clientY); });
      hero.addEventListener('mouseleave', function () { mouse.x = -999; mouse.y = -999; });
      hero.addEventListener('touchmove', function (e) {
        if (e.touches && e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });

      function loop() {
        smooth.x += (mouse.x - smooth.x) * 0.1;
        smooth.y += (mouse.y - smooth.y) * 0.1;
        revealLayer.style.setProperty('--mx', smooth.x + 'px');
        revealLayer.style.setProperty('--my', smooth.y + 'px');
        rafRef = requestAnimationFrame(loop);
      }
      loop();

      window.addEventListener('resize', function () {
        SPOTLIGHT_R = window.innerWidth < 640 ? 170 : 260;
        revealLayer.style.setProperty('--r', SPOTLIGHT_R + 'px');
      });
    }
  }
})();
