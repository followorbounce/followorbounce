/**
 * web3-auth.js — Follow or Bounce
 *
 * Zero external dependencies. No ethers.js. No WalletConnect SDK.
 * Uses only window.ethereum (MetaMask / injected wallets) via native JSON-RPC.
 * GitHub Pages CSP compatible — no eval(), no new Function().
 *
 * ─── CONFIGURATION ───────────────────────────────────────────────────────────
 * Edit the two lines below before deploying:
 */
var FOB_API_URL = 'https://fob-render-api.onrender.com'; // ← your Render API URL

// ─────────────────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  /* ── SESSION ─────────────────────────────────────────────────────────────── */
  function saveSession(token, address) {
    localStorage.setItem('fob_token',   token);
    localStorage.setItem('fob_address', address.toLowerCase());
    localStorage.setItem('fob_expiry',  String(Date.now() + 24 * 3600 * 1000));
  }

  function clearSession() {
    ['fob_token', 'fob_address', 'fob_expiry'].forEach(function (k) {
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

  /* ── PUBLIC API ──────────────────────────────────────────────────────────── */
  window.Web3Auth = {
    isConnected: isConnected,
    getToken:    getToken,
    getAddress:  getAddress,
    connect:     connect,
    disconnect:  disconnect,
    requireAuth: requireAuth
  };

  /* ── CONNECT ─────────────────────────────────────────────────────────────── */
  async function connect() {
    var walletType = await showWalletModal();
    if (!walletType) return null;

    try {
      setBtnState('connecting');

      if (walletType === 'metamask') {
        return await connectWithInjectedWallet();
      } else {
        showMobileInstructions();
        return null;
      }

    } catch (err) {
      console.error('[Web3Auth] connect error:', err);
      removeModal('wallet-select-modal');
      // User rejected
      if (err.code === 4001 || err.code === -32603) {
        setBtnState('idle');
      } else {
        setBtnState('error');
        setTimeout(function () { setBtnState('idle'); }, 2500);
      }
      return null;
    }
  }

  /* ── INJECTED WALLET (MetaMask, Coinbase, Brave, etc.) ───────────────────── */
  async function connectWithInjectedWallet() {
    if (!window.ethereum) {
      // Mobile browser — redirect to MetaMask deep link
      var deeplink = 'https://metamask.app.link/dapp/' + window.location.hostname + window.location.pathname;
      window.location.href = deeplink;
      setBtnState('idle');
      return null;
    }

    // 1. Request accounts
    var accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    var address  = accounts[0].toLowerCase();

    // 2. Get nonce from server
    var nonceRes = await fetch(FOB_API_URL + '/auth/nonce?address=' + address);
    if (!nonceRes.ok) throw new Error('Failed to get nonce from server');
    var nonceData = await nonceRes.json();

    // 3. Build message — plain text, no ethers needed to verify
    var message = buildMessage(address, nonceData.nonce);

    // 4. Sign via native eth_sign — no ethers.js required
    setBtnState('signing');
    var signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, address]
    });

    // 5. Verify on server → get JWT
    setBtnState('verifying');
    var verifyRes = await fetch(FOB_API_URL + '/auth/verify', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ address: address, message: message, signature: signature })
    });

    if (!verifyRes.ok) {
      var errBody = await verifyRes.json();
      throw new Error(errBody.error || 'Signature verification failed');
    }

    var verifyData = await verifyRes.json();
    saveSession(verifyData.token, address);

    // 6. Update UI
    removeModal('wallet-select-modal');
    updateUI();
    setBtnState('connected');

    document.dispatchEvent(new CustomEvent('web3:connected', {
      detail: { address: address, token: verifyData.token }
    }));

    return { address: address, token: verifyData.token };
  }

  /* ── MESSAGE FORMAT ──────────────────────────────────────────────────────── */
  function buildMessage(address, nonce) {
    return [
      'Sign in to Follow or Bounce.',
      '',
      'Address: ' + address,
      'Nonce: '   + nonce,
      'Issued: '  + new Date().toISOString()
    ].join('\n');
  }

  /* ── DISCONNECT ──────────────────────────────────────────────────────────── */
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

  /* ── WALLET SELECTION MODAL ──────────────────────────────────────────────── */
  function showWalletModal() {
    return new Promise(function (resolve) {
      removeModal('wallet-select-modal');

      var hasInjected = !!window.ethereum;
      var isMobile    = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      var overlay = createElement('div', { id: 'wallet-select-modal' }, [
        createElement('div', { className: 'wsm-box' }, [
          createElement('div', { className: 'wsm-header' }, [
            createElement('span', {}, 'Connect Wallet'),
            createElement('button', { className: 'wsm-close', type: 'button' }, '✕')
          ]),
          createElement('div', { className: 'wsm-options' }, [
            createElement('button', { className: 'wsm-opt', 'data-wallet': 'metamask', type: 'button' }, [
              createElement('span', { className: 'wsm-icon' }, '🦊'),
              createElement('span', {}, isMobile && !hasInjected
                ? 'MetaMask\n(opens MetaMask app)'
                : 'MetaMask' + (hasInjected ? '' : ' — not detected'))
            ]),
            createElement('button', { className: 'wsm-opt', 'data-wallet': 'other', type: 'button' }, [
              createElement('span', { className: 'wsm-icon' }, '📱'),
              createElement('span', {}, 'Other wallet\n(instructions)')
            ])
          ])
        ])
      ]);

      document.body.appendChild(overlay);

      function pick(type) { removeModal('wallet-select-modal'); resolve(type); }
      function cancel()   { removeModal('wallet-select-modal'); resolve(null);  }

      overlay.querySelector('.wsm-close').addEventListener('click', cancel);
      overlay.addEventListener('click', function (e) { if (e.target === overlay) cancel(); });
      overlay.querySelectorAll('.wsm-opt').forEach(function (btn) {
        btn.addEventListener('click', function () { pick(btn.getAttribute('data-wallet')); });
      });
    });
  }

  /* ── MOBILE INSTRUCTIONS ─────────────────────────────────────────────────── */
  function showMobileInstructions() {
    removeModal('mobile-inst-modal');

    var dappUrl = window.location.href;
    var mmLink  = 'https://metamask.app.link/dapp/' + window.location.hostname + window.location.pathname;

    var overlay = createElement('div', { id: 'mobile-inst-modal' }, [
      createElement('div', { className: 'wsm-box' }, [
        createElement('div', { className: 'wsm-header' }, [
          createElement('span', {}, 'Connect on Mobile'),
          createElement('button', { className: 'wsm-close', type: 'button' }, '✕')
        ]),
        createElement('div', { style: 'padding:1.2rem;font-size:.78rem;line-height:1.7;color:var(--slate)' }, [
          createElement('p', { style: 'margin-bottom:1rem;' },
            'Open your wallet app and use its built-in browser to visit this site:'),
          createElement('div', { style: 'background:#e8e4da;padding:.6rem .8rem;font-family:monospace;font-size:.7rem;word-break:break-all;margin-bottom:1rem;' },
            dappUrl),
          createElement('a', {
            href: mmLink,
            style: 'display:block;padding:.7rem;background:var(--ink);color:var(--paper);text-align:center;text-decoration:none;font-size:.75rem;letter-spacing:.1em;margin-bottom:.8rem;'
          }, 'Open in MetaMask App →'),
          createElement('p', { style: 'font-size:.68rem;color:var(--fog);' },
            'Rainbow, Trust Wallet, Coinbase Wallet — use the DApp browser inside the app.')
        ])
      ])
    ]);

    document.body.appendChild(overlay);
    overlay.querySelector('.wsm-close').addEventListener('click', function () {
      removeModal('mobile-inst-modal');
      setBtnState('idle');
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { removeModal('mobile-inst-modal'); setBtnState('idle'); }
    });
  }

  /* ── PROFILE MODAL ───────────────────────────────────────────────────────── */
  async function openProfileModal() {
    // Toggle — if already open, close it
    if (document.getElementById('profile-modal')) {
      removeModal('profile-modal');
      return;
    }

    var profile = {};
    try {
      var res = await fetch(FOB_API_URL + '/me', {
        headers: { 'Authorization': 'Bearer ' + getToken() }
      });
      if (res.ok) profile = await res.json();
    } catch (e) { /* profile stays empty */ }

    // Get ETH balance via native eth_getBalance — no ethers.js
    var balance = '—';
    try {
      if (window.ethereum) {
        var hex = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [getAddress(), 'latest']
        });
        var eth = parseInt(hex, 16) / 1e18;
        balance = eth.toFixed(4) + ' ETH';
      }
    } catch (e) { /* balance stays — */ }

    var overlay = createElement('div', { id: 'profile-modal' }, [
      createElement('div', { className: 'pm-box' }, [
        createElement('div', { className: 'pm-header' }, [
          createElement('span', {}, 'My Profile'),
          createElement('button', { className: 'pm-close', type: 'button' }, '✕')
        ]),
        createElement('div', { className: 'pm-wallet' }, [
          createElement('div', { className: 'pm-address' }, getAddress()),
          createElement('div', { className: 'pm-balance' }, balance)
        ]),
        buildProfileForm(profile),
        createElement('div', { className: 'pm-footer' }, [
          createElement('a', { href: '#', id: 'pm-disconnect' }, 'Disconnect wallet')
        ])
      ])
    ]);

    document.body.appendChild(overlay);

    overlay.querySelector('.pm-close').addEventListener('click', function () { removeModal('profile-modal'); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) removeModal('profile-modal'); });
    overlay.querySelector('#pm-disconnect').addEventListener('click', function (e) {
      e.preventDefault();
      removeModal('profile-modal');
      disconnect();
    });

    overlay.querySelector('#profile-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var statusEl = overlay.querySelector('#pm-status');
      var saveBtn  = overlay.querySelector('.pm-save');
      saveBtn.disabled    = true;
      statusEl.textContent = 'Saving…';

      try {
        var patchRes = await fetch(FOB_API_URL + '/me', {
          method:  'PATCH',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': 'Bearer ' + getToken()
          },
          body: JSON.stringify({
            name:     overlay.querySelector('[name="name"]').value.trim(),
            nickname: overlay.querySelector('[name="nickname"]').value.trim(),
            email:    overlay.querySelector('[name="email"]').value.trim(),
            bio:      overlay.querySelector('[name="bio"]').value.trim()
          })
        });
        statusEl.textContent = patchRes.ok ? '✓ Saved' : '✕ Error saving';
        statusEl.style.color = patchRes.ok ? '#1a7a4a' : '#c0390b';
      } catch (e2) {
        statusEl.textContent = '✕ Connection error';
        statusEl.style.color = '#c0390b';
      }

      saveBtn.disabled = false;
      setTimeout(function () { statusEl.textContent = ''; }, 3000);
    });
  }

  function buildProfileForm(profile) {
    var form = createElement('form', { className: 'pm-form', id: 'profile-form' }, [
      buildField('name',     'Name',     profile.name     || '', 'text'),
      buildField('nickname', 'Nickname', profile.nickname || '', 'text'),
      buildField('email',    'Email',    profile.email    || '', 'email'),
      buildTextarea('bio', 'Bio', profile.bio || ''),
      createElement('div', { className: 'pm-status', id: 'pm-status' }, ''),
      createElement('button', { className: 'pm-save', type: 'submit' }, 'Save Profile')
    ]);
    return form;
  }

  function buildField(name, label, value, type) {
    var lbl   = createElement('label', { className: 'pm-label' }, label);
    var input = createElement('input', {
      className:    'pm-input',
      type:         type,
      name:         name,
      value:        value,
      autocomplete: 'off'
    });
    lbl.appendChild(input);
    return lbl;
  }

  function buildTextarea(name, label, value) {
    var lbl  = createElement('label', { className: 'pm-label' }, label);
    var ta   = createElement('textarea', {
      className:    'pm-input',
      name:         name,
      rows:         '3',
      autocomplete: 'off'
    }, value);
    lbl.appendChild(ta);
    return lbl;
  }

  /* ── UI ──────────────────────────────────────────────────────────────────── */
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
    btn.disabled    = ['connecting', 'signing', 'verifying'].includes(state);
  }

  function updateUI() {
    var btn     = document.getElementById('web3-connect-btn');
    var discEl  = document.getElementById('web3-disconnect');
    var gated   = document.querySelectorAll('[data-web3-gate]');
    var locked  = document.querySelectorAll('[data-web3-locked]');
    var addrEls = document.querySelectorAll('[data-web3-address]');

    var connected = isConnected();
    var address   = getAddress();

    if (btn) {
      btn.textContent = connected ? shortAddr(address) : 'Connect Wallet';
      btn.disabled    = false;
      btn.classList.toggle('is-connected', connected);
    }
    if (discEl) discEl.style.display = connected ? 'inline' : 'none';

    addrEls.forEach(function (el) { el.textContent = connected ? (address || '') : ''; });
    gated.forEach(function (el)   { el.style.display = connected ? '' : 'none'; });
    locked.forEach(function (el)  { el.style.display = connected ? 'none' : ''; });
  }

  function shortAddr(addr) {
    return addr ? addr.slice(0, 6) + '…' + addr.slice(-4) : '';
  }

  /* ── DOM HELPERS ─────────────────────────────────────────────────────────── */
  function createElement(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'className') {
          el.className = attrs[k];
        } else if (k === 'style' && typeof attrs[k] === 'string') {
          el.style.cssText = attrs[k];
        } else {
          el.setAttribute(k === 'htmlFor' ? 'for' : k, attrs[k]);
        }
      });
    }
    if (children) {
      if (typeof children === 'string') {
        el.textContent = children;
      } else if (Array.isArray(children)) {
        children.forEach(function (child) {
          if (!child) return;
          if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
          } else {
            el.appendChild(child);
          }
        });
      } else {
        el.appendChild(children);
      }
    }
    return el;
  }

  function removeModal(id) {
    var el = document.getElementById(id);
    if (el) el.remove();
  }

  /* ── INIT ────────────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    updateUI();

    var btn = document.getElementById('web3-connect-btn');
    if (btn) {
      btn.addEventListener('click', function () {
        if (isConnected()) {
          openProfileModal();
        } else {
          connect().catch(function (err) { console.error('[Web3Auth]', err); });
        }
      });
    }

    var discEl = document.getElementById('web3-disconnect');
    if (discEl) {
      discEl.addEventListener('click', function (e) {
        e.preventDefault();
        disconnect();
      });
    }
  });

})();
