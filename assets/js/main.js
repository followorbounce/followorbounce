(function () {
  'use strict';

  /* ── DROPDOWN SUBMENUS ─────────────────────────────────────────────────── */
  document.querySelectorAll('.has-submenu').forEach(function (wrapper) {
    var btn = wrapper.querySelector('.menu-bar-btn');
    var links = wrapper.querySelectorAll('.submenu a');

    function open() {
      wrapper.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      links.forEach(function (l) { l.setAttribute('tabindex', '0'); });
    }
    function close() {
      wrapper.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      links.forEach(function (l) { l.setAttribute('tabindex', '-1'); });
    }

    btn.addEventListener('click', function () {
      wrapper.classList.contains('open') ? close() : open();
    });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
    wrapper.addEventListener('focusout', function (e) {
      if (!wrapper.contains(e.relatedTarget)) close();
    });
    document.addEventListener('click', function (e) {
      if (!wrapper.contains(e.target)) close();
    });
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
