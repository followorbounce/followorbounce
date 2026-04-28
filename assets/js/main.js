(function () {
  'use strict';

  /* ── DROPDOWN SUBMENUS ─────────────────────────────────────────────────── */
  // Fully rebuilt for iOS Safari compatibility:
  // - uses div[role=button] instead of <button> (avoids iOS tap issues)
  // - listens to touchstart (not touchend/click) for instant response
  // - closes on any tap outside via document touchstart

  function openSubmenu(wrapper, btn) {
    wrapper.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
  }

  function closeSubmenu(wrapper, btn) {
    wrapper.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }

  function closeAll() {
    document.querySelectorAll('.has-submenu.open').forEach(function (w) {
      var b = w.querySelector('.menu-bar-btn');
      closeSubmenu(w, b);
    });
  }

  document.querySelectorAll('.has-submenu').forEach(function (wrapper) {
    var btn = wrapper.querySelector('.menu-bar-btn');

    function toggle(e) {
      e.stopPropagation();
      if (wrapper.classList.contains('open')) {
        closeSubmenu(wrapper, btn);
      } else {
        closeAll();
        openSubmenu(wrapper, btn);
      }
    }

    // touchstart fires instantly on iOS, no 300ms delay
    btn.addEventListener('touchstart', toggle, { passive: false });
    // click as fallback for desktop
    btn.addEventListener('click', toggle);

    // keyboard support
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(e); }
      if (e.key === 'Escape') closeSubmenu(wrapper, btn);
    });
  });

  // Close when tapping anywhere outside
  document.addEventListener('touchstart', function (e) {
    if (!e.target.closest('.has-submenu')) closeAll();
  }, { passive: true });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.has-submenu')) closeAll();
  });

  /* ── CARD CLICK → SCROLL + NAV HIGHLIGHT ──────────────────────────────── */
  window.activateSection = function (card, id) {
    document.querySelectorAll('.menu-bar-link').forEach(function (l) {
      l.classList.remove('active');
    });
    var link = document.querySelector('.menu-bar-link[href="#' + id + '"]');
    if (link) link.classList.add('active');
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ── AI CHAT WIDGET ────────────────────────────────────────────────────── */
  var btn     = document.getElementById('ai-btn');
  var modal   = document.getElementById('ai-modal');
  var closeBtn = document.getElementById('ai-close');
  var input   = document.getElementById('ai-input');
  var send    = document.getElementById('ai-send');
  var msgs    = document.getElementById('ai-messages');

  if (!btn) return;

  // Replace with your Gemini API key — never commit a real key to a public repo.
  var API_KEY = '';

  btn.addEventListener('click', function () { modal.classList.add('open'); input && input.focus(); });
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
