/* Help AI — evenements de conversion Google Analytics (2026-10-16).
 * generate_lead  : un formulaire de contact est envoye (formulaire valide).
 * clic_telephone : clic sur un numero de telephone.
 * Rien n'est envoye si Analytics n'est pas charge (visiteur qui a refuse
 * les cookies) : le script s'appuie uniquement sur la balise deja presente. */
(function () {
  'use strict';
  function envoyer(nom, params) {
    if (typeof window.gtag !== 'function') return;
    try { window.gtag('event', nom, params || {}); } catch (e) { /* jamais bloquant */ }
  }
  document.addEventListener('click', function (e) {
    var cible = e.target && e.target.closest ? e.target.closest('a[href^="tel:"]') : null;
    if (cible) envoyer('clic_telephone', { link_url: cible.getAttribute('href'), page_path: location.pathname });
  }, true);
  var dernier = 0;
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || f.tagName !== 'FORM') return;
    // Recherche, newsletter : pas des demandes de contact.
    if (/search|recherche|newsletter/i.test((f.getAttribute('role') || '') + ' ' + (f.id || '') + ' ' + (f.className || '') + ' ' + (f.getAttribute('action') || ''))) return;
    if (Date.now() - dernier < 3000) return; // double clic sur Envoyer
    dernier = Date.now();
    envoyer('generate_lead', { form_id: f.id || f.getAttribute('name') || '', page_path: location.pathname });
  }, true);
})();
