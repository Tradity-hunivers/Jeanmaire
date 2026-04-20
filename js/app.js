/* =============================================
   BAUER COUVERTURE — Scroll-Driven Canvas + GSAP
   ============================================= */

(function () {
  'use strict';

  /* ---------- CONFIG ---------- */
  const FRAME_COUNT = 145;
  const FRAME_SPEED = 2.5;
  const IMAGE_SCALE = 1.0;
  const FRAME_PATH = 'frames/frame_';
  const IS_MOBILE = window.matchMedia('(max-width: 900px)').matches;

  /* ---------- DOM ---------- */
  const canvas = document.getElementById('videoCanvas');
  const ctx = canvas.getContext('2d');
  const loader = document.getElementById('loader');
  const loaderFill = document.getElementById('loaderFill');
  const loaderPercent = document.getElementById('loaderPercent');
  const darkOverlay = document.getElementById('darkOverlay');
  const canvasTint = document.getElementById('canvasTint');
  const marquee = document.getElementById('marquee');
  const scrollContainer = document.getElementById('scrollContainer');

  /* ---------- STATE ---------- */
  const images = [];
  let loaded = 0;
  let currentFrame = 0;
  let canvasReady = false;

  /* ---------- HELPERS ---------- */
  function padNum(n) {
    return String(n).padStart(4, '0');
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (images[currentFrame]) drawFrame(currentFrame);
  }

  function drawFrame(idx) {
    const img = images[idx];
    if (!img || !img.complete) return;
    ctx.fillStyle = '#0D0D14'; // match --bg-dark
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const cw = canvas.width;
    const ch = canvas.height;
    // On portrait (mobile), use CONTAIN (Math.min) to show full image without truncation.
    // On landscape, use COVER (Math.max) to fill viewport without bars.
    const isPortrait = ch > cw;
    const scale = isPortrait
      ? Math.min(cw / iw, ch / ih) * 1.05  // contain-ish with slight over to avoid visible bars
      : Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  /* ---------- PRELOAD FRAMES ---------- */
  function preloadFrames() {
    return new Promise((resolve) => {
      for (let i = 1; i <= FRAME_COUNT; i++) {
        const img = new Image();
        img.src = FRAME_PATH + padNum(i) + '.jpg';
        img.onload = img.onerror = function () {
          loaded++;
          const pct = Math.round((loaded / FRAME_COUNT) * 100);
          loaderFill.style.width = pct + '%';
          loaderPercent.textContent = pct + '%';
          if (loaded >= FRAME_COUNT) {
            resolve();
          }
        };
        images[i - 1] = img;
      }
    });
  }

  /* ---------- INIT ---------- */
  async function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    if (IS_MOBILE) {
      // Skip the heavy scroll-driven frame animation on mobile.
      canvas.style.display = 'none';
      if (canvasTint) canvasTint.style.display = 'none';
      loaderFill.style.width = '100%';
      loaderPercent.textContent = '100%';
    } else {
      await preloadFrames();
      drawFrame(0);
      canvasReady = true;
    }

    // Hide loader
    loader.classList.add('done');
    setTimeout(() => { loader.style.display = 'none'; }, 700);

    // Init Lenis
    initLenis();

    // Init GSAP
    initGSAP();

    // Hero entrance animation now handled by CSS (see .hero-* keyframes in style.css)
    // animateHero();

    // Misc
    initBurger();
    initDropdown();
    initScrollHeader();
    initYear();
    initFormPersist();
    initCardTilt();
    initDroneFly();
    initTestiCarousel();
  }

  /* ---------- LENIS ---------- */
  let lenis;
  function initLenis() {
    lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      orientation: 'vertical',
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- GSAP SETUP ---------- */
  function initGSAP() {
    gsap.registerPlugin(ScrollTrigger);

    if (IS_MOBILE) {
      // On mobile: no canvas animation, no forced scrollContainer height.
      // Just run the section-level animations so content still fades in.
      animateSections();
      return;
    }

    /* --- Canvas scroll-driven video with circle wipe --- */
    // Set the scroll container height to accommodate FRAME_SPEED
    const scrollH = FRAME_COUNT * FRAME_SPEED * (window.innerHeight / 100);
    scrollContainer.style.minHeight = Math.max(scrollH, 800 * parseFloat(getComputedStyle(document.documentElement).fontSize) / 16) + 'px';

    // Actually let's set a concrete min-height in vh
    scrollContainer.style.minHeight = '520vh';

    // Canvas starts hidden, reveals immediately on first scroll
    gsap.set(canvas, { opacity: 0, clipPath: 'circle(0% at 50% 50%)' });

    // Hero -> Canvas: starts as soon as scroll begins
    ScrollTrigger.create({
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: function (self) {
        const p = self.progress;
        var op = Math.min(p * 3, 1);
        canvas.style.opacity = op;
        if (canvasTint) canvasTint.style.opacity = op;
        var radius = Math.min(p * 2.5 * 75, 80);
        canvas.style.clipPath = 'circle(' + radius + '% at 50% 50%)';
        if (canvasTint) canvasTint.style.clipPath = canvas.style.clipPath;
        if (p > 0.5) {
          canvas.style.clipPath = 'none';
          if (canvasTint) canvasTint.style.clipPath = 'none';
        }
      },
    });

    // Frame scrubbing
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: function (self) {
        if (!canvasReady) return;
        var p = self.progress;
        var frame = Math.min(
          FRAME_COUNT - 1,
          Math.floor(p * FRAME_COUNT * FRAME_SPEED)
        );
        var clampedFrame = Math.min(frame, FRAME_COUNT - 1);
        if (clampedFrame !== currentFrame) {
          currentFrame = clampedFrame;
          drawFrame(currentFrame);
        }

        // Circle wipe OUT when video is done (last 15% of scroll)
        var videoEndPoint = 1.0 / FRAME_SPEED; // ~0.4, when all frames played
        var wipeOutStart = videoEndPoint + 0.05;
        var wipeOutEnd = wipeOutStart + 0.12;
        if (p > wipeOutStart && p <= wipeOutEnd) {
          var wipeProgress = (p - wipeOutStart) / (wipeOutEnd - wipeOutStart);
          var radius = 80 * (1 - wipeProgress);
          canvas.style.clipPath = 'circle(' + radius + '% at 50% 50%)';
          if (canvasTint) canvasTint.style.clipPath = canvas.style.clipPath;
          canvas.style.opacity = 1 - wipeProgress;
          if (canvasTint) canvasTint.style.opacity = canvas.style.opacity;
        } else if (p > wipeOutEnd) {
          canvas.style.opacity = 0;
          if (canvasTint) canvasTint.style.opacity = 0;
        } else if (p > 0.05) {
          canvas.style.clipPath = 'none';
          if (canvasTint) canvasTint.style.clipPath = 'none';
        }
      },
    });

    // Marquee visibility
    gsap.set(marquee, { opacity: 0 });
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: 'top 80%',
      end: 'bottom 20%',
      onEnter: function () { gsap.to(marquee, { opacity: 1, duration: 0.6 }); },
      onLeave: function () { gsap.to(marquee, { opacity: 0, duration: 0.4 }); },
      onEnterBack: function () { gsap.to(marquee, { opacity: 1, duration: 0.6 }); },
      onLeaveBack: function () { gsap.to(marquee, { opacity: 0, duration: 0.4 }); },
    });

    /* --- Section animations --- */
    animateSections();
  }

  /* ---------- HERO ENTRANCE ---------- */
  function animateHero() {
    const tl = gsap.timeline({ delay: 0.3 });

    tl.to('.hero-label', {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
    })
    .to('.hero-title .word', {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.15,
    }, '-=0.4')
    .to('.hero-sub', {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power3.out',
    }, '-=0.4')
    .to('.hero-actions', {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power3.out',
    }, '-=0.3')
    .to('.hero-scroll-hint', {
      opacity: 0.6,
      duration: 0.8,
      ease: 'power2.out',
    }, '-=0.2');
  }

  /* ---------- SECTION ANIMATIONS ---------- */
  function animateSections() {
    const sections = document.querySelectorAll('.scroll-section');

    sections.forEach(function (section) {
      const anim = section.dataset.animation;
      const label = section.querySelector('.section-label');
      const heading = section.querySelector('.section-heading');
      const body = section.querySelectorAll('.section-body');
      const cta = section.querySelector('.section-cta');

      switch (anim) {

        case 'slide-left': {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top 70%',
              end: 'top 30%',
              scrub: false,
              once: true,
            },
          });
          if (label) tl.to(label, { opacity: 1, y: 0, x: 0, duration: 0.6, ease: 'power3.out' });
          if (heading) tl.fromTo(heading, { opacity: 0, x: -80 }, { opacity: 1, x: 0, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3');
          if (body.length) tl.to(body, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1 }, '-=0.4');
          if (cta) tl.to(cta, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3');
          break;
        }

        case 'slide-right': {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top 70%',
              end: 'top 30%',
              scrub: false,
              once: true,
            },
          });
          if (label) tl.to(label, { opacity: 1, y: 0, x: 0, duration: 0.6, ease: 'power3.out' });
          if (heading) tl.fromTo(heading, { opacity: 0, x: 80 }, { opacity: 1, x: 0, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3');
          if (body.length) tl.to(body, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1 }, '-=0.4');
          if (cta) tl.to(cta, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3');
          break;
        }

        case 'stagger-up': {
          const items = section.querySelectorAll('.stat-item');
          const overlay = darkOverlay;

          // Dark overlay
          ScrollTrigger.create({
            trigger: section,
            start: 'top 80%',
            end: 'bottom 20%',
            onEnter: function () { gsap.to(overlay, { opacity: 1, duration: 0.6 }); },
            onLeave: function () { gsap.to(overlay, { opacity: 0, duration: 0.4 }); },
            onEnterBack: function () { gsap.to(overlay, { opacity: 1, duration: 0.6 }); },
            onLeaveBack: function () { gsap.to(overlay, { opacity: 0, duration: 0.4 }); },
          });

          // Counter animation
          ScrollTrigger.create({
            trigger: section,
            start: 'top 65%',
            once: true,
            onEnter: function () {
              gsap.to(items, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out',
                stagger: 0.2,
              });

              // Animate counters + progress circle (also replayable on hover)
              function playStat(item) {
                const numEl = item.querySelector('.stat-number');
                if (!numEl) return;
                const target = parseInt(numEl.dataset.target, 10);
                const circle = item.querySelector('.stat-circle-fg');
                const obj = { val: 0 };
                numEl.textContent = '0';
                gsap.to(obj, {
                  val: target,
                  duration: 1.8,
                  ease: 'power2.out',
                  overwrite: true,
                  onUpdate: function () {
                    numEl.textContent = Math.round(obj.val);
                  },
                });
                if (circle) {
                  gsap.fromTo(circle,
                    { strokeDashoffset: 439.82 },
                    { strokeDashoffset: 0, duration: 1.8, ease: 'power2.out', overwrite: true }
                  );
                }
              }

              items.forEach(function (item) {
                playStat(item);
                if (!item.dataset.hoverBound) {
                  item.addEventListener('mouseenter', function () { playStat(item); });
                  item.dataset.hoverBound = '1';
                }
              });
            },
          });
          break;
        }

        case 'clip-reveal': {
          const list = section.querySelector('.services-list') || section.querySelector('.services-cards');
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top 70%',
              once: true,
            },
          });
          if (label) tl.to(label, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
          if (heading) tl.fromTo(heading, { opacity: 0, clipPath: 'inset(100% 0 0 0)' }, { opacity: 1, y: 0, clipPath: 'inset(0% 0 0 0)', duration: 0.9, ease: 'power3.out' }, '-=0.2');
          if (body.length) tl.to(body, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1 }, '-=0.4');
          if (list) {
            tl.to(list, { opacity: 1, duration: 0.3 }, '-=0.3');
            var items = list.querySelectorAll('.service-line, .service-card-home');
            tl.fromTo(items,
              { opacity: 0, y: 30 },
              { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', stagger: 0.08 },
              '-=0.1'
            );
          }
          break;
        }

        case 'scale-up': {
          const cards = section.querySelectorAll('.testimonial-card, .g-review-card, .why-card');
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top 70%',
              once: true,
            },
          });
          if (label) tl.to(label, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
          if (heading) tl.fromTo(heading, { opacity: 0, scale: 0.85 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' }, '-=0.2');
          if (body.length) tl.to(body, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1 }, '-=0.4');
          tl.to(cards, {
            opacity: 1,
            scale: 1,
            duration: 0.7,
            ease: 'back.out(1.2)',
            stagger: 0.15,
          }, '-=0.3');
          break;
        }

        case 'fade-up': {
          const formWrap = section.querySelector('.devis-form-wrap');
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top 75%',
              once: true,
            },
          });
          if (label) tl.to(label, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
          if (heading) tl.to(heading, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.3');
          if (body.length) tl.to(body, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1 }, '-=0.4');
          if (formWrap) tl.fromTo(formWrap, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3');
          break;
        }

        case 'fade-carousel': {
          const viewport = section.querySelector('.testi-viewport');
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top 75%',
              once: true,
            },
          });
          if (label) tl.to(label, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
          if (heading) tl.to(heading, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.3');
          if (body.length) tl.to(body, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1 }, '-=0.4');
          if (viewport) tl.fromTo(viewport, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.3');
          break;
        }
      }
    });
  }

  /* ---------- BURGER MENU ---------- */
  function initBurger() {
    var burger = document.getElementById('burger');
    var mm = document.getElementById('mobileMenu');
    if (!burger || !mm) return;

    burger.addEventListener('click', function () {
      mm.classList.toggle('open');
      burger.classList.toggle('active');
    });

    mm.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mm.classList.remove('open');
        burger.classList.remove('active');
      });
    });
  }

  /* ---------- DROPDOWN ---------- */
  function initDropdown() {
    document.querySelectorAll('.dropdown-toggle').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        btn.parentElement.classList.toggle('open');
      });
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.nav-dropdown')) {
        document.querySelectorAll('.nav-dropdown.open').forEach(function (d) {
          d.classList.remove('open');
        });
      }
    });
  }

  /* ---------- HEADER SCROLL + TO-TOP ---------- */
  function initScrollHeader() {
    var header = document.getElementById('header');
    var toTop = document.getElementById('toTop');

    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 40);
      toTop.classList.toggle('show', window.scrollY > 600);
    }, { passive: true });

    toTop.addEventListener('click', function () {
      if (lenis) {
        lenis.scrollTo(0);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  /* ---------- YEAR ---------- */
  function initYear() {
    var el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------- FORM PERSISTENCE ---------- */
  function initFormPersist() {
    var form = document.getElementById('devisForm');
    if (!form) return;
    var key = 'bauer_devis';

    // Restore
    try {
      var saved = JSON.parse(localStorage.getItem(key));
      if (saved) {
        Object.keys(saved).forEach(function (name) {
          var field = form.elements[name];
          if (field) field.value = saved[name];
        });
      }
    } catch (e) {}

    // Save on input
    form.addEventListener('input', function () {
      var data = {};
      Array.from(form.elements).forEach(function (el) {
        if (el.name && el.value) data[el.name] = el.value;
      });
      try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
    });

    // Submit via fetch to Web3Forms
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var submitBtn = form.querySelector('button[type="submit"]');
      var successEl = document.getElementById('devisSuccess');
      var originalText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Envoi en cours…</span>';
      }
      try {
        var formData = new FormData(form);
        var response = await fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });
        var result = await response.json();
        if (result.success) {
          try { localStorage.removeItem(key); } catch (e2) {}
          // Hide form fields, show success
          Array.from(form.children).forEach(function (child) {
            if (child !== successEl && !child.matches('input[type="hidden"], input[name="botcheck"]')) {
              child.style.display = 'none';
            }
          });
          if (successEl) successEl.style.display = 'block';
          form.reset();
        } else {
          throw new Error(result.message || 'Erreur');
        }
      } catch (err) {
        alert("Désolé, l'envoi a échoué. Contactez-nous directement au 06 62 13 44 15.");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    });
  }

  /* ---------- CARD TILT (3D HOVER) ---------- */
  function initCardTilt() {
    if (window.matchMedia('(hover: none)').matches) return;
    var cards = document.querySelectorAll('.service-card-home');
    var MAX_TILT = 6;
    var LIFT = 6;

    cards.forEach(function (card) {
      var raf = null;
      var targetX = 0, targetY = 0, currentX = 0, currentY = 0;
      var hovering = false;

      function render() {
        currentX += (targetX - currentX) * 0.18;
        currentY += (targetY - currentY) * 0.18;
        var lift = hovering ? LIFT : 0;
        card.style.transform = 'perspective(900px) rotateX(' + currentY + 'deg) rotateY(' + currentX + 'deg) translateY(-' + lift + 'px)';
        if (Math.abs(targetX - currentX) > 0.02 || Math.abs(targetY - currentY) > 0.02 || hovering) {
          raf = requestAnimationFrame(render);
        } else {
          card.style.transform = '';
          raf = null;
        }
      }

      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        targetX = px * MAX_TILT * 2;
        targetY = -py * MAX_TILT * 2;
        hovering = true;
        if (!raf) raf = requestAnimationFrame(render);
      });

      card.addEventListener('mouseleave', function () {
        targetX = 0;
        targetY = 0;
        hovering = false;
        if (!raf) raf = requestAnimationFrame(render);
      });
    });
  }

  /* ---------- DRONE SCROLL TRAVERSE (right -> left across viewport) ---------- */
  function initDroneFly() {
    var drone = document.querySelector('.drone-fly');
    if (!drone) return;
    var wrap = drone.closest('.drone-media');
    if (!wrap) return;

    var ticking = false;

    function apply() {
      ticking = false;
      var rect = wrap.getBoundingClientRect();
      var vh = window.innerHeight;
      var total = vh + rect.height;
      var scrolled = vh - rect.top;
      var progress = scrolled / total;
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;
      // linear horizontal traversal: 110vw -> -110vw (no vertical movement)
      var x = 110 - progress * 220;
      drone.style.transform = 'translate3d(' + x.toFixed(2) + 'vw, 0, 0)';
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    }

    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    if (typeof lenis !== 'undefined' && lenis && typeof lenis.on === 'function') {
      lenis.on('scroll', onScroll);
    }
  }

  /* ---------- TESTIMONIALS CAROUSEL ---------- */
  function initTestiCarousel() {
    var track = document.getElementById('testiTrack');
    if (!track) return;
    var viewport = track.closest('.testi-viewport');
    var cards = Array.prototype.slice.call(track.querySelectorAll('.testi-card'));
    if (!cards.length) return;

    var dotsWrap = document.getElementById('testiDots');
    var prevBtn = document.querySelector('.testi-nav-btn[data-dir="-1"]');
    var nextBtn = document.querySelector('.testi-nav-btn[data-dir="1"]');

    var index = 0;
    var perView = 3;

    function computePerView() {
      var w = window.innerWidth;
      if (w < 640) perView = 1;
      else if (w < 960) perView = 2;
      else perView = 3;
    }

    function maxIndex() {
      return Math.max(0, cards.length - perView);
    }

    function clampIndex(i) {
      return Math.max(0, Math.min(i, maxIndex()));
    }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      var count = maxIndex() + 1;
      for (var i = 0; i < count; i++) {
        (function (i) {
          var dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'testi-dot' + (i === index ? ' active' : '');
          dot.setAttribute('aria-label', 'Aller à l\'avis ' + (i + 1));
          dot.addEventListener('click', function () { goTo(i); });
          dotsWrap.appendChild(dot);
        })(i);
      }
    }

    function update() {
      var card = cards[0];
      var style = window.getComputedStyle(track);
      var gap = parseFloat(style.columnGap || style.gap || '0') || 0;
      var cardWidth = card.getBoundingClientRect().width;
      var offset = index * (cardWidth + gap);
      track.style.transform = 'translateX(' + (-offset) + 'px)';
      if (dotsWrap) {
        Array.prototype.forEach.call(dotsWrap.children, function (d, i) {
          d.classList.toggle('active', i === index);
        });
      }
      if (prevBtn) prevBtn.disabled = index <= 0;
      if (nextBtn) nextBtn.disabled = index >= maxIndex();
    }

    function goTo(i) {
      index = clampIndex(i);
      update();
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(index - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(index + 1); });

    window.addEventListener('resize', function () {
      var prevPerView = perView;
      computePerView();
      if (prevPerView !== perView) {
        index = clampIndex(index);
        buildDots();
      }
      update();
    });

    computePerView();
    buildDots();
    update();
  }

  /* ---------- START ---------- */
  init();
})();
