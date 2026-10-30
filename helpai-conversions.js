/* Help AI — evenements de conversion Google Analytics (v2, 2026-10-30).
 * generate_lead  : envoye UNIQUEMENT quand la demande a ete recue par le serveur.
 *   Signal prioritaire : apres une reponse OK du serveur, le formulaire du site appelle
 *     window.dispatchEvent(new CustomEvent('helpai:lead', { detail: { form_id: 'devis' } }));
 *   Filets de securite tant qu'un site n'envoie pas ce signal :
 *     - apparition d'un message de succes visible (.form-success, [data-form-success],
 *       .wpcf7-mail-sent-ok, form.sent) ;
 *     - arrivee sur une page de remerciement (/merci, /merci/, /merci.html) depuis ce site.
 *   Un seul envoi par demande (anti-doublon de 10 s).
 *   v1 comptait au clic sur « Envoyer » : un envoi en echec etait compte comme une demande.
 * clic_telephone : clic sur un numero de telephone.
 * Rien n'est envoye a Google si Analytics n'est pas charge (visiteur qui a refuse les cookies).
 * Origine du visiteur : window.helpaiOrigine() renvoie { utm_*, gclid, gbraid, wbraid,
 *   referrer, landing, canal } de la premiere page de la visite, gardes le temps de la
 *   visite (sessionStorage de ce site, jamais transmis a un tiers) pour etre joints a la
 *   demande envoyee au dashboard.
 */
(function () {
  'use strict';
  var CLE = 'helpai_origine';
  function envoyer(nom, params) {
    if (typeof window.gtag !== 'function') return;
    try { window.gtag('event', nom, params || {}); } catch (e) { /* jamais bloquant */ }
  }

  // ---- Origine du visiteur (premiere page de la visite) ----
  function canal(o) {
    if (o.gclid || o.gbraid || o.wbraid || /cpc|ppc|paid/i.test(o.utm_medium || '')) return 'google_ads';
    if (/gbp|fiche/i.test((o.utm_campaign || '') + ' ' + (o.utm_content || ''))) return 'fiche_google';
    if (o.utm_source) return 'campagne';
    var r = o.referrer || '';
    if (/chatgpt\.com|openai\.com|perplexity\.ai|gemini\.google|copilot\.microsoft|claude\.ai/i.test(r)) return 'ia';
    if (/(^|\.)(google|bing|qwant|duckduckgo|ecosia|yahoo)\./i.test(r.replace(/^https?:\/\//, ''))) return 'recherche_naturelle';
    if (/facebook\.|instagram\.|linkedin\.|tiktok\./i.test(r)) return 'reseaux_sociaux';
    return r ? 'site_referent' : 'direct';
  }
  var origine = null;
  try { origine = JSON.parse(sessionStorage.getItem(CLE) || 'null'); } catch (e) { origine = null; }
  if (!origine) {
    var p = { get: function () { return null; } };
    try { p = new URLSearchParams(location.search); } catch (e) { /* vieux navigateur */ }
    var ref = document.referrer || '';
    try { if (ref && new URL(ref).hostname === location.hostname) ref = ''; } catch (e) { ref = ''; }
    origine = {
      utm_source: p.get('utm_source'), utm_medium: p.get('utm_medium'),
      utm_campaign: p.get('utm_campaign'), utm_content: p.get('utm_content'),
      gclid: p.get('gclid'), gbraid: p.get('gbraid'), wbraid: p.get('wbraid'),
      referrer: ref.slice(0, 300), landing: location.pathname.slice(0, 200)
    };
    origine.canal = canal(origine);
    try { sessionStorage.setItem(CLE, JSON.stringify(origine)); } catch (e) { /* stockage refuse */ }
  }
  window.helpaiOrigine = function () {
    var o = {};
    for (var k in origine) if (origine[k]) o[k] = origine[k];
    return o;
  };

  // ---- Clic sur un numero de telephone ----
  document.addEventListener('click', function (e) {
    var cible = e.target && e.target.closest ? e.target.closest('a[href^="tel:"]') : null;
    if (cible) envoyer('clic_telephone', { link_url: cible.getAttribute('href'), page_path: location.pathname });
  }, true);

  // ---- Demande reellement recue ----
  var dernier = 0;
  function lead(formId, methode) {
    if (Date.now() - dernier < 10000) return;
    dernier = Date.now();
    envoyer('generate_lead', { form_id: formId || '', page_path: location.pathname, methode: methode, canal: origine.canal });
  }
  window.addEventListener('helpai:lead', function (e) {
    lead(e && e.detail && e.detail.form_id, 'confirme');
  });

  // Filet 1 : message de succes qui devient visible.
  var SEL = '.form-success, [data-form-success], .wpcf7-mail-sent-ok, form.sent';
  var vus = typeof WeakSet === 'function' ? new WeakSet() : null;
  function visible(el) {
    if (!el.getClientRects().length) return false;
    var s = window.getComputedStyle(el);
    return s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) !== 0;
  }
  function etatInitial() {
    var els = document.querySelectorAll(SEL);
    for (var i = 0; i < els.length; i++) if (vus && visible(els[i])) vus.add(els[i]); // deja visible au chargement : pas une demande
  }
  var attente = null;
  function verifier() {
    attente = null;
    var els = document.querySelectorAll(SEL);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (vus && vus.has(el)) continue;
      if (visible(el)) {
        if (vus) vus.add(el);
        var f = el.closest ? (el.closest('form') || (el.parentNode && el.parentNode.querySelector && el.parentNode.querySelector('form'))) : null;
        lead(f ? (f.id || f.getAttribute('name') || '') : '', 'message_succes');
      }
    }
  }
  function demarrer() {
    etatInitial();
    if (typeof MutationObserver !== 'function') return;
    new MutationObserver(function () {
      if (!attente) attente = setTimeout(verifier, 300);
    }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
  }
  if (document.body) demarrer(); else document.addEventListener('DOMContentLoaded', demarrer);

  // Filet 2 : page de remerciement atteinte depuis ce site (pas une visite directe).
  if (/\/merci(\/|\.html)?$/i.test(location.pathname)) {
    var depuisSite = false;
    try { depuisSite = !!document.referrer && new URL(document.referrer).hostname === location.hostname; } catch (e) { depuisSite = false; }
    var dejaCompte = false;
    try { dejaCompte = sessionStorage.getItem('helpai_merci') === location.pathname; } catch (e) { /* rien */ }
    if (depuisSite && !dejaCompte) {
      try { sessionStorage.setItem('helpai_merci', location.pathname); } catch (e) { /* rien */ }
      lead('', 'page_merci');
    }
  }
})();
