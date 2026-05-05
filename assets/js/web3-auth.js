/* ─────────────────────────────────────────────────────────────────────────────
   web3-auth.js — Follow or Bounce
   Web3 authentication via Sign-In with Ethereum (SIWE)
   Supports: MetaMask (injected) + WalletConnect (mobile wallets)
   Flow: Connect wallet → Sign message → Verify on server → Store JWT
───────────────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var PROXY_URL    = 'https://fob-render-api.onrender.com'; // your Render URL
  var TOKEN_KEY    = 'fob_auth_token';
  var ADDRESS_KEY  = 'fob_wallet_address';
  var TOKEN_EXPIRY = 'fob_token_expiry';

  /* ── PUBLIC API ────────────────────────────────────────────────────────── */
  window.Web3Auth = {
    isConnected:    isConnected,
    getAddress:     getAddress,
    getToken:       getToken,
    connect:        connect,
    disconnect:     disconnect,
    requireAuth:    requireAuth
  };

  /* ── TOKEN HELPERS ─────────────────────────────────────────────────────── */
  function isConnected() {
    var token   = sessionStorage.getItem(TOKEN_KEY);
    var expiry  = sessionStorage.getItem(TOKEN_EXPIRY);
    if (!token || !expiry) return false;
    if (Date.now() > parseInt(expiry)) {
      disconnect();
      return false;
    }
    return true;
  }

  function getAddress() {
    return sessionStorage.getItem(ADDRESS_KEY) || null;
  }

  function getToken() {
    return isConnected() ? sessionStorage.getItem(TOKEN_KEY) : null;
  }

  function saveSession(token, address) {
    var expiry = Date.now() + 24 * 60 * 60 * 1000; // 24h
    sessionStorage.setItem(TOKEN_KEY,    token);
    sessionStorage.setItem(ADDRESS_KEY,  address);
    sessionStorage.setItem(TOKEN_EXPIRY, expiry.toString());
  }

  function disconnect() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ADDRESS_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY);
    updateUI();
    // Disconnect WalletConnect if active
    if (window._wcProvider) {
      try { window._wcProvider.disconnect(); } catch(e) {}
      window._wcProvider = null;
    }
  }

  /* ── CONNECT FLOW ──────────────────────────────────────────────────────── */
  async function connect() {
    try {
      setStatus('connecting');

      // Detect wallet type
      var provider = null;
      var address  = null;

      if (window.ethereum) {
        // MetaMask or other injected wallet
        var accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        address  = accounts[0];
        provider = 'injected';
      } else {
        // No injected wallet — load WalletConnect dynamically
        setStatus('loading-wc');
        provider = await loadWalletConnect();
        var wcAccounts = await provider.enable();
        address  = wcAccounts[0];
        window._wcProvider = provider;
      }

      // Get nonce from server
      var nonceRes = await fetch(PROXY_URL + '/auth/nonce');
      var { nonce } = await nonceRes.json();

      // Build SIWE message
      var message = buildSIWEMessage(address, nonce);

      // Request signature
      setStatus('signing');
      var signature;

      if (provider === 'injected') {
        signature = await window.ethereum.request({
          method:  'personal_sign',
          params:  [message, address]
        });
      } else {
        var wcEthProvider = new window._wcEthers.BrowserProvider(provider);
        var signer = await wcEthProvider.getSigner();
        signature  = await signer.signMessage(message);
      }

      // Verify on server → get JWT
      setStatus('verifying');
      var verifyRes = await fetch(PROXY_URL + '/auth/verify', {
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

      setStatus('connected');
      updateUI();

      // Fire custom event so page-specific code can react
      document.dispatchEvent(new CustomEvent('web3:connected', {
        detail: { address, token }
      }));

      return { address, token };

    } catch (err) {
      setStatus('error');
      console.error('[Web3Auth]', err);

      // User rejected signature — not an error worth showing
      if (err.code === 4001) {
        setStatus('idle');
        return null;
      }
      throw err;
    }
  }

  /* ── SIWE MESSAGE FORMAT (EIP-4361) ────────────────────────────────────── */
  function buildSIWEMessage(address, nonce) {
    var domain = window.location.host;
    var origin = window.location.origin;
    var now    = new Date().toISOString();

    return [
      domain + ' wants you to sign in with your Ethereum account:',
      address,
      '',
      'Sign in to Follow or Bounce.',
      '',
      'URI: '       + origin,
      'Version: 1',
      'Nonce: '     + nonce,
      'Issued At: ' + now
    ].join('\n');
  }

  /* ── WALLETCONNECT LOADER ───────────────────────────────────────────────── */
  async function loadWalletConnect() {
    // Load WalletConnect v2 EthereumProvider from CDN
    await loadScript('https://unpkg.com/@walletconnect/ethereum-provider@2.11.0/dist/index.umd.js');

    var wcProvider = await window.WalletConnectEthereumProvider.init({
      projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // get free at cloud.walletconnect.com
      chains:    [1],  // Ethereum mainnet
      showQrModal: true
    });

    return wcProvider;
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) return resolve();
      var s   = document.createElement('script');
      s.src   = src;
      s.onload  = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  /* ── UI HELPERS ────────────────────────────────────────────────────────── */
  function setStatus(state) {
    var btn = document.getElementById('web3-connect-btn');
    if (!btn) return;

    var labels = {
      'idle':       'Connect Wallet',
      'connecting': 'Connecting…',
      'loading-wc': 'Loading…',
      'signing':    'Sign in wallet…',
      'verifying':  'Verifying…',
      'connected':  shortAddress(getAddress()),
      'error':      'Try again'
    };

    btn.textContent = labels[state] || 'Connect Wallet';
    btn.disabled    = ['connecting','loading-wc','signing','verifying'].includes(state);
  }

  function updateUI() {
    var btn          = document.getElementById('web3-connect-btn');
    var disconnectEl = document.getElementById('web3-disconnect');
    var addressEl    = document.getElementById('web3-address');
    var gatedEls     = document.querySelectorAll('[data-web3-gate]');
    var lockedEls    = document.querySelectorAll('[data-web3-locked]');

    if (!btn) return;

    if (isConnected()) {
      btn.textContent = shortAddress(getAddress());
      btn.classList.add('is-connected');
      if (disconnectEl) disconnectEl.style.display = 'inline';
      if (addressEl)    addressEl.textContent = getAddress();

      // Show gated content, hide lock screens
      gatedEls.forEach(function (el) { el.style.display = ''; });
      lockedEls.forEach(function (el) { el.style.display = 'none'; });
    } else {
      btn.textContent = 'Connect Wallet';
      btn.classList.remove('is-connected');
      if (disconnectEl) disconnectEl.style.display = 'none';
      if (addressEl)    addressEl.textContent = '';

      // Hide gated content, show lock screens
      gatedEls.forEach(function (el) { el.style.display = 'none'; });
      lockedEls.forEach(function (el) { el.style.display = ''; });
    }
  }

  function shortAddress(addr) {
    if (!addr) return '';
    return addr.slice(0, 6) + '…' + addr.slice(-4);
  }

  /* ── requireAuth — call on protected pages ─────────────────────────────── */
  // Usage: add data-web3-gate and data-web3-locked to elements in HTML
  // Or call Web3Auth.requireAuth() to force a connect prompt if not connected
  function requireAuth() {
    if (!isConnected()) {
      var btn = document.getElementById('web3-connect-btn');
      if (btn) btn.click();
    }
  }

  /* ── INIT ──────────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    updateUI();

    var btn = document.getElementById('web3-connect-btn');
    if (btn) {
      btn.addEventListener('click', function () {
        if (isConnected()) return; // already connected, show address
        connect().catch(function (err) {
          console.error('[Web3Auth connect]', err);
          setStatus('error');
          setTimeout(function () { setStatus('idle'); }, 2000);
        });
      });
    }

    var disconnectEl = document.getElementById('web3-disconnect');
    if (disconnectEl) {
      disconnectEl.addEventListener('click', function (e) {
        e.preventDefault();
        disconnect();
      });
    }
  });

})();
