/*!
 * Fil d'Ariane automatique — Help AI Agency
 * Génère le fil d'Ariane depuis l'URL : version visible + données structurées
 * BreadcrumbList. Intelligent : n'ajoute QUE ce qui manque (pas de doublon).
 *
 * Options (facultatives), à définir AVANT ce script :
 *   window.HA_CRUMB = {
 *     home:   "Accueil",                       // libellé de la racine
 *     labels: { "nos-offres":"Nos offres" },   // libellés personnalisés par segment d'URL
 *     target: "#contenu"                        // où insérer (sinon auto : <main> / après <header>)
 *   };
 */
(function () {
  'use strict';
  function run() {
    if (document.querySelector('.ha-breadcrumb')) return; // déjà exécuté

    // Que possède déjà la page ?
    var hasVisible = !!document.querySelector(
      '.breadcrumb,[class*="breadcrumb" i],[class*="fil-ariane" i],nav[aria-label*="riane" i]'
    );
    var hasLd = false;
    var lds = document.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < lds.length; i++) { if (/BreadcrumbList/.test(lds[i].textContent)) { hasLd = true; break; } }
    if (hasVisible && hasLd) return; // tout est déjà là

    var CFG = window.HA_CRUMB || {};
    var HOME = CFG.home || 'Accueil';
    var LABELS = CFG.labels || {};
    var origin = location.origin;

    var path = location.pathname.replace(/\/index\.html?$/i, '/');
    var raw = path.split('/').filter(Boolean).map(function (s) { return s.replace(/\.html?$/i, ''); });
    if (raw.length === 0) return; // accueil : pas de fil

    function pretty(seg) {
      return decodeURIComponent(seg).replace(/[-_]+/g, ' ').trim()
        .replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    }
    function pageName() {
      var h1 = document.querySelector('h1');
      var t = (h1 && h1.textContent) || document.title || '';
      return t.split(/\s[|–—\-]\s/)[0].trim();
    }
    function esc(x) {
      return String(x).replace(/[&<>"]/g, function (m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
      });
    }

    var crumbs = [{ name: HOME, url: origin + '/' }];
    var acc = '';
    raw.forEach(function (seg, idx) {
      acc += '/' + seg;
      var isLast = idx === raw.length - 1;
      var name = LABELS[seg] || (isLast ? (pageName() || pretty(seg)) : pretty(seg));
      crumbs.push({ name: name, url: origin + acc + '/' });
    });

    // ── Fil VISIBLE (seulement s'il n'en existe pas déjà) ──
    if (!hasVisible) {
      var nav = document.createElement('nav');
      nav.className = 'ha-breadcrumb';
      nav.setAttribute('aria-label', "Fil d'Ariane");
      var html = '<ol>';
      crumbs.forEach(function (c, idx) {
        var last = idx === crumbs.length - 1;
        html += '<li>' + (last
          ? '<span aria-current="page">' + esc(c.name) + '</span>'
          : '<a href="' + c.url + '">' + esc(c.name) + '</a><span class="ha-sep" aria-hidden="true">›</span>')
          + '</li>';
      });
      html += '</ol>';
      nav.innerHTML = html;

      if (!document.getElementById('ha-crumb-css')) {
        var st = document.createElement('style');
        st.id = 'ha-crumb-css';
        st.textContent = '.ha-breadcrumb{font:inherit;font-size:13px;line-height:1.4;padding:10px 0}'
          + '.ha-breadcrumb ol{list-style:none;margin:0 auto;padding:0 20px;max-width:1200px;display:flex;flex-wrap:wrap;align-items:center;gap:2px}'
          + '.ha-breadcrumb li{display:inline-flex;align-items:center}'
          + '.ha-breadcrumb a{color:inherit;opacity:.6;text-decoration:none}'
          + '.ha-breadcrumb a:hover{opacity:1;text-decoration:underline}'
          + '.ha-breadcrumb .ha-sep{opacity:.35;margin:0 6px}'
          + '.ha-breadcrumb [aria-current]{opacity:1;font-weight:600}';
        document.head.appendChild(st);
      }

      var target = CFG.target && document.querySelector(CFG.target);
      if (target) { target.insertBefore(nav, target.firstChild); }
      else {
        var main = document.querySelector('main');
        if (main) { main.insertBefore(nav, main.firstChild); }
        else {
          var hdr = document.querySelector('header');
          if (hdr && hdr.parentNode) { hdr.parentNode.insertBefore(nav, hdr.nextSibling); }
          else { document.body.insertBefore(nav, document.body.firstChild); }
        }
      }
    }

    // ── Données structurées BreadcrumbList (seulement si absentes) ──
    if (!hasLd) {
      var ld = {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: crumbs.map(function (c, idx) {
          return { '@type': 'ListItem', position: idx + 1, name: c.name, item: c.url };
        })
      };
      var s = document.createElement('script');
      s.type = 'application/ld+json';
      s.textContent = JSON.stringify(ld);
      document.head.appendChild(s);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
