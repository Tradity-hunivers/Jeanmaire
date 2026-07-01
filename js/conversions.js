/* =============================================================
   Suivi des conversions Google Ads (AW-711090610) — Jeanmaire
   Conversion "Contact" (ads_conversion_Nous_contacter_1) :
     1) clic sur un numero de telephone (tel:)
     2) envoi reussi d'un formulaire (devis ou contact)
   Fonctionne avec la balise gtag deja presente dans le <head>.
   ============================================================= */
(function () {
  'use strict';

  function fireContactConversion() {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'ads_conversion_Nous_contacter_1', {});
    }
  }

  /* 1) Clic sur un numero de telephone (header, footer, CTA, boutons) */
  document.addEventListener('click', function (e) {
    var tel = e.target && e.target.closest ? e.target.closest('a[href^="tel:"]') : null;
    if (tel) fireContactConversion();
  }, true);

  /* 2) Formulaire envoye avec succes (devis + contact).
     Les deux formulaires affichent un message .form-success (display:none -> block)
     quand l'envoi reussit. On observe cette apparition -> on declenche une seule fois. */
  function watchForms() {
    var els = document.querySelectorAll('.form-success');
    Array.prototype.forEach.call(els, function (el) {
      if (el.getAttribute('data-conv-watched')) return;
      el.setAttribute('data-conv-watched', '1');
      var obs = new MutationObserver(function () {
        var visible = el.offsetParent !== null &&
                      window.getComputedStyle(el).display !== 'none';
        if (visible) {
          fireContactConversion();
          obs.disconnect();
        }
      });
      obs.observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
    });
  }

  /* 3) Barre de contact mobile fixe (CRO) — "Appeler" + "Devis", toujours
     visible en bas de l'ecran sur mobile (< 768px), sur toutes les pages.
     Le clic "Appeler" (lien tel:) declenche aussi la conversion via le
     listener ci-dessus. Auto-suffisant : injecte son propre style. */
  function buildMobileCtaBar() {
    if (document.getElementById('mobileCtaBar')) return;

    var css =
      '.mobile-cta-bar{display:none}' +
      '@media(max-width:768px){' +
        'body{padding-bottom:56px}' +
        '.to-top{bottom:72px!important}' +
        'body.menu-open .mobile-cta-bar{display:none}' +
        '.mobile-cta-bar{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:998;box-shadow:0 -2px 16px rgba(6,14,24,.25)}' +
        '.mobile-cta-bar a{flex:1 1 0;display:flex;align-items:center;justify-content:center;gap:8px;min-height:56px;padding:8px;font-family:var(--font-display,sans-serif);font-weight:700;font-size:1.05rem;line-height:1.15;text-decoration:none;color:#fff}' +
        '.mobile-cta-bar a:active{filter:brightness(.92)}' +
        '.mobile-cta-bar .mcta-call{background:var(--accent,#876234)}' +
        '.mobile-cta-bar .mcta-devis{background:var(--primary-dark,#1A2D42)}' +
      '}';
    var style = document.createElement('style');
    style.id = 'mobileCtaStyle';
    style.textContent = css;
    document.head.appendChild(style);

    var bar = document.createElement('div');
    bar.className = 'mobile-cta-bar';
    bar.id = 'mobileCtaBar';
    bar.innerHTML =
      '<a class="mcta-call" href="tel:0939247951" aria-label="Appeler Jeanmaire Couverture">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' +
        'Appeler' +
      '</a>' +
      '<a class="mcta-devis" href="/contact.html#devis" aria-label="Demander un devis gratuit">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>' +
        'Devis gratuit' +
      '</a>';
    document.body.appendChild(bar);
  }

  function initContact() {
    watchForms();
    buildMobileCtaBar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContact);
  } else {
    initContact();
  }
})();
