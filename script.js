/* ============================================================
   ZELL-V NAD+  |  Interactions
   ============================================================ */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

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
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !prefersReduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Animated counters ---------- */
  var counters = document.querySelectorAll('.counter');
  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-target'), 10) || 0;
    if (prefersReduced) { el.textContent = target; return; }
    var dur = 1400, t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { animateCounter(e.target); cObs.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cObs.observe(c); });
  } else {
    counters.forEach(function (c) { c.textContent = c.getAttribute('data-target'); });
  }

  /* ---------- Smooth-scroll offset for sticky nav ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var top = el.getBoundingClientRect().top + window.scrollY - 76;
      window.scrollTo({ top: top, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });

  /* ============================================================
     HERO: cursor-following spotlight reveal
     ============================================================ */
  var hero = document.getElementById('hero');
  var revealLayer = document.getElementById('heroReveal');
  if (hero && revealLayer) {
    var SPOTLIGHT_R = window.innerWidth < 640 ? 170 : 260;
    revealLayer.style.setProperty('--r', SPOTLIGHT_R + 'px');

    if (prefersReduced) {
      revealLayer.style.setProperty('--mx', '50%');
      revealLayer.style.setProperty('--my', '45%');
    } else {
      var mouse = { x: -999, y: -999 };
      var smooth = { x: -999, y: -999 };

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
        requestAnimationFrame(loop);
      }
      loop();

      window.addEventListener('resize', function () {
        SPOTLIGHT_R = window.innerWidth < 640 ? 170 : 260;
        revealLayer.style.setProperty('--r', SPOTLIGHT_R + 'px');
      });
    }
  }

  /* ============================================================
     INTERACTIVE QUIZ
     ============================================================ */
  var CHECK_SVG = '<svg viewBox="0 0 24 24" width="13" height="13"><path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var quizSteps = [
    {
      type: 'multi',
      question: 'What are your primary wellness objectives?',
      options: ['Mental Clarity & Focus', 'Anti-Aging & Longevity', 'Physical Energy & Recovery', 'Metabolic Support']
    },
    {
      type: 'single',
      question: 'How would you describe your energy levels lately?',
      options: ['Great', 'Okay', 'Low', 'Depleted']
    },
    {
      type: 'single',
      question: 'How often do you experience brain fog or fatigue?',
      options: ['Rarely', 'Sometimes', 'Often', 'Daily']
    },
    {
      type: 'contact',
      question: 'Where should we send your personalized results?'
    }
  ];

  var quizBody = document.getElementById('quizBody');
  var quizProgressBar = document.getElementById('quizProgressBar');
  var quizStepLabel = document.getElementById('quizStepLabel');

  if (quizBody) {
    var current = 0;
    var answers = {};
    var total = quizSteps.length;

    function updateProgress() {
      var pct = Math.min(((current + 1) / (total + 1)) * 100, 100);
      quizProgressBar.style.width = pct + '%';
      if (current < total) {
        quizStepLabel.textContent = 'Step ' + (current + 1) + ' of ' + total;
      } else {
        quizStepLabel.textContent = 'Complete';
      }
    }

    function canContinue() {
      if (current >= total) return true;
      var step = quizSteps[current];
      var a = answers[current];
      if (step.type === 'multi') return !!(a && a.length);
      if (step.type === 'single') return !!a;
      if (step.type === 'contact') {
        var name = a && a.name ? a.name.trim() : '';
        var email = a && a.email ? a.email.trim() : '';
        return name.length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      }
      return false;
    }

    function renderStep() {
      updateProgress();

      if (current >= total) {
        quizBody.innerHTML =
          '<div class="quiz__result">' +
            '<div class="quiz__result-icon">' +
              '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '</div>' +
            '<h4>Your Assessment Is Ready</h4>' +
            '<p>Based on your answers, a personalized pharmaceutical&#8209;grade NAD&#43; protocol could help restore your focus, energy, and recovery. Our team will follow up with your tailored plan.</p>' +
            '<a href="#contact" class="btn btn--gold" id="quizCtaBtn">See My Personalized Plan</a>' +
          '</div>';
        var ctaBtn = document.getElementById('quizCtaBtn');
        if (ctaBtn) {
          ctaBtn.addEventListener('click', function (e) {
            e.preventDefault();
            var el = document.querySelector('#contact');
            var top = el.getBoundingClientRect().top + window.scrollY - 76;
            window.scrollTo({ top: top, behavior: prefersReduced ? 'auto' : 'smooth' });
          });
        }
        return;
      }

      var step = quizSteps[current];
      var html = '<p class="quiz__question">' + step.question + '</p>';

      if (step.type === 'multi' || step.type === 'single') {
        var selected = answers[current] || (step.type === 'multi' ? [] : null);
        html += '<div class="quiz__options">';
        step.options.forEach(function (opt, i) {
          var isSel = step.type === 'multi' ? selected.indexOf(opt) !== -1 : selected === opt;
          html += '<div class="quiz__option' + (isSel ? ' selected' : '') + '" data-opt="' + i + '">' +
            '<span class="quiz__option-box">' + CHECK_SVG + '</span><span>' + opt + '</span></div>';
        });
        html += '</div>';
      } else if (step.type === 'contact') {
        var a = answers[current] || {};
        html += '<div class="quiz__field"><label for="quizName">Full Name</label>' +
          '<input type="text" id="quizName" placeholder="Jane Doe" value="' + (a.name || '') + '" /></div>' +
          '<div class="quiz__field"><label for="quizEmail">Email Address</label>' +
          '<input type="email" id="quizEmail" placeholder="jane@email.com" value="' + (a.email || '') + '" /></div>';
      }

      html += '<div class="quiz__nav">' +
        (current > 0 ? '<button type="button" class="quiz__back" id="quizBack">Back</button>' : '<span></span>') +
        '<button type="button" class="quiz__continue" id="quizContinue" disabled>Continue</button>' +
        '</div>';

      quizBody.innerHTML = html;

      var continueBtn = document.getElementById('quizContinue');
      continueBtn.disabled = !canContinue();

      quizBody.querySelectorAll('.quiz__option').forEach(function (el) {
        el.addEventListener('click', function () {
          var i = parseInt(el.getAttribute('data-opt'), 10);
          var opt = step.options[i];
          if (step.type === 'multi') {
            var arr = answers[current] || [];
            var idx = arr.indexOf(opt);
            if (idx === -1) arr.push(opt); else arr.splice(idx, 1);
            answers[current] = arr;
          } else {
            answers[current] = opt;
          }
          renderStep();
        });
      });

      var nameInput = document.getElementById('quizName');
      var emailInput = document.getElementById('quizEmail');
      if (nameInput) {
        [nameInput, emailInput].forEach(function (inp) {
          inp.addEventListener('input', function () {
            answers[current] = {
              name: nameInput.value,
              email: emailInput.value
            };
            continueBtn.disabled = !canContinue();
          });
        });
      }

      var backBtn = document.getElementById('quizBack');
      if (backBtn) backBtn.addEventListener('click', function () { current--; renderStep(); });

      continueBtn.addEventListener('click', function () {
        if (!canContinue()) return;
        current++;
        renderStep();
      });
    }

    renderStep();
  }
})();
