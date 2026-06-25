/* =============================================
   JEANMAIRE COUVERTURE — Hero parallax + GSAP sections
   ============================================= */

(function () {
  'use strict';

  /* ---------- CONFIG ---------- */
  const IS_MOBILE = window.matchMedia('(max-width: 900px)').matches;
  const PARALLAX_INTENSITY = 0.30; // 0 = none, 1 = 1:1 with scroll
  const PARALLAX_INTENSITY_MOBILE = 0.18;

  /* ---------- DOM ---------- */
  const loader = document.getElementById('loader');
  const loaderFill = document.getElementById('loaderFill');
  const loaderPercent = document.getElementById('loaderPercent');
  const darkOverlay = document.getElementById('darkOverlay');
  const marquee = document.getElementById('marquee');
  const heroBg = document.getElementById('heroBg');
  const heroSection = document.getElementById('hero');

  /* ---------- INIT ---------- */
  function init() {
    // Loader is instant now that there are no frames to preload
    if (loaderFill) loaderFill.style.width = '100%';
    if (loaderPercent) loaderPercent.textContent = '100%';
    if (loader) {
      loader.classList.add('done');
      setTimeout(function () { loader.style.display = 'none'; }, 500);
    }

    // Smooth scroll + animations de sections — differe apres le 1er rendu
    // pour liberer le fil principal (le LCP devient detectable sur mobile bride).
    var initAnims = function () { initLenis(); initGSAP(); };
    if ('requestIdleCallback' in window) {
      requestIdleCallback(initAnims, { timeout: 800 });
    } else {
      setTimeout(initAnims, 150);
    }

    // Parallax background for hero
    initHeroParallax();

    // Misc
    initBurger();
    initDropdown();
    initScrollHeader();
    initYear();
    initFormPersist();
    initCardTilt();
    initDroneFly();
    initTestiCarousel();

    // Interactive widgets (don't depend on GSAP, run regardless)
    initServicesCarousel();
    initFaqTabs();
  }

  /* ---------- HERO PARALLAX ---------- */
  function initHeroParallax() {
    if (!heroBg || !heroSection) return;

    var amp = IS_MOBILE ? PARALLAX_INTENSITY_MOBILE : PARALLAX_INTENSITY;
    var heroHeight = heroSection.offsetHeight;
    var ticking = false;

    function update() {
      var scrolled = window.scrollY || window.pageYOffset;
      // only animate while hero is roughly in view
      if (scrolled > heroHeight * 1.2) {
        ticking = false;
        return;
      }
      var offset = scrolled * amp;
      heroBg.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0) scale(1.05)';
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', function () {
      heroHeight = heroSection.offsetHeight;
    });

    update();
  }

  /* ---------- LENIS ---------- */
  let lenis;
  function initLenis() {
    // Mobile : on garde le scroll natif (pas de rAF perpetuel Lenis -> meilleur LCP/perf)
    if (IS_MOBILE || typeof Lenis === 'undefined') return;
    lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      orientation: 'vertical',
      smoothWheel: true,
    });

    if (typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
    }
    if (typeof gsap !== 'undefined') {
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ---------- GSAP SETUP ---------- */
  function initGSAP() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      // Without GSAP, just reveal everything (graceful fallback)
      document.querySelectorAll('.scroll-section [class*="opacity"]').forEach(function (el) {
        el.style.opacity = 1;
      });
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    // Marquee fade-in once page scrolls past hero
    if (marquee) {
      gsap.set(marquee, { opacity: 0 });
      ScrollTrigger.create({
        trigger: '#hero',
        start: 'bottom 80%',
        end: 'bottom top',
        onEnter: function () { gsap.to(marquee, { opacity: 1, duration: 0.6 }); },
        onLeaveBack: function () { gsap.to(marquee, { opacity: 0, duration: 0.4 }); },
      });
    }

    animateSections();
    initZoomParallax();
  }

  /* ---------- FAQ TABS ---------- */
  function initFaqTabs() {
    var tabs = document.querySelectorAll('.faq-tab');
    var panels = document.querySelectorAll('.faq-panel');
    if (!tabs.length || !panels.length) return;

    function activate(key) {
      tabs.forEach(function (t) {
        var on = t.dataset.tab === key;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panels.forEach(function (p) {
        var on = p.dataset.panel === key;
        p.classList.toggle('is-active', on);
        // Close all <details> when switching tabs (avoids leftover open state)
        if (!on) {
          p.querySelectorAll('details[open]').forEach(function (d) { d.open = false; });
        }
      });
    }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () { activate(t.dataset.tab); });
    });

    // Keyboard: ArrowLeft/Right to move between tabs
    var tabsArr = Array.prototype.slice.call(tabs);
    tabsArr.forEach(function (t, idx) {
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          var next = idx + (e.key === 'ArrowRight' ? 1 : -1);
          if (next < 0) next = tabsArr.length - 1;
          if (next >= tabsArr.length) next = 0;
          tabsArr[next].focus();
          activate(tabsArr[next].dataset.tab);
        }
      });
    });
  }

  /* ---------- SERVICES CAROUSEL ---------- */
  function initServicesCarousel() {
    var track = document.getElementById('svcTrack');
    var prev = document.getElementById('svcPrev');
    var next = document.getElementById('svcNext');
    if (!track || !prev || !next) return;

    function step() {
      var first = track.querySelector('.svc-card');
      if (!first) return 320;
      var styles = getComputedStyle(track);
      var gap = parseFloat(styles.columnGap || styles.gap || '0');
      return first.getBoundingClientRect().width + gap;
    }

    function atEnd() {
      return track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    }
    function atStart() {
      return track.scrollLeft <= 4;
    }

    next.addEventListener('click', function () {
      if (atEnd()) {
        // Loop back to start
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: step(), behavior: 'smooth' });
      }
    });

    prev.addEventListener('click', function () {
      if (atStart()) {
        // Loop to end
        track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: -step(), behavior: 'smooth' });
      }
    });

    // Keyboard support: ←/→ when carousel has focus
    track.tabIndex = 0;
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); prev.click(); }
    });
  }

  /* ---------- ZOOM PARALLAX ---------- */
  function initZoomParallax() {
    var track = document.getElementById('zpTrack');
    if (!track) return;
    var slots = track.querySelectorAll('.zp-slot');
    if (!slots.length) return;
    // Skip the heavy parallax on small viewports — CSS already collapses to a grid
    if (window.matchMedia('(max-width: 720px)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Per-slot max scale (matches the React component's scale4/5/6/8/9 mapping)
    var maxScales = [4, 5, 6, 5, 6, 8, 9];

    ScrollTrigger.create({
      trigger: track,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.4,
      onUpdate: function (self) {
        var p = self.progress; // 0 → 1
        for (var i = 0; i < slots.length; i++) {
          var max = maxScales[i % maxScales.length];
          var scale = 1 + (max - 1) * p;
          slots[i].style.transform = 'scale(' + scale.toFixed(3) + ')';
        }
      },
    });
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
    var key = 'jeanmaire_devis';

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
        alert("Désolé, l'envoi a échoué. Contactez-nous directement au 09 39 24 79 51.");
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
