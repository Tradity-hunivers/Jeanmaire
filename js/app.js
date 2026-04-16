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
    const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
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

    await preloadFrames();

    // Draw first frame
    drawFrame(0);
    canvasReady = true;

    // Hide loader
    loader.classList.add('done');
    setTimeout(() => { loader.style.display = 'none'; }, 700);

    // Init Lenis
    initLenis();

    // Init GSAP
    initGSAP();

    // Hero entrance animation
    animateHero();

    // Misc
    initBurger();
    initDropdown();
    initScrollHeader();
    initYear();
    initFormPersist();
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

    /* --- Canvas scroll-driven video with circle wipe --- */
    // Set the scroll container height to accommodate FRAME_SPEED
    const scrollH = FRAME_COUNT * FRAME_SPEED * (window.innerHeight / 100);
    scrollContainer.style.minHeight = Math.max(scrollH, 800 * parseFloat(getComputedStyle(document.documentElement).fontSize) / 16) + 'px';

    // Actually let's set a concrete min-height in vh
    scrollContainer.style.minHeight = '900vh';

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
      const body = section.querySelector('.section-body');
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
          if (body) tl.to(body, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.4');
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
          if (body) tl.to(body, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.4');
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

              // Animate counters
              items.forEach(function (item) {
                const numEl = item.querySelector('.stat-number');
                const target = parseInt(numEl.dataset.target, 10);
                const obj = { val: 0 };
                gsap.to(obj, {
                  val: target,
                  duration: 2,
                  ease: 'power2.out',
                  onUpdate: function () {
                    numEl.textContent = Math.round(obj.val);
                  },
                });
              });
            },
          });
          break;
        }

        case 'clip-reveal': {
          const list = section.querySelector('.services-list');
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top 70%',
              once: true,
            },
          });
          if (label) tl.to(label, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
          if (heading) tl.fromTo(heading, { opacity: 0, clipPath: 'inset(100% 0 0 0)' }, { opacity: 1, y: 0, clipPath: 'inset(0% 0 0 0)', duration: 0.9, ease: 'power3.out' }, '-=0.2');
          if (body) tl.to(body, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.4');
          if (list) {
            tl.to(list, { opacity: 1, duration: 0.3 }, '-=0.3');
            var lines = list.querySelectorAll('.service-line');
            tl.fromTo(lines,
              { opacity: 0, x: -30 },
              { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out', stagger: 0.1 },
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
          if (formWrap) tl.fromTo(formWrap, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3');
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

    // Clear on submit
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      try { localStorage.removeItem(key); } catch (e) {}
      // Could send via fetch here
      alert('Merci ! Votre demande de devis a bien été envoyée. Nous vous recontacterons sous 48h.');
      form.reset();
    });
  }

  /* ---------- START ---------- */
  init();
})();
