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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchForms);
  } else {
    watchForms();
  }
})();
