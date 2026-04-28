/**
 * main.js — navigation interactions
 * Handles: hamburger menu, submenu keyboard a11y, scroll active state
 */
(function () {
  'use strict';

  // ── Hamburger ──────────────────────────────────────────
  var hamburger = document.querySelector('.js-hamburger');
  var mobileNav = document.getElementById('mobile-nav');
  var isOpen    = false;

  function openNav() {
    isOpen = true;
    hamburger.setAttribute('aria-expanded', 'true');
    mobileNav.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    isOpen = false;
    hamburger.setAttribute('aria-expanded', 'false');
    mobileNav.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', function () {
      isOpen ? closeNav() : openNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) closeNav();
    });
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { if (isOpen) closeNav(); });
    });
  }

  // ── Submenu keyboard a11y ──────────────────────────────
  document.querySelectorAll('.menu-bar__item--has-sub > .menu-bar__link').forEach(function (trigger) {
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var expanded = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', String(!expanded));
      }
      if (e.key === 'Escape') {
        trigger.setAttribute('aria-expanded', 'false');
        trigger.focus();
      }
    });
  });

  // ── Card scroll helper (home page) ─────────────────────
  window.scrollToSection = function (sectionId) {
    var el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

}());
