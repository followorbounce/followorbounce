/**
 * nav.js — Follow or Bounce
 * Handles:
 *  1. Dropdown submenu toggle (click + keyboard)
 *  2. Nav active state sync on scroll (IntersectionObserver)
 *  3. Active state on card click (home page only)
 */

(function () {
  'use strict';

  // ── 1. DROPDOWN SUBMENUS ─────────────────────────────────────────────────────
  const submenuParents = document.querySelectorAll('[data-submenu-toggle]');

  submenuParents.forEach(function (btn) {
    const wrapper = btn.closest('.menu-bar__item--has-submenu');
    const submenu = wrapper ? wrapper.querySelector('.submenu') : null;
    if (!wrapper || !submenu) return;

    const links = submenu.querySelectorAll('.submenu__link');

    function openMenu() {
      wrapper.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      submenu.setAttribute('aria-hidden', 'false');
      // Make submenu links focusable
      links.forEach(function (l) { l.setAttribute('tabindex', '0'); });
    }

    function closeMenu() {
      wrapper.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      submenu.setAttribute('aria-hidden', 'true');
      links.forEach(function (l) { l.setAttribute('tabindex', '-1'); });
    }

    function toggleMenu() {
      wrapper.classList.contains('is-open') ? closeMenu() : openMenu();
    }

    // Click toggle
    btn.addEventListener('click', toggleMenu);

    // Keyboard: Enter / Space toggle; Escape closes
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMenu();
      }
      if (e.key === 'Escape') closeMenu();
    });

    // Close when focus leaves the entire dropdown
    wrapper.addEventListener('focusout', function (e) {
      if (!wrapper.contains(e.relatedTarget)) closeMenu();
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!wrapper.contains(e.target)) closeMenu();
    });
  });

  // ── 2. SCROLL-SYNCED ACTIVE NAV ──────────────────────────────────────────────
  const navLinks = document.querySelectorAll('.menu-bar__link:not(.menu-bar__link--action-link)');

  function setNavActive(url) {
    navLinks.forEach(function (link) {
      const href = link.getAttribute('href');
      if (href && url && href.endsWith(url)) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('is-active');
        link.removeAttribute('aria-current');
      }
    });
  }

  // IntersectionObserver for anchor-based single-page sections (home page)
  const anchorSections = document.querySelectorAll('[data-nav-section]');

  if (anchorSections.length > 0) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('id');
          const matchingLink = document.querySelector('.menu-bar__link[href="#' + sectionId + '"]');
          navLinks.forEach(function (l) {
            l.classList.remove('is-active');
            l.removeAttribute('aria-current');
          });
          if (matchingLink) {
            matchingLink.classList.add('is-active');
            matchingLink.setAttribute('aria-current', 'true');
          }
        }
      });
    }, { rootMargin: '-40% 0px -40% 0px' });

    anchorSections.forEach(function (el) { observer.observe(el); });
  }

  // ── 3. CARD CLICK → NAV HIGHLIGHT (home page) ────────────────────────────────
  window.setActiveSection = function (card, sectionId) {
    navLinks.forEach(function (l) {
      l.classList.remove('is-active');
      l.removeAttribute('aria-current');
    });

    const target = document.querySelector('.menu-bar__link[href="#' + sectionId + '"]');
    if (target) {
      target.classList.add('is-active');
      target.setAttribute('aria-current', 'true');
    }

    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

})();
