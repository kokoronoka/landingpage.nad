/* ============================================================
   ZÉLL-V NAD+  |  Interactions
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

  /* ---------- Nav: glass-over-hero -> solid-fixed on scroll ---------- */
  var nav = document.getElementById('nav');
  var heroSection = document.getElementById('hero');
  if (nav && heroSection) {
    var onNavScroll = function () {
      var threshold = heroSection.offsetHeight - nav.offsetHeight;
      var past = window.scrollY > threshold;
      nav.classList.toggle('is-fixed', past);
      nav.classList.toggle('scrolled', past);
    };
    window.addEventListener('scroll', onNavScroll, { passive: true });
    window.addEventListener('resize', onNavScroll);
    onNavScroll();
  }

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
     HERO: soft cursor-following glow blob
     ============================================================ */
  var hero = document.getElementById('hero');
  var heroBlob = document.getElementById('heroBlob');
  if (hero && heroBlob && !prefersReduced) {
    var mouse = { x: -999, y: -999 };
    var smooth = { x: -999, y: -999 };
    var hasMoved = false;

    function onMove(clientX, clientY) {
      var rect = hero.getBoundingClientRect();
      mouse.x = clientX - rect.left;
      mouse.y = clientY - rect.top;
      hasMoved = true;
    }
    hero.addEventListener('mousemove', function (e) { onMove(e.clientX, e.clientY); });
    hero.addEventListener('touchmove', function (e) {
      if (e.touches && e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    function loop() {
      if (hasMoved) {
        smooth.x += (mouse.x - smooth.x) * 0.06;
        smooth.y += (mouse.y - smooth.y) * 0.06;
        heroBlob.style.transform = 'translate(' + (smooth.x - 240) + 'px, ' + (smooth.y - 240) + 'px)';
      }
      requestAnimationFrame(loop);
    }
    loop();
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

  /* ============================================================
     WHATSAPP WIDGET
     ============================================================ */
  var waToggle = document.getElementById('waToggle');
  var waPanel = document.getElementById('waPanel');
  var waCollapse = document.getElementById('waCollapse');
  if (waToggle && waPanel) {
    function setWaOpen(open) {
      waPanel.classList.toggle('open', open);
      waPanel.setAttribute('aria-hidden', String(!open));
      waToggle.setAttribute('aria-expanded', String(open));
    }
    waToggle.addEventListener('click', function () {
      setWaOpen(!waPanel.classList.contains('open'));
    });
    if (waCollapse) {
      waCollapse.addEventListener('click', function () { setWaOpen(false); });
    }
    document.addEventListener('click', function (e) {
      if (!waPanel.classList.contains('open')) return;
      if (waPanel.contains(e.target) || waToggle.contains(e.target)) return;
      setWaOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setWaOpen(false);
    });
  }

  /* ============================================================
     PROBLEM SECTION: scroll-driven sticky image swap
     ============================================================ */
  var problemItems = document.querySelectorAll('.problem-scroll__item');
  var problemImgs = document.querySelectorAll('.problem-scroll__img');
  if (problemItems.length && problemImgs.length) {
    function setActiveProblem(idx) {
      problemItems.forEach(function (el) { el.classList.toggle('is-active', el.getAttribute('data-index') === String(idx)); });
      problemImgs.forEach(function (el) { el.classList.toggle('is-active', el.getAttribute('data-slot') === String(idx)); });
    }
    if ('IntersectionObserver' in window) {
      var pObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) setActiveProblem(e.target.getAttribute('data-index'));
        });
      }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
      problemItems.forEach(function (el) { pObs.observe(el); });
    }
  }

  /* ============================================================
     GALLERY — drag-to-explore strip + scrub bar + auto-slide
     ============================================================ */
  var dragGallery = document.getElementById('dragGallery');
  var dragTrack = document.getElementById('dragTrack');
  var dragBar = document.getElementById('dragBar');
  var dragThumb = document.getElementById('dragThumb');

  if (dragGallery && dragTrack && dragBar && dragThumb) {
    var maxScroll = function () { return dragTrack.scrollWidth - dragTrack.clientWidth; };

    function syncThumb() {
      var max = maxScroll();
      var ratio = max > 0 ? dragTrack.scrollLeft / max : 0;
      var thumbWidthPct = Math.max((dragTrack.clientWidth / dragTrack.scrollWidth) * 100, 8);
      dragThumb.style.width = thumbWidthPct + '%';
      dragThumb.style.left = ratio * (100 - thumbWidthPct) + '%';
    }

    /* ---- Mouse / touch drag on the image strip ---- */
    var isDown = false, startX = 0, startScroll = 0, moved = false;
    function pointerX(e) { return (e.touches ? e.touches[0].clientX : e.clientX); }

    dragTrack.addEventListener('mousedown', function (e) {
      isDown = true; moved = false;
      startX = pointerX(e); startScroll = dragTrack.scrollLeft;
      dragGallery.classList.add('is-dragging');
      stopAuto();
      e.preventDefault();
    });
    window.addEventListener('mousemove', function (e) {
      if (!isDown) return;
      var dx = pointerX(e) - startX;
      if (Math.abs(dx) > 3) moved = true;
      dragTrack.scrollLeft = startScroll - dx;
    });
    window.addEventListener('mouseup', function () {
      if (!isDown) return;
      isDown = false;
      dragGallery.classList.remove('is-dragging');
      scheduleAuto();
    });

    dragTrack.addEventListener('touchstart', function (e) {
      startX = pointerX(e); startScroll = dragTrack.scrollLeft;
      stopAuto();
    }, { passive: true });
    dragTrack.addEventListener('touchend', scheduleAuto, { passive: true });

    dragTrack.addEventListener('scroll', syncThumb, { passive: true });

    /* ---- Scrub bar: click or drag to seek ---- */
    function seekFromClientX(clientX) {
      var rect = dragBar.getBoundingClientRect();
      var pct = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      dragTrack.scrollLeft = pct * maxScroll();
    }
    var barDragging = false;
    dragBar.addEventListener('mousedown', function (e) {
      barDragging = true; stopAuto(); seekFromClientX(e.clientX);
    });
    window.addEventListener('mousemove', function (e) {
      if (barDragging) seekFromClientX(e.clientX);
    });
    window.addEventListener('mouseup', function () {
      if (barDragging) { barDragging = false; scheduleAuto(); }
    });

    /* ---- Gentle auto-slide, pauses on interaction ---- */
    var autoTimer = null, resumeTimer = null, autoDir = 1;
    function autoStep() {
      var max = maxScroll();
      if (max <= 0) return;
      if (dragTrack.scrollLeft >= max - 1) autoDir = -1;
      else if (dragTrack.scrollLeft <= 1) autoDir = 1;
      dragTrack.scrollLeft += autoDir * 0.6;
    }
    function startAuto() {
      if (prefersReduced) return;
      stopAuto();
      autoTimer = setInterval(autoStep, 20);
    }
    function stopAuto() { clearInterval(autoTimer); clearTimeout(resumeTimer); }
    function scheduleAuto() { clearTimeout(resumeTimer); resumeTimer = setTimeout(startAuto, 1500); }

    dragGallery.addEventListener('mouseenter', stopAuto);
    dragGallery.addEventListener('mouseleave', function () { if (!isDown) scheduleAuto(); });

    window.addEventListener('resize', syncThumb);
    syncThumb();
    startAuto();
  }
})();
