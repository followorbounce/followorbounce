(function () {
  'use strict';

  /* ── DROPDOWN SUBMENUS ─────────────────────────────────────────────────── */
  //
  // iOS SAFARI ROOT CAUSE ANALYSIS:
  //
  // Problem 1 — overflow clipping:
  //   .menu-bar has overflow-x:auto on mobile. Per CSS spec, setting
  //   overflow-x to anything other than 'visible' forces overflow-y to
  //   'hidden' as well. Safari enforces this strictly, clipping any child
  //   .submenu that overflows the menu bar vertically.
  //   FIX: Portal each .submenu to <body> (already done in prior version).
  //
  // Problem 2 — touchstart closes menu before click fires (PRIMARY BUG):
  //   The old code attached a 'touchstart' listener to each submenu <a>
  //   that called closeIt() after 150 ms. On iOS the tap event sequence is:
  //   touchstart → touchend → (300ms delay) → synthesised click.
  //   closeIt() hid the submenu within 150 ms, removing the element before
  //   iOS dispatched the synthesised click, so navigation never fired.
  //   FIX: Remove touchstart/touchend listeners from submenu links entirely.
  //   Let their native href navigate. Close on document-level outside-tap
  //   only, and use touchend (not touchstart) on the button.
  //
  // Problem 3 — document touchstart intercepted link taps:
  //   Document touchstart ran before the link's own handler. We guard this
  //   with sm.contains(e.target) which returns true for taps inside the
  //   portalled submenu, preventing premature closeAll().
  //
  // Problem 4 — z-index below fixed header on Safari:
  //   Fixed header z-index:100, AI button z-index:9999. Submenus must be
  //   above both. Set z-index:10001.
  //
  // Problem 5 — pointer-events cached as none after display toggle:
  //   Safari sometimes caches pointer-events from a previous paint frame.
  //   Explicitly set pointer-events:auto when showing the submenu.

  var wrappers = Array.from(document.querySelectorAll('.has-submenu'));

  // Portal each submenu to <body> to escape overflow-y:hidden clipping.
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
      if (submenus[i]) {
        submenus[i].style.display       = 'none';
        submenus[i].style.pointerEvents = 'none';
      }
    });
  }

  wrappers.forEach(function (wrapper, i) {
    var btn = wrapper.querySelector('.menu-bar-btn');
    var sm  = submenus[i];
    if (!btn || !sm) return;

    // Base inline styles for portalled submenu.
    sm.style.position      = 'fixed';
    sm.style.zIndex        = '10001';
    sm.style.display       = 'none';
    sm.style.pointerEvents = 'none';
    sm.style.background    = 'var(--paper)';
    sm.style.border        = '1px solid #0d0c0a';
    sm.style.listStyle     = 'none';
    sm.style.minWidth      = '180px';
    sm.style.margin        = '0';
    sm.style.padding       = '0';

    function openIt() {
      closeAll();
      var rect = btn.getBoundingClientRect();
      sm.style.top           = rect.bottom + 'px';
      sm.style.left          = 'auto';
      sm.style.right         = (window.innerWidth - rect.right) + 'px';
      sm.style.display       = 'block';
      sm.style.pointerEvents = 'auto';
      wrapper.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }

    function closeIt() {
      sm.style.display       = 'none';
      sm.style.pointerEvents = 'none';
      wrapper.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }

    // Use touchend on the BUTTON so we can preventDefault to stop the
    // synthesised click from double-toggling, while still allowing the
    // submenu links to use their own native click/touchend for navigation.
    btn.addEventListener('touchend', function (e) {
      e.preventDefault();
      e.stopPropagation();
      wrapper.classList.contains('open') ? closeIt() : openIt();
    }, { passive: false });

    // Desktop click handler.
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      wrapper.classList.contains('open') ? closeIt() : openIt();
    });

    btn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        wrapper.classList.contains('open') ? closeIt() : openIt();
      }
      if (e.key === 'Escape') closeIt();
    });

    // FIX: Do NOT attach touchstart/touchend to submenu links.
    // We rely on their native href + click for navigation.
    // We only make sure cursor:pointer is set so iOS recognises them as
    // interactive (required for elements injected after DOM parse).
    sm.querySelectorAll('a').forEach(function (a) {
      a.style.cursor = 'pointer';
    });
  });

  // Close menu when user taps/clicks outside any nav wrapper or submenu.
  function handleOutsideTap(e) {
    var inWrapper = wrappers.some(function (w) { return w.contains(e.target); });
    var inSubmenu = submenus.some(function (sm) { return sm && sm.contains(e.target); });
    if (!inWrapper && !inSubmenu) closeAll();
  }

  document.addEventListener('touchstart', handleOutsideTap, { passive: true });
  document.addEventListener('click',      handleOutsideTap);

  /* ── AI CHAT WIDGET ────────────────────────────────────────────────────── */
  var aibtn    = document.getElementById('ai-btn');
  var modal    = document.getElementById('ai-modal');
  var closeBtn = document.getElementById('ai-close');
  var input    = document.getElementById('ai-input');
  var send     = document.getElementById('ai-send');
  var msgs     = document.getElementById('ai-messages');

  if (!aibtn || !modal || !closeBtn || !input || !send || !msgs) {
    console.warn('[FOB] AI chat elements not found — skipping AI widget init.');
  } else {
    var PROXY_URL   = 'https://fob-render-api.onrender.com/chat';
    var chatHistory = [];

    function openModal() {
      modal.classList.add('open');
      modal.removeAttribute('aria-hidden');
      input.focus();
    }

    function closeModal() {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }

    aibtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

    async function sendMsg() {
      var text = input.value.trim();
      if (!text) return;

      input.value    = '';
      input.disabled = true;
      send.disabled  = true;

      addMsg('user', text);
      chatHistory.push({ role: 'user', text: text });

      var typingEl = addTyping();

      try {
        var res = await fetch(PROXY_URL, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, history: chatHistory.slice(-10) })
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
        console.error('[FOB AI chat]', err);
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

  /* ── CONTACT FORM — fetch submit, no redirect ─────────────────────────── */
  document.querySelectorAll('.contact-form').forEach(function (form) {
    var successId = form.dataset.success;
    var success   = successId
      ? document.getElementById(successId)
      : form.nextElementSibling;

    if (!success) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var email = form.dataset.email;
      if (!email) { console.warn('[FOB] contact-form missing data-email'); return; }

      var data = new FormData(form);
      data.append('_captcha', 'false');
      data.append('_subject', 'New message — Follow or Bounce');

      var btn = form.querySelector('.form-submit');
      btn.textContent = 'Sending\u2026';
      btn.disabled    = true;

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
        btn.textContent = 'Error \u2014 try again';
        btn.disabled    = false;
      });
    });
  });

})();
