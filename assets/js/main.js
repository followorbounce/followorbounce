/**
 * main.js — Follow or Bounce
 * Handles: nav dropdowns, card clicks, AI chat widget
 *
 * ─── CONFIGURATION ───────────────────────────────────────────────────────────
 * AI Chat proxy URL — set to your Render service URL:
 */
var FOB_PROXY_URL = 'https://fob-render-api.onrender.com'; // ← your Render URL
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  /* ── DROPDOWN SUBMENUS ───────────────────────────────────────────────────── */
  var wrappers = Array.from(document.querySelectorAll('.has-submenu'));

  /* Move submenus to <body> to escape overflow:auto clipping on mobile */
  var submenus = wrappers.map(function (wrapper) {
    var sm = wrapper.querySelector('.submenu');
    if (sm) document.body.appendChild(sm);
    return sm;
  });

  function closeAllSubmenus() {
    wrappers.forEach(function (w, i) {
      w.classList.remove('open');
      var btn = w.querySelector('[data-submenu-toggle]');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      if (submenus[i]) submenus[i].style.display = 'none';
    });
  }

  wrappers.forEach(function (wrapper, i) {
    var btn = wrapper.querySelector('[data-submenu-toggle]');
    var sm  = submenus[i];
    if (!btn || !sm) return;

    /* Style submenu — position:fixed so it escapes any overflow container */
    sm.style.position   = 'fixed';
    sm.style.zIndex     = '9999';
    sm.style.display    = 'none';
    sm.style.background = 'var(--paper)';
    sm.style.border     = '1px solid #0d0c0a';
    sm.style.listStyle  = 'none';
    sm.style.minWidth   = '180px';

    function open() {
      closeAllSubmenus();
      var rect     = btn.getBoundingClientRect();
      sm.style.top     = rect.bottom + 'px';
      sm.style.left    = 'auto';
      sm.style.right   = (window.innerWidth - rect.right) + 'px';
      sm.style.display = 'block';
      wrapper.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }

    function close() {
      sm.style.display = 'none';
      wrapper.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }

    function toggle(e) {
      e.stopPropagation();
      e.preventDefault();
      wrapper.classList.contains('open') ? close() : open();
    }

    btn.addEventListener('touchstart', toggle, { passive: false });
    btn.addEventListener('click', toggle);
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(e); }
      if (e.key === 'Escape') close();
    });

    sm.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('touchstart', function () {
        setTimeout(close, 150);
      }, { passive: true });
    });
  });

  document.addEventListener('touchstart', function (e) {
    var inWrapper = wrappers.some(function (w) { return w.contains(e.target); });
    var inSubmenu = submenus.some(function (sm) { return sm && sm.contains(e.target); });
    if (!inWrapper && !inSubmenu) closeAllSubmenus();
  }, { passive: true });

  document.addEventListener('click', function (e) {
    var inWrapper = wrappers.some(function (w) { return w.contains(e.target); });
    var inSubmenu = submenus.some(function (sm) { return sm && sm.contains(e.target); });
    if (!inWrapper && !inSubmenu) closeAllSubmenus();
  });

  /* ── AI CHAT ─────────────────────────────────────────────────────────────── */
  var aibtn    = document.getElementById('ai-btn');
  var modal    = document.getElementById('ai-modal');
  var closeBtn = document.getElementById('ai-close');
  var input    = document.getElementById('ai-input');
  var send     = document.getElementById('ai-send');
  var msgs     = document.getElementById('ai-messages');

  var chatHistory = [];

  if (aibtn && modal) {
    aibtn.addEventListener('click', function () {
      modal.classList.add('open');
      if (input) input.focus();
    });
    closeBtn.addEventListener('click', function () { modal.classList.remove('open'); });
    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.classList.remove('open');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') modal.classList.remove('open');
    });

    async function sendMsg() {
      var text = input.value.trim();
      if (!text) return;

      input.value   = '';
      input.disabled = true;
      send.disabled  = true;

      addMsg('user', text);
      chatHistory.push({ role: 'user', text: text });

      var typingEl = addTyping();

      try {
        var headers = { 'Content-Type': 'application/json' };
        /* Attach JWT if user is authenticated via Web3 */
        var token = window.Web3Auth && window.Web3Auth.getToken();
        if (token) headers['Authorization'] = 'Bearer ' + token;

        var res = await fetch(FOB_PROXY_URL + '/chat', {
          method:  'POST',
          headers: headers,
          body:    JSON.stringify({
            message: text,
            history: chatHistory.slice(-10)
          })
        });

        typingEl.remove();

        if (!res.ok) throw new Error('Server error ' + res.status);

        var data  = await res.json();
        var reply = data.reply || 'No response.';

        addMsg('ai', reply);
        chatHistory.push({ role: 'ai', text: reply });

      } catch (err) {
        typingEl.remove();
        addMsg('error', 'Connection error. Please try again.');
        console.error('[AI chat]', err);
      }

      input.disabled = false;
      send.disabled  = false;
      input.focus();
    }

    function addMsg(role, text) {
      var p     = document.createElement('p');
      var label = role === 'user' ? 'You' : role === 'ai' ? 'AI' : '!';
      p.innerHTML = '<b>' + label + ':</b> ' + text.replace(/</g, '&lt;');
      if (role === 'error') p.style.color = '#c0390b';
      msgs.appendChild(p);
      msgs.scrollTop = msgs.scrollHeight;
      return p;
    }

    function addTyping() {
      var p = document.createElement('p');
      p.innerHTML = '<b>AI:</b> <span class="typing">···</span>';
      msgs.appendChild(p);
      msgs.scrollTop = msgs.scrollHeight;
      return p;
    }

    send.addEventListener('click', sendMsg);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); sendMsg(); }
    });
  }

  /* ── CONTACT FORMS ───────────────────────────────────────────────────────── */
  document.querySelectorAll('.contact-form').forEach(function (form) {
    var successId = form.dataset.success;
    var success   = successId
      ? document.getElementById(successId)
      : form.nextElementSibling;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var email = form.dataset.email;
      var data  = new FormData(form);
      data.append('_captcha', 'false');
      data.append('_subject', 'New message — Follow or Bounce');

      var btn = form.querySelector('.form-submit');
      btn.textContent = 'Sending…';
      btn.disabled    = true;

      fetch('https://formsubmit.co/ajax/' + email, {
        method:  'POST',
        headers: { 'Accept': 'application/json' },
        body:    data
      })
        .then(function (res) { return res.json(); })
        .then(function () {
          form.style.display    = 'none';
          if (success) success.style.display = 'block';
        })
        .catch(function () {
          btn.textContent = 'Error — try again';
          btn.disabled    = false;
        });
    });
  });

})();
