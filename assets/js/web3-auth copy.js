(function () {
  'use strict';

  var API = 'https://fob-render-api.onrender.com';

  /* ── SESSION ───────────────────────────────────────────────────────────── */
  function saveSession(token, address) {
    localStorage.setItem('fob_token',   token);
    localStorage.setItem('fob_address', address);
    localStorage.setItem('fob_expiry',  String(Date.now() + 24 * 3600 * 1000));
  }

  function clearSession() {
    ['fob_token','fob_address','fob_expiry'].forEach(function(k) {
      localStorage.removeItem(k);
    });
  }

  function isConnected() {
    var token  = localStorage.getItem('fob_token');
    var expiry = parseInt(localStorage.getItem('fob_expiry') || '0', 10);
    return !!token && Date.now() < expiry;
  }

  function getToken()   { return isConnected() ? localStorage.getItem('fob_token')   : null; }
  function getAddress() { return isConnected() ? localStorage.getItem('fob_address') : null; }

  window.Web3Auth = {
    isConnected: isConnected,
    getToken:    getToken,
    getAddress:  getAddress,
    connect:     connect,
    disconnect:  disconnect,
    requireAuth: requireAuth
  };

  /* ── DEVICE DETECTION ──────────────────────────────────────────────────── */
  var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  /* ── CONNECT ───────────────────────────────────────────────────────────── */
  async function connect() {
    var walletType = await showWalletModal();
    if (!walletType) return null;

    try {
      setBtnState('connecting');

      var address, signature, message;

      if (walletType === 'metamask') {
        /* ── Desktop MetaMask or in-app browser ── */
        if (!window.ethereum) {
          // Redirect into MetaMask mobile app via deep link
          var href = 'https://metamask.app.link/dapp/' + window.location.host + window.location.pathname;
          window.location.href = href;
          setBtnState('idle');
          return null;
        }

        var accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        address = accounts[0].toLowerCase();

        var nonce   = await getNonce(address);
        message     = buildMessage(nonce);
        setBtnState('signing');

        // Use eth_sign via raw request — no ethers.js needed, no eval
        signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, address]
        });

      } else {
        /* ── WalletConnect deep link (no SDK, no eval) ── */
        // For mobile: open wallet app via universal link
        // User scans QR or taps deep link, signs in wallet app
        var nonce2  = await getNonce('');
        message     = buildMessage(nonce2);

        // Store message so wallet callback can retrieve it
        sessionStorage.setItem('fob_pending_message', message);

        // Open WalletConnect web interface — no SDK required
        var wcUrl = 'https://walletconnect.com/';
        window.open(wcUrl, '_blank');

        setBtnState('idle');
        showManualSignModal(message);
        return null;
      }

      // Verify on server
      setBtnState('verifying');
      var token = await verifySignature(address, message, signature);
      if (!token) throw new Error('Verification failed');

      saveSession(token, address);

      var wsm = document.getElementById('wallet-select-modal');
      if (wsm) wsm.remove();

      updateUI();
      setBtnState('connected');
      document.dispatchEvent(new CustomEvent('web3:connected', {
        detail: { address: address, token: token }
      }));

      return { address: address, token: token };

    } catch (err) {
      console.error('[Web3Auth]', err);
      var wsm2 = document.getElementById('wallet-select-modal');
      if (wsm2) wsm2.remove();
      if (err.code === 4001) {
        setBtnState('idle');
      } else {
        setBtnState('error');
        setTimeout(function() { setBtnState('idle'); }, 2000);
      }
      return null;
    }
  }

  /* ── SERVER CALLS ──────────────────────────────────────────────────────── */
  async function getNonce(address) {
    var url = API + '/auth/nonce' + (address ? '?address=' + address : '');
    var res  = await fetch(url);
    if (!res.ok) throw new Error('Failed to get nonce');
    var data = await res.json();
    return data.nonce;
  }

  function buildMessage(nonce) {
    return 'Login to Follow or Bounce.\nNonce: ' + nonce + '\nIssued: ' + new Date().toISOString();
  }

  async function verifySignature(address, message, signature) {
    var res = await fetch(API + '/auth/verify', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ address: address, message: message, signature: signature })
    });
    if (!res.ok) return null;
    var data = await res.json();
    return data.token || null;
  }

  /* ── MANUAL SIGN MODAL (mobile fallback) ───────────────────────────────── */
  // For mobile browsers without injected wallet:
  // User copies message, signs in their wallet app, pastes signature back
  function showManualSignModal(message) {
    var existing = document.getElementById('manual-sign-modal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id  = 'manual-sign-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:99999;padding:1rem;';
    modal.innerHTML =
      '<div style="background:var(--paper,#f4f0e6);border:1px solid var(--ink,#0d0c0a);width:100%;max-width:420px;max-height:90vh;overflow-y:auto;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:1rem 1.2rem;border-bottom:1px solid var(--ink,#0d0c0a);">' +
          '<span style="font-family:Georgia,serif;font-size:1.1rem;">Sign in with wallet</span>' +
          '<button id="msm-close" style="background:none;border:none;cursor:pointer;font-size:1rem;color:#888;">✕</button>' +
        '</div>' +
        '<div style="padding:1.2rem;">' +
          '<p style="font-size:.75rem;color:var(--slate,#3a3d44);margin-bottom:1rem;line-height:1.6;">Open your wallet app, sign the message below, then paste the signature here.</p>' +
          '<label style="font-size:.65rem;letter-spacing:.15em;text-transform:uppercase;color:#888;display:block;margin-bottom:.3rem;">Message to sign</label>' +
          '<textarea id="msm-message" readonly rows="4" style="width:100%;padding:.6rem;border:1px solid var(--ink,#0d0c0a);background:#e8e4da;font-family:monospace;font-size:.7rem;resize:none;margin-bottom:.8rem;">' + message + '</textarea>' +
          '<button id="msm-copy" style="width:100%;padding:.6rem;border:1px solid var(--ink,#0d0c0a);background:var(--ink,#0d0c0a);color:var(--paper,#f4f0e6);font-family:monospace;font-size:.75rem;cursor:pointer;margin-bottom:1rem;">Copy message</button>' +
          '<label style="font-size:.65rem;letter-spacing:.15em;text-transform:uppercase;color:#888;display:block;margin-bottom:.3rem;">Wallet address (0x...)</label>' +
          '<input id="msm-address" type="text" placeholder="0x..." style="width:100%;padding:.6rem;border:1px solid var(--ink,#0d0c0a);background:transparent;font-family:monospace;font-size:.75rem;margin-bottom:.8rem;">' +
          '<label style="font-size:.65rem;letter-spacing:.15em;text-transform:uppercase;color:#888;display:block;margin-bottom:.3rem;">Signature (paste from wallet)</label>' +
          '<textarea id="msm-sig" rows="3" placeholder="0x..." style="width:100%;padding:.6rem;border:1px solid var(--ink,#0d0c0a);background:transparent;font-family:monospace;font-size:.7rem;resize:none;margin-bottom:.8rem;"></textarea>' +
          '<div id="msm-error" style="color:#c0390b;font-size:.75rem;margin-bottom:.5rem;display:none;"></div>' +
          '<button id="msm-submit" style="width:100%;padding:.7rem;border:1px solid var(--ink,#0d0c0a);background:var(--ink,#0d0c0a);color:var(--paper,#f4f0e6);font-family:monospace;font-size:.75rem;cursor:pointer;">Verify & Login</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    document.getElementById('msm-close').onclick = function() { modal.remove(); setBtnState('idle'); };
    modal.onclick = function(e) { if (e.target === modal) { modal.remove(); setBtnState('idle'); } };

    document.getElementById('msm-copy').onclick = function() {
      navigator.clipboard.writeText(message).then(function() {
        document.getElementById('msm-copy').textContent = 'Copied ✓';
        setTimeout(function() {
          document.getElementById('msm-copy').textContent = 'Copy message';
        }, 2000);
      });
    };

    document.getElementById('msm-submit').onclick = async function() {
      var addr = (document.getElementById('msm-address').value || '').trim().toLowerCase();
      var sig  = (document.getElementById('msm-sig').value || '').trim();
      var errEl = document.getElementById('msm-error');

      if (!addr.startsWith('0x') || addr.length !== 42) {
        errEl.textContent = 'Enter a valid wallet address (0x...)';
        errEl.style.display = 'block';
        return;
      }
      if (!sig.startsWith('0x')) {
        errEl.textContent = 'Paste the signature from your wallet app';
        errEl.style.display = 'block';
        return;
      }

      errEl.style.display = 'none';
      document.getElementById('msm-submit').textContent = 'Verifying…';
      document.getElementById('msm-submit').disabled = true;

      try {
        var token = await verifySignature(addr, message, sig);
        if (!token) throw new Error('Invalid signature');

        saveSession(token, addr);
        modal.remove();
        updateUI();
        setBtnState('connected');
        document.dispatchEvent(new CustomEvent('web3:connected', {
          detail: { address: addr, token: token }
        }));
      } catch(e) {
        errEl.textContent = 'Signature invalid. Make sure you signed the exact message above.';
        errEl.style.display = 'block';
        document.getElementById('msm-submit').textContent = 'Verify & Login';
        document.getElementById('msm-submit').disabled = false;
      }
    };
  }

  /* ── DISCONNECT ────────────────────────────────────────────────────────── */
  function disconnect() {
    clearSession();
    updateUI();
    document.dispatchEvent(new CustomEvent('web3:disconnected'));
  }

  function requireAuth() {
    if (!isConnected()) {
      var btn = document.getElementById('web3-connect-btn');
      if (btn) btn.click();
    }
  }

  /* ── WALLET SELECTION MODAL ────────────────────────────────────────────── */
  function showWalletModal() {
    return new Promise(function(resolve) {
      var existing = document.getElementById('wallet-select-modal');
      if (existing) existing.remove();

      var hasInjected = !!window.ethereum;

      var overlay = document.createElement('div');
      overlay.id  = 'wallet-select-modal';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:99999;';
      overlay.innerHTML =
        '<div class="wsm-box">' +
          '<div class="wsm-header">' +
            '<span>Connect Wallet</span>' +
            '<button class="wsm-close">✕</button>' +
          '</div>' +
          '<div class="wsm-options">' +
            '<button class="wsm-opt" data-wallet="metamask">' +
              '<span class="wsm-icon">🦊</span>' +
              '<span>MetaMask' + (isMobile && !hasInjected ? '<br><small>Opens MetaMask app</small>' : '') + '</span>' +
            '</button>' +
            '<button class="wsm-opt" data-wallet="walletconnect">' +
              '<span class="wsm-icon">✍️</span>' +
              '<span>Other wallet<br><small>Sign manually in any wallet</small></span>' +
            '</button>' +
          '</div>' +
        '</div>';

      document.body.appendChild(overlay);

      function pick(type) { overlay.remove(); resolve(type); }

      overlay.querySelector('.wsm-close').onclick = function() { overlay.remove(); resolve(null); };
      overlay.onclick = function(e) { if (e.target === overlay) { overlay.remove(); resolve(null); } };

      overlay.querySelectorAll('.wsm-opt').forEach(function(btn) {
        btn.onclick = function() { pick(btn.dataset.wallet); };
        btn.ontouchend = function(e) { e.preventDefault(); pick(btn.dataset.wallet); };
      });
    });
  }

  /* ── UI ────────────────────────────────────────────────────────────────── */
  function setBtnState(state) {
    var btn = document.getElementById('web3-connect-btn');
    if (!btn) return;
    var labels = {
      idle:       'Connect Wallet',
      connecting: 'Connecting…',
      signing:    'Sign in wallet…',
      verifying:  'Verifying…',
      connected:  shortAddr(getAddress()),
      error:      'Try again'
    };
    btn.textContent = labels[state] || 'Connect Wallet';
    btn.disabled    = ['connecting','signing','verifying'].includes(state);
  }

  function updateUI() {
    var btn     = document.getElementById('web3-connect-btn');
    var discEl  = document.getElementById('web3-disconnect');
    var addrEls = document.querySelectorAll('[data-web3-address]');
    var gated   = document.querySelectorAll('[data-web3-gate]');
    var locked  = document.querySelectorAll('[data-web3-locked]');

    var connected = isConnected();
    var address   = getAddress();

    if (btn) {
      btn.textContent = connected ? shortAddr(address) : 'Connect Wallet';
      btn.classList.toggle('is-connected', connected);
      btn.disabled = false;
    }
    if (discEl) discEl.style.display = connected ? 'inline' : 'none';
    addrEls.forEach(function(el) { el.textContent = connected ? address : ''; });
    gated.forEach(function(el)   { el.style.display = connected ? '' : 'none'; });
    locked.forEach(function(el)  { el.style.display = connected ? 'none' : ''; });
  }

  function shortAddr(addr) {
    return addr ? addr.slice(0,6) + '…' + addr.slice(-4) : '';
  }

  /* ── PROFILE MODAL ─────────────────────────────────────────────────────── */
  async function openProfileModal() {
    var existing = document.getElementById('profile-modal');
    if (existing) { existing.remove(); return; }

    var profile = {};
    try {
      var res = await fetch(API + '/me', {
        headers: { 'Authorization': 'Bearer ' + getToken() }
      });
      if (res.ok) profile = await res.json();
    } catch(e) {}

    var balance = '—';
    try {
      if (window.ethereum) {
        var balRes = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [getAddress(), 'latest']
        });
        var wei = parseInt(balRes, 16);
        balance = (wei / 1e18).toFixed(4) + ' ETH';
      }
    } catch(e) {}

    var modal = document.createElement('div');
    modal.id  = 'profile-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:99999;padding:1rem;';
    modal.innerHTML =
      '<div class="pm-box">' +
        '<div class="pm-header"><span>My Profile</span><button class="pm-close">✕</button></div>' +
        '<div class="pm-wallet">' +
          '<div class="pm-address">' + (getAddress() || '') + '</div>' +
          '<div class="pm-balance">' + balance + '</div>' +
        '</div>' +
        '<form class="pm-form" id="profile-form">' +
          mkField('name',     'Name',     profile.name) +
          mkField('nickname', 'Nickname', profile.nickname) +
          mkField('email',    'Email',    profile.email, 'email') +
          mkField('bio',      'Bio',      profile.bio, 'text', true) +
          '<div class="pm-status" id="pm-status"></div>' +
          '<button class="pm-save" type="submit">Save Profile</button>' +
        '</form>' +
        '<div class="pm-footer"><a href="#" id="pm-disconnect">Disconnect wallet</a></div>' +
      '</div>';

    document.body.appendChild(modal);

    modal.querySelector('.pm-close').onclick = function() { modal.remove(); };
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
    modal.querySelector('#pm-disconnect').onclick = function(e) {
      e.preventDefault(); modal.remove(); disconnect();
    };

    modal.querySelector('#profile-form').onsubmit = async function(e) {
      e.preventDefault();
      var statusEl = modal.querySelector('#pm-status');
      var saveBtn  = modal.querySelector('.pm-save');
      saveBtn.disabled = true;
      statusEl.textContent = 'Saving…';
      try {
        var patchRes = await fetch(API + '/me', {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
          body: JSON.stringify({
            name:     modal.querySelector('[name="name"]').value,
            nickname: modal.querySelector('[name="nickname"]').value,
            email:    modal.querySelector('[name="email"]').value,
            bio:      modal.querySelector('[name="bio"]').value
          })
        });
        statusEl.textContent = patchRes.ok ? '✓ Saved' : '✕ Error saving';
        statusEl.style.color = patchRes.ok ? '#1a7a4a' : '#c0390b';
      } catch(e2) {
        statusEl.textContent = '✕ Connection error';
        statusEl.style.color = '#c0390b';
      }
      saveBtn.disabled = false;
      setTimeout(function() { statusEl.textContent = ''; }, 3000);
    };
  }

  function mkField(name, label, value, type, isTextarea) {
    value = esc(value || '');
    if (isTextarea) {
      return '<label class="pm-label">' + label +
        '<textarea class="pm-input" name="' + name + '" rows="3" autocomplete="off">' + value + '</textarea></label>';
    }
    return '<label class="pm-label">' + label +
      '<input class="pm-input" type="' + (type||'text') + '" name="' + name + '" value="' + value + '" autocomplete="off"></label>';
  }

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── INIT ──────────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function() {
    updateUI();

    var btn = document.getElementById('web3-connect-btn');
    if (btn) btn.addEventListener('click', function() {
      if (isConnected()) { openProfileModal(); } else { connect().catch(console.error); }
    });

    var discEl = document.getElementById('web3-disconnect');
    if (discEl) discEl.addEventListener('click', function(e) {
      e.preventDefault(); disconnect();
    });
  });

})();
