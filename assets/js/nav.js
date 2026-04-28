/**
 * assets/js/nav.js
 * Global navigation behaviours:
 *   1. Desktop: sync active state with IntersectionObserver (anchor sections)
 *   2. Desktop: smooth-scroll cards into view on click
 *   3. Desktop: keyboard-accessible submenu toggle (Enter / Space / Escape)
 *   4. Mobile:  hamburger open/close with focus trap
 *
 * No dependencies. Loaded deferred from _layouts/default.html.
 */

(function () {
  'use strict';

  // ══════════════════════════════════════════════════════════
  //  DESKTOP NAV — active state
  // ══════════════════════════════════════════════════════════

  const navLinks = Array.from(
    document.querySelectorAll('.menu-bar__link:not(.menu-bar__link--action)')
  );

  function clearActive () {
    navLinks.forEach(l => {
      l.classList.remove('is-active');
      l.removeAttribute('aria-current');
      l.closest('.menu-bar__item')?.classList.remove('active');
    });
  }

  function setActiveLink (link) {
    clearActive();
    link.classList.add('is-active');
    link.setAttribute('aria-current', 'page');
    link.closest('.menu-bar__item')?.classList.add('active');
  }

  // Observe anchor sections (home page single-page usage)
  const sectionsToWatch = ['about', 'technology', 'literature', 'contracts', 'subscribe'];

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const target = document.querySelector(
          `.menu-bar__link[href="#${entry.target.id}"]`
        );
        if (target) setActiveLink(target);
      });
    }, { rootMargin: '-40% 0px -40% 0px' });

    sectionsToWatch.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  // Card click → scroll + nav highlight (home page)
  window.setActive = function (card, section) {
    const target = document.querySelector(`.menu-bar__link[href="#${section}"]`);
    if (target) setActiveLink(target);
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ══════════════════════════════════════════════════════════
  //  DESKTOP — keyboard submenu a11y
  // ══════════════════════════════════════════════════════════

  document.querySelectorAll('.menu-bar__item--has-sub > .menu-bar__link').forEach(trigger => {
    trigger.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', String(!isOpen));
      }
      if (e.key === 'Escape') {
        trigger.setAttribute('aria-expanded', 'false');
        trigger.focus();
      }
    });
  });

  // ══════════════════════════════════════════════════════════
  //  MOBILE — hamburger
  // ══════════════════════════════════════════════════════════

  const hamburger  = document.querySelector('.js-hamburger');
  const mobileNav  = document.getElementById('mobile-nav');

  if (!hamburger || !mobileNav) return;

  let isOpen = false;

  function openNav () {
    isOpen = true;
    hamburger.setAttribute('aria-expanded', 'true');
    mobileNav.removeAttribute('hidden');
    document.body.style.overflow = 'hidden'; // prevent scroll bleed
    // Move focus to first link for accessibility
    mobileNav.querySelector('a')?.focus();
  }

  function closeNav () {
    isOpen = false;
    hamburger.setAttribute('aria-expanded', 'false');
    // Let CSS transition play before re-hiding
    mobileNav.addEventListener('transitionend', function handler () {
      if (!isOpen) mobileNav.setAttribute('hidden', '');
      mobileNav.removeEventListener('transitionend', handler);
    }, { once: true });
    document.body.style.overflow = '';
    hamburger.focus();
  }

  hamburger.addEventListener('click', () => isOpen ? closeNav() : openNav());

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) closeNav();
  });

  // Close when a nav link is tapped (navigating away)
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (isOpen) closeNav();
    });
  });

}());
