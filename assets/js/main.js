(function () {
  'use strict';

  /* ── DROPDOWN SUBMENUS ─────────────────────────────────────────────────── */
  //
  // ROOT CAUSE:
  // .menu-bar uses overflow-x:auto for horizontal scroll on mobile.
  // CSS spec: overflow-x:auto forces overflow-y to 'hidden' — cannot be overridden.
  // Safari enforces this strictly, clipping submenus in portrait mode.
  //
  // FIX: Move every .submenu to <body> ("portal" pattern).
  // Position with fixed coords via getBoundingClientRect().

  var wrappers = Array.from(document.querySelectorAll('.has-submenu'));

  var submenus = wrappers.map(function (wrapper) {
    var sm = wrapper.querySelector('.submenu');
    if (sm) document.body.appendChild(sm);
    return sm;
  });

  function closeAll() {
    wrappers.forEach(function (w, i) {
      w.classList.remove('open');
      var b = w.querySelector('.menu-bar-btn');
      if (b) b.setAttribute('aria-expanded', 'false');
      if (submenus[i]) submenus[i].style.display = 'none';
    });
  }

  wrappers.forEach(function (wrapper, i) {
    var btn = wrapper.querySelector('.menu-bar-btn');
    var sm  = submenus[i];
    if (!btn || !sm) return;

    sm.style.position   = 'fixed';
    sm.style.zIndex     = '9999';
    sm.style.display    = 'none';
    sm.style.background = 'var(--paper)';
    sm.style.border     = '1px solid #0d0c0a';
    sm.style.listStyle  = 'none';
    sm.style.minWidth   = '180px';

    function openIt() {
      closeAll();
      var rect = btn.getBoundingClientRect();
      sm.style.top     = rect.bottom + 'px';
      sm.style.left    = rect.left + 'px';
      sm.style.display = 'block';
      // Clamp to viewport: if submenu overflows right edge, shift it left
      var smRect = sm.getBoundingClientRect();
      if (smRect.right > window.innerWidth - 8) {
        sm.style.left = Math.max(8, window.innerWidth - smRect.width - 8) + 'px';
      }
      wrapper.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }

    function closeIt() {
      sm.style.display = 'none';
      wrapper.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }

    function toggle(e) {
      e.stopPropagation();
      e.preventDefault();
      wrapper.classList.contains('open') ? closeIt() : openIt();
    }

    btn.addEventListener('touchstart', toggle, { passive: false });
    btn.addEventListener('click', toggle);
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(e); }
      if (e.key === 'Escape') closeIt();
    });

    sm.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('touchstart', function () {
        setTimeout(closeIt, 150);
      }, { passive: true });
    });
  });

  document.addEventListener('touchstart', function (e) {
    var inWrapper = wrappers.some(function (w) { return w.contains(e.target); });
    var inSubmenu = submenus.some(function (sm) { return sm && sm.contains(e.target); });
    if (!inWrapper && !inSubmenu) closeAll();
  }, { passive: true });

  document.addEventListener('click', function (e) {
    var inWrapper = wrappers.some(function (w) { return w.contains(e.target); });
    var inSubmenu = submenus.some(function (sm) { return sm && sm.contains(e.target); });
    if (!inWrapper && !inSubmenu) closeAll();
  });

  /* ── CARD CLICK → NAV HIGHLIGHT ───────────────────────────────────────── */
  window.activateSection = function (card, id) {
    document.querySelectorAll('.menu-bar-link').forEach(function (l) {
      l.classList.remove('active');
    });
    var link = document.querySelector('.menu-bar-link[href="#' + id + '"]');
    if (link) link.classList.add('active');
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ── AI CHAT WIDGET ────────────────────────────────────────────────────── */
  var aibtn    = document.getElementById('ai-btn');
  var modal    = document.getElementById('ai-modal');
  var closeBtn = document.getElementById('ai-close');
  var input    = document.getElementById('ai-input');
  var send     = document.getElementById('ai-send');
  var msgs     = document.getElementById('ai-messages');

  if (!aibtn) return;

  var API_KEY = '';

  aibtn.addEventListener('click', function () { modal.classList.add('open'); input && input.focus(); });
  closeBtn.addEventListener('click', function () { modal.classList.remove('open'); });
  modal.addEventListener('click', function (e) { if (e.target === modal) modal.classList.remove('open'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') modal.classList.remove('open'); });

  async function sendMsg() {
    var text = input.value.trim();
    if (!text) return;
    addMsg('You', text);
    input.value = '';
    try {
      var res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + API_KEY,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: text }] }] }) }
      );
      var data = await res.json();
      var reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
      addMsg('AI', reply);
    } catch (e) {
      addMsg('AI', 'Error — check your API key.');
    }
  }

  function addMsg(who, text) {
    var p = document.createElement('p');
    p.innerHTML = '<b>' + who + ':</b> ' + text.replace(/</g, '&lt;');
    msgs.appendChild(p);
    msgs.scrollTop = msgs.scrollHeight;
  }

  send.addEventListener('click', sendMsg);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); sendMsg(); }
  });

})();
