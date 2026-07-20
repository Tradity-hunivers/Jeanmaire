/* =============================================================
   Navigation du header — menu deroulant "Services"
   -------------------------------------------------------------
   Le menu ".dropdown-menu" ne s'ouvre que si la classe ".open"
   est posee sur ".nav-dropdown" : pages.css ne contient aucune
   regle :hover. Cette logique vit dans js/app.js, mais app.js
   n'est charge que par index.html — sur toutes les autres pages
   le bouton "Services" ne repondait donc pas au clic.

   NE PAS inclure sur index.html : app.js s'en charge deja, un
   double gestionnaire annulerait le toggle.
   ============================================================= */
(function () {
  'use strict';

  function closeAll() {
    var open = document.querySelectorAll('.nav-dropdown.open');
    Array.prototype.forEach.call(open, function (d) { d.classList.remove('open'); });
  }

  function init() {
    var toggles = document.querySelectorAll('.dropdown-toggle');
    Array.prototype.forEach.call(toggles, function (btn) {
      if (btn.getAttribute('data-nav-bound')) return;
      btn.setAttribute('data-nav-bound', '1');
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var parent = btn.parentElement;
        var willOpen = !parent.classList.contains('open');
        closeAll();
        if (willOpen) parent.classList.add('open');
        btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      });
    });

    /* Clic en dehors du menu -> fermeture */
    document.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('.nav-dropdown')) closeAll();
    });

    /* Touche Echap -> fermeture (accessibilite clavier) */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) closeAll();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
