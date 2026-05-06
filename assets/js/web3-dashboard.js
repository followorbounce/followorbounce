/**
 * web3-dashboard.js — Follow or Bounce
 *
 * Zero external dependencies. No ethers.js. No SDK.
 * Uses window.ethereum for balance + Alchemy REST API for NFTs.
 * GitHub Pages CSP compatible.
 *
 * ─── CONFIGURATION ───────────────────────────────────────────────────────────
 * Set your Alchemy API key in _config.yml:
 *   alchemy_key: "YOUR_KEY_HERE"
 * Get a free key at: https://alchemy.com
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* Auto-init when dashboard container is present */
  document.addEventListener('DOMContentLoaded', tryInit);
  document.addEventListener('web3:connected',   tryInit);

  function tryInit() {
    if (!document.getElementById('dashboard-container')) return;
    setTimeout(init, 300); // small delay to ensure Web3Auth session is saved
  }

  async function init() {
    var container = document.getElementById('dashboard-container');
    if (!container) return;

    if (!window.Web3Auth || !window.Web3Auth.isConnected()) {
      container.innerHTML = '<p class="dash-empty">Wallet not connected.</p>';
      return;
    }

    var address    = window.Web3Auth.getAddress();
    var alchemyKey = getMetaContent('alchemy-key');

    container.innerHTML = '<div class="dash-loading">Loading wallet data…</div>';

    var balance = await fetchBalance(address, alchemyKey);
    var nfts    = alchemyKey ? await fetchNFTs(address, alchemyKey) : [];

    container.innerHTML = renderDashboard(address, balance, nfts, !alchemyKey);
  }

  /* Read key from <meta name="alchemy-key"> set by Jekyll layout */
  function getMetaContent(name) {
    var el = document.querySelector('meta[name="' + name + '"]');
    return el ? el.getAttribute('content') : '';
  }

  /* ETH balance — window.ethereum first, Alchemy fallback */
  async function fetchBalance(address, alchemyKey) {
    try {
      if (window.ethereum) {
        var hex = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [address, 'latest']
        });
        return (parseInt(hex, 16) / 1e18).toFixed(4) + ' ETH';
      }
    } catch (e) {}

    if (alchemyKey) {
      try {
        var res  = await fetch('https://eth-mainnet.g.alchemy.com/v2/' + alchemyKey, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            jsonrpc: '2.0', id: 1,
            method:  'eth_getBalance',
            params:  [address, 'latest']
          })
        });
        var data = await res.json();
        if (data.result) return (parseInt(data.result, 16) / 1e18).toFixed(4) + ' ETH';
      } catch (e) {}
    }

    return '—';
  }

  /* NFTs via Alchemy NFT REST API — plain fetch, no SDK */
  async function fetchNFTs(address, alchemyKey) {
    try {
      var url  = 'https://eth-mainnet.g.alchemy.com/nft/v3/' + alchemyKey
               + '/getNFTsForOwner?owner=' + address
               + '&withMetadata=true&pageSize=12';
      var res  = await fetch(url);
      var data = await res.json();
      return Array.isArray(data.ownedNfts) ? data.ownedNfts : [];
    } catch (e) {
      return [];
    }
  }

  /* Render */
  function renderDashboard(address, balance, nfts, noKey) {
    var nftSection;

    if (noKey) {
      nftSection = '<p class="dash-empty">Add <code>alchemy_key</code> to <code>_config.yml</code> to display NFTs.</p>';
    } else if (!nfts.length) {
      nftSection = '<p class="dash-empty">No NFTs found in this wallet.</p>';
    } else {
      nftSection = nfts.map(function (nft) {
        var name  = nft.name || ('#' + (nft.tokenId || '?'));
        var coll  = (nft.contract && nft.contract.name) || 'Unknown Collection';
        var img   = nft.image && (nft.image.thumbnailUrl || nft.image.cachedUrl);
        var tid   = nft.tokenId || '';
        return '<div class="nft-card">'
          + (img
            ? '<img class="nft-img" src="' + img + '" alt="' + esc(name) + '" loading="lazy" onerror="this.style.display=\'none\'">'
            : '<div class="nft-no-img">No image</div>')
          + '<div class="nft-info">'
            + '<div class="nft-name">'       + esc(name) + '</div>'
            + '<div class="nft-collection">' + esc(coll) + '</div>'
            + '<div class="nft-id">#'        + esc(tid)  + '</div>'
          + '</div></div>';
      }).join('');
    }

    return '<div class="dash-wallet-info">'
        + '<div class="dash-row"><span class="dash-label">Address</span>'
          + '<span class="dash-value dash-mono">' + esc(address) + '</span></div>'
        + '<div class="dash-row"><span class="dash-label">Balance</span>'
          + '<span class="dash-value">' + esc(balance) + '</span></div>'
      + '</div>'
      + '<h3 class="dash-section-title">NFT Portfolio</h3>'
      + '<div class="dash-nft-grid">' + nftSection + '</div>';
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

})();
