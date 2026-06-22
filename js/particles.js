/* =============================================
   Particules mobiles — DÉSACTIVÉ
   ---------------------------------------------
   Cet effet créait un <canvas> position:fixed plein écran (z-index:1)
   ajouté au <body> sur mobile. À cause de `isolation:isolate` sur le hero,
   ce canvas passait PAR-DESSUS tout le contenu (titre compris), ce qui
   empêchait Lighthouse de détecter le LCP (erreur NO_LCP) sur mobile et
   consommait du CPU en continu (mauvais Total Blocking Time).

   Effet décoratif retiré pour la performance. Pour le réactiver un jour,
   il faudrait insérer le canvas À L'INTÉRIEUR du hero, derrière le texte.
   ============================================= */
(function () {
  'use strict';
  /* no-op */
})();
