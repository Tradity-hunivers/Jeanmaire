/* =============================================
   Mobile-only red particles backdrop
   Runs only on viewports <= 900px
   ============================================= */
(function () {
  'use strict';

  if (!window.matchMedia('(max-width: 900px)').matches) return;
  if (document.getElementById('mobileParticles')) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'mobileParticles';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    zIndex: '1',
    pointerEvents: 'none',
  });

  function appendIt() {
    document.body.appendChild(canvas);
    start();
  }

  if (document.body) appendIt();
  else document.addEventListener('DOMContentLoaded', appendIt);

  function start() {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const COUNT = 28;
    const particles = [];
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.8 + 0.6,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -(Math.random() * 0.45 + 0.15),
        alpha: Math.random() * 0.55 + 0.2,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.015 + Math.random() * 0.025,
      });
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.twinkle += p.twinkleSpeed;

        // wrap around
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;

        const twinkleFactor = 0.75 + Math.sin(p.twinkle) * 0.25;
        const a = p.alpha * twinkleFactor;

        // glow halo
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(4,107,210, ' + (a * 0.12).toFixed(3) + ')';
        ctx.fill();

        // core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, ' + a.toFixed(3) + ')';
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    tick();
  }
})();
