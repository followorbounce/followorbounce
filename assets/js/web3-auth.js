/* ─────────────────────────────────────────────────────────────────────────────
   web3-auth.js — Follow or Bounce
   Web3 Auth: MetaMask + WalletConnect v2
   Mobile-safe, SIWE-style signing, JWT session
───────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var API = 'https://fob-render-api.onrender.com';

  /* ── SESSION ───────────────────────────────────────────────────────────── */
  function saveSession(token, address) {
    localStorage.setItem('fob_token',   token);
    localStorage.setItem('fob_address', address);
    localStorage.setItem('fob_expiry',  Date.now() + 24 * 3600 * 1000);
  }

  function clearSession() {
    ['fob_token','fob_address','fob_expiry'].forEach(k => localStorage.removeItem(k));
  }

  function isConnected() {
    var expiry = localStorage.getItem('fob_expiry');
    return !!localStorage.getItem('fob_token') && Date.now() < parseInt(expiry || 0);
  }

  function getToken()   { return isConnected() ? localStorage.getItem('fob_token')   : null; }
  function getAddress() { return isConnected() ? localStorage.getItem('fob_address') : null; }

  /* ── PUBLIC API ────────────────────────────────────────────────────────── */
  window.Web3Auth = { isConnected, getToken, getAddress, connect, disconnect, requireAuth };

  /* ── CONNECT ───────────────────────────────────────────────────────────── */
  async function connect() {
    // Show wallet selection modal
    var walletType = await showWalletModal();
    if (!walletType) return null;

    try {
      setBtnState('connecting');

      var result = walletType === 'metamask'
        ? await connectMetaMask()
        : await connectWalletConnect();

      if (!result) { setBtnState('idle'); return null; }

      var { address, signer } = result;

      // Get nonce from server
      var nonceRes = await fetch(API + '/auth/nonce?address=' + address);
      var { nonce } = await nonceRes.json();

      // Build message
      var message = [
        'Login to Follow or Bounce.',
        'Nonce: ' + nonce,
        'Issued: ' + new Date().toISOString()
      ].join('\n');

      setBtnState('signing');

      // Sign
      var signature = await signer.signMessage(message);

      setBtnState('verifying');

      // Verify on server
      var verifyRes = await fetch(API + '/auth/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ address, message, signature })
      });

      if (!verifyRes.ok) {
        var err = await verifyRes.json();
        throw new Error(err.error || 'Verification failed');
      }

      var { token } = await verifyRes.json();
      saveSession(token, address);
      updateUI();
      setBtnState('connected');

      document.dispatchEvent(new CustomEvent('web3:connected', { detail: { address, token } }));
      return { address, token };

    } catch (err) {
      console.error('[Web3Auth]', err);
      setBtnState(err.code === 4001 ? 'idle' : 'error');
      if (err.code !== 4001) setTimeout(() => setBtnState('idle'), 2000);
      return null;
    }
  }

  /* ── METAMASK ──────────────────────────────────────────────────────────── */
  async function connectMetaMask() {
    if (!window.ethereum) {
      // On mobile — deep link to MetaMask app
      var url = 'https://metamask.app.link/dapp/' + window.location.host;
      window.open(url, '_blank');
      return null;
    }

    var accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    var address  = accounts[0].toLowerCase();
    var provider = new ethers.BrowserProvider(window.ethereum);
    var signer   = await provider.getSigner();
    return { address, signer };
  }

  /* ── WALLETCONNECT ─────────────────────────────────────────────────────── */
  async function connectWalletConnect() {
    // Lazy-load WalletConnect + ethers from CDN
    if (!window.ethers) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.umd.min.js');
    }
    if (!window.WalletConnectEthereumProvider) {
      await loadScript('https://unpkg.com/@walletconnect/ethereum-provider@2.11.0/dist/index.umd.js');
    }

    var wcProvider = await window.WalletConnectEthereumProvider.init({
      projectId:   'ebb1ff54315af11e8b017b588e72b09b', // → cloud.walletconnect.com
      chains:      [1],
      showQrModal: true,
      metadata: {
        name:        'Follow or Bounce',
        description: 'Web3 editorial platform',
        url:         window.location.origin,
        icons:       [window.location.origin + '/assets/images/favicon.svg']
      }
    });

    await wcProvider.enable();
    var accounts = wcProvider.accounts;
    var address  = accounts[0].toLowerCase();
    var provider = new ethers.BrowserProvider(wcProvider);
    var signer   = await provider.getSigner();

    // Store for disconnect
    window._wcProvider = wcProvider;
    return { address, signer };
  }

  /* ── DISCONNECT ────────────────────────────────────────────────────────── */
  function disconnect() {
    clearSession();
    if (window._wcProvider) {
      try { window._wcProvider.disconnect(); } catch(e) {}
      window._wcProvider = null;
    }
    updateUI();
    document.dispatchEvent(new CustomEvent('web3:disconnected'));
  }

  function requireAuth() {
    if (!isConnected()) document.getElementById('web3-connect-btn')?.click();
  }

  /* ── WALLET SELECTION MODAL ────────────────────────────────────────────── */
  function showWalletModal() {
    return new Promise(function (resolve) {
      var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      var hasMetaMask = !!window.ethereum;

      // Build modal
      var overlay = document.createElement('div');
      overlay.id  = 'wallet-select-modal';
      overlay.innerHTML = [
        '<div class="wsm-box">',
        '  <div class="wsm-header">',
        '    <span>Connect Wallet</span>',
        '    <button class="wsm-close" aria-label="Close">✕</button>',
        '  </div>',
        '  <div class="wsm-options">',
        hasMetaMask || !isMobile
          ? '<button class="wsm-opt" data-wallet="metamask"><span class="wsm-icon">🦊</span><span>MetaMask' + (!hasMetaMask && !isMobile ? ' (not installed)' : '') + '</span></button>'
          : '',
        '    <button class="wsm-opt" data-wallet="walletconnect"><span class="wsm-icon">🔗</span><span>WalletConnect<br><small>Mobile wallets, Rainbow, Coinbase…</small></span></button>',
        '  </div>',
        '</div>'
      ].join('');

      document.body.appendChild(overlay);

      function pick(type) {
        overlay.remove();
        resolve(type);
      }

      overlay.querySelector('.wsm-close').onclick = () => { overlay.remove(); resolve(null); };
      overlay.onclick = (e) => { if (e.target === overlay) { overlay.remove(); resolve(null); } };
      overlay.querySelectorAll('.wsm-opt').forEach(btn => {
        btn.onclick = () => pick(btn.dataset.wallet);
      });
    });
  }

  /* ── UI HELPERS ────────────────────────────────────────────────────────── */
  function setBtnState(state) {
    var btn = document.getElementById('web3-connect-btn');
    if (!btn) return;
    var labels = {
      idle:        'Connect Wallet',
      connecting:  'Connecting…',
      signing:     'Sign in wallet…',
      verifying:   'Verifying…',
      connected:   shortAddr(getAddress()),
      error:       'Try again'
    };
    btn.textContent = labels[state] || 'Connect Wallet';
    btn.disabled    = ['connecting','signing','verifying'].includes(state);
  }

  function updateUI() {
    var btn      = document.getElementById('web3-connect-btn');
    var discEl   = document.getElementById('web3-disconnect');
    var addrEls  = document.querySelectorAll('[data-web3-address]');
    var gated    = document.querySelectorAll('[data-web3-gate]');
    var locked   = document.querySelectorAll('[data-web3-locked]');

    var connected = isConnected();
    var address   = getAddress();

    if (btn) {
      btn.textContent = connected ? shortAddr(address) : 'Connect Wallet';
      btn.classList.toggle('is-connected', connected);
    }
    if (discEl)  discEl.style.display = connected ? 'inline' : 'none';
    addrEls.forEach(el => { el.textContent = connected ? address : ''; });
    gated.forEach(el  => { el.style.display = connected ? '' : 'none'; });
    locked.forEach(el => { el.style.display = connected ? 'none' : ''; });
  }

  function shortAddr(addr) {
    return addr ? addr.slice(0,6) + '…' + addr.slice(-4) : '';
  }

  /* ── SCRIPT LOADER ─────────────────────────────────────────────────────── */
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) return resolve();
      var s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  /* ── INIT ──────────────────────────────────────────────────────────────── */
  // Load ethers globally if not present
  if (!window.ethers) {
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.umd.min.js');
  }

  document.addEventListener('DOMContentLoaded', function () {
    updateUI();

    var btn = document.getElementById('web3-connect-btn');
    if (btn) btn.addEventListener('click', function () {
      if (isConnected()) {
        openProfileModal();
      } else {
        connect().catch(console.error);
      }
    });

    var discEl = document.getElementById('web3-disconnect');
    if (discEl) discEl.addEventListener('click', function (e) {
      e.preventDefault();
      disconnect();
    });
  });

  /* ─────────────────────────────────────────────────────────────────────────
     PROFILE MODAL
  ───────────────────────────────────────────────────────────────────────── */
  async function openProfileModal() {
    // Load profile from server
    var profile = {};
    try {
      var res = await fetch(API + '/me', {
        headers: { 'Authorization': 'Bearer ' + getToken() }
      });
      if (res.ok) profile = await res.json();
    } catch(e) {}

    // Get ETH balance
    var balance = '—';
    try {
      if (window.ethereum) {
        var provider = new ethers.BrowserProvider(window.ethereum);
        var raw = await provider.getBalance(getAddress());
        balance = parseFloat(ethers.formatEther(raw)).toFixed(4) + ' ETH';
      }
    } catch(e) {}

    var modal = document.createElement('div');
    modal.id  = 'profile-modal';
    modal.innerHTML = [
      '<div class="pm-box">',
      '  <div class="pm-header">',
      '    <span>My Profile</span>',
      '    <button class="pm-close" aria-label="Close">✕</button>',
      '  </div>',
      '  <div class="pm-wallet">',
      '    <div class="pm-address">' + getAddress() + '</div>',
      '    <div class="pm-balance">' + balance + '</div>',
      '  </div>',
      '  <form class="pm-form" id="profile-form">',
      '    ' + field('name',     'Name',     profile.name),
      '    ' + field('nickname', 'Nickname', profile.nickname),
      '    ' + field('email',    'Email',    profile.email, 'email'),
      '    ' + field('bio',      'Bio',      profile.bio,   'text', true),
      '    <div class="pm-status" id="pm-status"></div>',
      '    <button class="pm-save" type="submit">Save Profile</button>',
      '  </form>',
      '  <div class="pm-footer">',
      '    <a href="#" id="pm-disconnect">Disconnect wallet</a>',
      '  </div>',
      '</div>'
    ].join('');

    document.body.appendChild(modal);

    modal.querySelector('.pm-close').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    modal.querySelector('#pm-disconnect').onclick = (e) => {
      e.preventDefault();
      modal.remove();
      disconnect();
    };

    modal.querySelector('#profile-form').onsubmit = async (e) => {
      e.preventDefault();
      var statusEl = modal.querySelector('#pm-status');
      var saveBtn  = modal.querySelector('.pm-save');
      saveBtn.disabled = true;
      statusEl.textContent = 'Saving…';

      var updates = {
        name:     modal.querySelector('[name="name"]').value,
        nickname: modal.querySelector('[name="nickname"]').value,
        email:    modal.querySelector('[name="email"]').value,
        bio:      modal.querySelector('[name="bio"]').value
      };

      try {
        var patchRes = await fetch(API + '/me', {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
          body:    JSON.stringify(updates)
        });
        statusEl.textContent = patchRes.ok ? '✓ Saved' : '✕ Error saving';
        statusEl.style.color = patchRes.ok ? 'var(--green, #1a7a4a)' : 'var(--rust, #c0390b)';
      } catch(err) {
        statusEl.textContent = '✕ Connection error';
        statusEl.style.color = 'var(--rust, #c0390b)';
      }

      saveBtn.disabled = false;
      setTimeout(() => { statusEl.textContent = ''; }, 3000);
    };
  }

  function field(name, label, value, type, isTextarea) {
    value = value || '';
    if (isTextarea) {
      return '<label class="pm-label">' + label +
             '<textarea class="pm-input" name="' + name + '" rows="3" autocomplete="off">' +
             escHtml(value) + '</textarea></label>';
    }
    return '<label class="pm-label">' + label +
           '<input class="pm-input" type="' + (type||'text') + '" name="' + name +
           '" value="' + escHtml(value) + '" autocomplete="off"></label>';
  }

  function escHtml(str) {
    return String(str).replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

})();
