/* =============================================
   JEANMAIRE COUVERTURE — Rotating Image Carousel
   Vanilla JS port of the ImageCarouselHero React component.
   Keeps the existing site's fonts and color palette.
   ============================================= */

(function () {
  'use strict';

  /* ---------- DATA ---------- */
  // 8 photos picked from /images covering each Jeanmaire service
  const IMAGES = [
    { src: 'images/toit-tuiles-plates-lucarnes.jpg',          alt: 'Grand toit en tuiles plates percé de lucarnes',    tag: 'Couverture',     rotation: -15 },
    { src: 'images/toiture-bac-acier-nervure.jpg',        alt: 'Toiture en bac acier nervuré au-dessus d\'une façade',   tag: 'Zinguerie',      rotation: -8  },
    { src: 'images/fermes-charpente-pignon.jpg',        alt: 'Fermes de charpente en bois sur un pignon en construction', tag: 'Charpente',      rotation: 5   },
    { src: 'images/fenetre-de-toit-store-tuiles.jpg',     alt: 'Fenêtre de toit équipée d\'un store, sur une toiture en tuiles',  tag: 'Velux',          rotation: 12  },
    { src: 'images/pose-laine-de-verre-mur.jpg',        alt: 'Pose de rouleaux de laine de verre entre montants',    tag: 'Isolation',      rotation: -12 },
    { src: 'images/intervention-toiture-harnais.jpg',alt: 'Intervenant équipé d\'un harnais et d\'un casque sur une toiture',    tag: 'Nettoyage',      rotation: 8   },
    { src: 'images/couvreur-nacelle-toit-tuiles.jpg',          alt: 'Couvreur travaillant depuis une nacelle sur un toit en tuiles',tag: 'Pose toiture',   rotation: -5  }
  ];

  /* ---------- CONFIG ---------- */
  const ROTATION_SPEED = 0.18;     // degrees per tick
  const TICK_MS        = 33;       // ~30fps for the orbit; CSS handles per-frame interpolation
  const RADIUS_DESKTOP = 280;
  const RADIUS_MOBILE  = 150;
  const PERSPECTIVE_AMP = 18;      // degrees of tilt at edges
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- DOM ---------- */
  const stage = document.getElementById('carouselStage');
  const track = document.getElementById('carouselTrack');
  if (!stage || !track) return;

  /* ---------- STATE ---------- */
  const angles = IMAGES.map((_, i) => i * (360 / IMAGES.length));   // base orbital angles (deg)
  let mouseX = 0.5;   // 0..1 — center by default
  let mouseY = 0.5;
  let radius = window.innerWidth < 720 ? RADIUS_MOBILE : RADIUS_DESKTOP;

  /* ---------- BUILD CARDS ---------- */
  const cards = IMAGES.map((data, idx) => {
    const card = document.createElement('div');
    card.className = 'carousel-card';
    card.setAttribute('role', 'img');
    card.setAttribute('aria-label', data.alt);

    const img = document.createElement('img');
    img.src = data.src;
    img.alt = data.alt;
    img.loading = idx < 3 ? 'eager' : 'lazy';
    if (idx < 3) img.setAttribute('fetchpriority', 'high');
    card.appendChild(img);

    const tag = document.createElement('span');
    tag.className = 'card-tag';
    tag.textContent = data.tag;
    card.appendChild(tag);

    track.appendChild(card);
    return card;
  });

  /* ---------- LAYOUT (called every frame) ---------- */
  function applyTransforms() {
    // Tilt of the whole stage based on mouse position
    const perspectiveX = (mouseX - 0.5) * PERSPECTIVE_AMP;     // rotateY
    const perspectiveY = (mouseY - 0.5) * PERSPECTIVE_AMP;     // rotateX (inverted feel)

    track.style.transform =
      'rotateX(' + (-perspectiveY).toFixed(2) + 'deg) ' +
      'rotateY(' + perspectiveX.toFixed(2) + 'deg)';

    for (let i = 0; i < cards.length; i++) {
      const angleDeg = angles[i];
      const angleRad = angleDeg * (Math.PI / 180);
      const x = Math.cos(angleRad) * radius;
      const y = Math.sin(angleRad) * radius * 0.55;             // flatter ellipse
      const z = Math.sin(angleRad) * 60;                        // depth so cards pass behind/front
      const ownTilt = IMAGES[i].rotation;

      cards[i].style.transform =
        'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) ' +
        'rotateZ(' + ownTilt + 'deg)';

      // Cards in the back are slightly dimmed for depth perception
      const depthRatio = (z + 60) / 120;        // 0 (back) .. 1 (front)
      cards[i].style.zIndex = String(Math.round(depthRatio * 100));
      cards[i].style.opacity = (0.55 + depthRatio * 0.45).toFixed(2);
    }
  }

  /* ---------- ANIMATION LOOP ---------- */
  let last = performance.now();
  function tick(now) {
    const dt = (now - last) / TICK_MS;
    last = now;

    if (!REDUCED_MOTION) {
      const step = ROTATION_SPEED * dt;
      for (let i = 0; i < angles.length; i++) {
        angles[i] = (angles[i] + step) % 360;
      }
    }

    applyTransforms();
  }

  /* ---------- EVENTS ---------- */
  stage.addEventListener('mousemove', function (e) {
    const rect = stage.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / rect.width;
    mouseY = (e.clientY - rect.top) / rect.height;
  });
  stage.addEventListener('mouseleave', function () {
    mouseX = 0.5;
    mouseY = 0.5;
  });

  // Touch parallax
  stage.addEventListener('touchmove', function (e) {
    if (!e.touches || !e.touches[0]) return;
    const rect = stage.getBoundingClientRect();
    mouseX = (e.touches[0].clientX - rect.left) / rect.width;
    mouseY = (e.touches[0].clientY - rect.top) / rect.height;
  }, { passive: true });

  window.addEventListener('resize', function () {
    radius = window.innerWidth < 720 ? RADIUS_MOBILE : RADIUS_DESKTOP;
  });

  // Pause animation when tab is hidden (saves CPU)
  let rafId = null;
  function start() { if (!rafId) { last = performance.now(); rafId = requestAnimationFrame(loop); } }
  function stop()  { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }
  function loop(now) { tick(now); rafId = requestAnimationFrame(loop); }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  // First paint without animation, then start the loop
  applyTransforms();
  start();
})();
