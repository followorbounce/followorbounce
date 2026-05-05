(function () {
  'use strict';

  var API = 'https://fob-render-api.onrender.com';
  var ETHERS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.umd.min.js';
  var WC_CDN     = 'https://unpkg.com/@walletconnect/ethereum-provider@2.11.0/dist/index.umd.js';

  /* ── SESSION ───────────────────────────────────────────────────────────── */
  function saveSession(token, address) {
    localStorage.setItem('fob_token',   token);
    localStorage.setItem('fob_address', address);
    localStorage.setItem('fob_expiry',  Date.now() + 24 * 3600 * 1000);
  }

  function clearSession() {
    ['fob_token','fob_address','fob_expiry'].forEach(function(k) {
      localStorage.removeItem(k);
    });
  }

  function isConnected() {
    var expiry = localStorage.getItem('fob_expiry');
    return !!localStorage.getItem('fob_token') && Date.now() < parseInt(expiry || 0);
  }

  function getToken()   { return isConnected() ? localStorage.getItem('fob_token')   : null; }
  function getAddress() { return isConnected() ? localStorage.getItem('fob_address') : null; }

  window.Web3Auth = { isConnected: isConnected, getToken: getToken, getAddress: getAddress, connect: connect, disconnect: disconnect, requireAuth: requireAuth };

  /* ── SCRIPT LOADER ─────────────────────────────────────────────────────── */
  function loadScript(src) {
    return new Promise(function(resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) return resolve();
      var s = document.createElement('script');
      s.src = src;
      s.onload  = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // Preload ethers immediately
  var ethersReady = loadScript(ETHERS_CDN);

  /* ── CONNECT ───────────────────────────────────────────────────────────── */
  async function connect() {
    var walletType = await showWalletModal();
    if (!walletType) return null;

    try {
      setBtnState('connecting');

      // Always ensure ethers is loaded before proceeding
      await ethersReady;

      var result = walletType === 'metamask'
        ? await connectMetaMask()
        : await connectWalletConnect();

      if (!result) { setBtnState('idle'); return null; }

      var address = result.address;
      var signer  = result.signer;

      // Get nonce
      setBtnState('connecting');
      var nonceRes = await fetch(API + '/auth/nonce?address=' + address);
      if (!nonceRes.ok) throw new Error('Could not get nonce');
      var nonceData = await nonceRes.json();
      var nonce = nonceData.nonce;

      // Build + sign message
      var message = 'Login to Follow or Bounce.\nNonce: ' + nonce + '\nIssued: ' + new Date().toISOString();
      setBtnState('signing');
      var signature = await signer.signMessage(message);

      // Verify
      setBtnState('verifying');
      var verifyRes = await fetch(API + '/auth/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ address: address, message: message, signature: signature })
      });

      if (!verifyRes.ok) {
        var errData = await verifyRes.json();
        throw new Error(errData.error || 'Verification failed');
      }

      var verifyData = await verifyRes.json();
      saveSession(verifyData.token, address);

      // FIX 1: explicitly remove wallet selection modal if still present
      var wsm = document.getElementById('wallet-select-modal');
      if (wsm) wsm.remove();

      updateUI();
      setBtnState('connected');

      document.dispatchEvent(new CustomEvent('web3:connected', { detail: { address: address, token: verifyData.token } }));
      return { address: address, token: verifyData.token };

    } catch (err) {
      console.error('[Web3Auth]', err);
      // Remove wallet modal on error too
      var wsm = document.getElementById('wallet-select-modal');
      if (wsm) wsm.remove();
      setBtnState(err.code === 4001 ? 'idle' : 'error');
      if (err.code !== 4001) setTimeout(function() { setBtnState('idle'); }, 2000);
      return null;
    }
  }

  /* ── METAMASK ──────────────────────────────────────────────────────────── */
  async function connectMetaMask() {
    await ethersReady; // FIX 2: ensure ethers loaded before use

    if (!window.ethereum) {
      // Mobile: deep link into MetaMask app
      var deepLink = 'https://metamask.app.link/dapp/' + window.location.host + window.location.pathname;
      window.location.href = deepLink;
      return null;
    }

    var accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    var address  = accounts[0].toLowerCase();
    var provider = new window.ethers.BrowserProvider(window.ethereum);
    var signer   = await provider.getSigner();
    return { address: address, signer: signer };
  }

  /* ── WALLETCONNECT ─────────────────────────────────────────────────────── */
  async function connectWalletConnect() {
    await ethersReady;
    await loadScript(WC_CDN);

    var wcProvider = await window.WalletConnectEthereumProvider.init({
      projectId:   window._wcProjectId || 'YOUR_WALLETCONNECT_PROJECT_ID',
      chains:      [1],
      showQrModal: true,
      metadata: {
        name:        'Follow or Bounce',
        description: 'Web3 editorial platform',
        url:         window.location.origin,
        icons:       [window.location.origin + '/assets/images/favicon.svg']
      }
    });

    // FIX 3: handle mobile — WalletConnect opens deep link automatically
    await wcProvider.enable();

    var accounts = wcProvider.accounts;
    if (!accounts || !accounts.length) throw new Error('No accounts returned');

    var address  = accounts[0].toLowerCase();
    var provider = new window.ethers.BrowserProvider(wcProvider);
    var signer   = await provider.getSigner();

    window._wcProvider = wcProvider;
    return { address: address, signer: signer };
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
    if (!isConnected()) {
      var btn = document.getElementById('web3-connect-btn');
      if (btn) btn.click();
    }
  }

  /* ── WALLET SELECTION MODAL ────────────────────────────────────────────── */
  function showWalletModal() {
    return new Promise(function(resolve) {
      // Remove any existing modal first
      var existing = document.getElementById('wallet-select-modal');
      if (existing) existing.remove();

      var isMobile   = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      var hasMetaMask = !!window.ethereum;
      var showMM      = hasMetaMask || !isMobile;

      var overlay = document.createElement('div');
      overlay.id  = 'wallet-select-modal';
      overlay.innerHTML =
        '<div class="wsm-box">' +
          '<div class="wsm-header">' +
            '<span>Connect Wallet</span>' +
            '<button class="wsm-close" aria-label="Close">✕</button>' +
          '</div>' +
          '<div class="wsm-options">' +
            (showMM
              ? '<button class="wsm-opt" data-wallet="metamask">' +
                  '<span class="wsm-icon">🦊</span>' +
                  '<span>MetaMask' + (isMobile && !hasMetaMask ? '<br><small>Opens MetaMask app</small>' : '') + '</span>' +
                '</button>'
              : '') +
            '<button class="wsm-opt" data-wallet="walletconnect">' +
              '<span class="wsm-icon">🔗</span>' +
              '<span>WalletConnect<br><small>Rainbow, Coinbase, Trust…</small></span>' +
            '</button>' +
          '</div>' +
        '</div>';

      document.body.appendChild(overlay);

      function pick(type) {
        overlay.remove();
        resolve(type);
      }

      overlay.querySelector('.wsm-close').addEventListener('click', function() {
        overlay.remove();
        resolve(null);
      });

      // Close on backdrop tap — important for mobile
      overlay.addEventListener('touchstart', function(e) {
        if (e.target === overlay) { overlay.remove(); resolve(null); }
      }, { passive: true });
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) { overlay.remove(); resolve(null); }
      });

      overlay.querySelectorAll('.wsm-opt').forEach(function(btn) {
        btn.addEventListener('touchstart', function(e) {
          e.preventDefault();
          pick(btn.dataset.wallet);
        }, { passive: false });
        btn.addEventListener('click', function() {
          pick(btn.dataset.wallet);
        });
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
      if (window.ethereum && window.ethers) {
        var provider = new window.ethers.BrowserProvider(window.ethereum);
        var raw = await provider.getBalance(getAddress());
        balance = parseFloat(window.ethers.formatEther(raw)).toFixed(4) + ' ETH';
      }
    } catch(e) {}

    var modal = document.createElement('div');
    modal.id  = 'profile-modal';
    modal.innerHTML =
      '<div class="pm-box">' +
        '<div class="pm-header"><span>My Profile</span><button class="pm-close">✕</button></div>' +
        '<div class="pm-wallet">' +
          '<div class="pm-address">' + getAddress() + '</div>' +
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
      } catch(err) {
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

  function esc(str) {
    return String(str).replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── INIT ──────────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function() {
    updateUI();

    var btn = document.getElementById('web3-connect-btn');
    if (btn) {
      btn.addEventListener('click', function() {
        if (isConnected()) {
          openProfileModal();
        } else {
          connect().catch(console.error);
        }
      });
    }

    var discEl = document.getElementById('web3-disconnect');
    if (discEl) {
      discEl.addEventListener('click', function(e) {
        e.preventDefault();
        disconnect();
      });
    }
  });

})();
