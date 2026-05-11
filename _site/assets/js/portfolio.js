/**
 * portfolio.js — Follow or Bounce
 * Filter portfolio cards by category.
 * Zero dependencies. GitHub Pages CSP compatible (no eval, no inline).
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var filterBtns = document.querySelectorAll('.pf-filter__btn');
    var cards      = document.querySelectorAll('.pf-grid .pf-card, .pf-featured__grid .pf-card');
    var emptyEl    = document.getElementById('portfolio-empty');

    if (!filterBtns.length) return;

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.getAttribute('data-filter');

        /* Update active button */
        filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');

        /* Show/hide cards */
        var visibleCount = 0;
        cards.forEach(function (card) {
          var category = card.getAttribute('data-category');
          var show     = filter === 'all' || category === filter;
          card.classList.toggle('is-hidden', !show);
          if (show) visibleCount++;
        });

        /* Empty state */
        if (emptyEl) {
          emptyEl.style.display = visibleCount === 0 ? 'flex' : 'none';
        }
      });
    });
  });

})();
