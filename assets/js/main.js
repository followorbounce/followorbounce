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
      // Position below button, aligned to its LEFT edge by default.
      // Use right-align (via 'right' property) so it never overflows the viewport.
      sm.style.top   = rect.bottom + 'px';
      sm.style.left  = 'auto';
      sm.style.right = (window.innerWidth - rect.right) + 'px';
      sm.style.display = 'block';
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

  // Proxy URL — your Render.com service URL
  var PROXY_URL = 'https://fob-ai-proxy.onrender.com/chat';

  // Conversation history for multi-turn chat
  var chatHistory = [];

  aibtn.addEventListener('click', function () {
    modal.classList.add('open');
    input && input.focus();
  });
  closeBtn.addEventListener('click', function () { modal.classList.remove('open'); });
  modal.addEventListener('click', function (e) { if (e.target === modal) modal.classList.remove('open'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') modal.classList.remove('open'); });

  async function sendMsg() {
    var text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.disabled = true;
    send.disabled  = true;

    addMsg('user', text);
    chatHistory.push({ role: 'user', text: text });

    // Typing indicator
    var typingEl = addTyping();

    try {
      // Attach JWT if user is connected via Web3
      var headers = { 'Content-Type': 'application/json' };
      var token = window.Web3Auth && window.Web3Auth.getToken();
      if (token) headers['Authorization'] = 'Bearer ' + token;

      var res = await fetch(PROXY_URL, {
        method:  'POST',
        headers: headers,
        body: JSON.stringify({
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
    var p = document.createElement('p');
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

  /* ── CONTACT FORM — fetch submit, no redirect ─────────────────────────── */
  document.querySelectorAll('.contact-form').forEach(function (form) {
    var successId = form.dataset.success;
    var success = successId ? document.getElementById(successId) : form.nextElementSibling;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var email = form.dataset.email;
      var data  = new FormData(form);
      data.append('_captcha', 'false');
      data.append('_subject', 'New message — Follow or Bounce');

      var btn = form.querySelector('.form-submit');
      btn.textContent = 'Sending…';
      btn.disabled = true;

      fetch('https://formsubmit.co/ajax/' + email, {
        method:  'POST',
        headers: { 'Accept': 'application/json' },
        body:    data
      })
      .then(function (res) { return res.json(); })
      .then(function () {
        form.style.display    = 'none';
        success.style.display = 'block';
      })
      .catch(function () {
        btn.textContent = 'Error — try again';
        btn.disabled    = false;
      });
    });
  });

})();
