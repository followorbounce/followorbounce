/* ─────────────────────────────────────────────────────────────────────────────
   web3-dashboard.js — Follow or Bounce
   Wallet dashboard: ETH balance + NFT portfolio
   Uses Alchemy NFT API (free tier: 300 req/s)
───────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  // Replace with your Alchemy API key → alchemy.com (free)
  var ALCHEMY_KEY = 'XiZdGt7aHKwDQqkOEf9bR';
  var ALCHEMY_URL = 'https://eth-mainnet.g.alchemy.com/v2/' + ALCHEMY_KEY;
  var ALCHEMY_NFT = 'https://eth-mainnet.g.alchemy.com/nft/v3/' + ALCHEMY_KEY;

  window.Web3Dashboard = { init: init };

  async function init(containerSelector) {
    if (!window.Web3Auth || !window.Web3Auth.isConnected()) return;

    var container = document.querySelector(containerSelector);
    if (!container) return;

    var address = window.Web3Auth.getAddress();

    container.innerHTML = '<div class="dash-loading">Loading wallet data…</div>';

    try {
      var [balance, nfts] = await Promise.all([
        fetchBalance(address),
        fetchNFTs(address)
      ]);

      container.innerHTML = renderDashboard(address, balance, nfts);

    } catch (err) {
      console.error('[Dashboard]', err);
      container.innerHTML = '<div class="dash-error">Could not load wallet data.</div>';
    }
  }

  /* ── FETCH BALANCE ─────────────────────────────────────────────────────── */
  async function fetchBalance(address) {
    try {
      var res = await fetch(ALCHEMY_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1, method: 'eth_getBalance',
          params: [address, 'latest']
        })
      });
      var data = await res.json();
      var wei  = parseInt(data.result, 16);
      return (wei / 1e18).toFixed(4) + ' ETH';
    } catch (e) {
      return '—';
    }
  }

  /* ── FETCH NFTs ────────────────────────────────────────────────────────── */
  async function fetchNFTs(address) {
    try {
      var res = await fetch(
        ALCHEMY_NFT + '/getNFTsForOwner?owner=' + address + '&withMetadata=true&pageSize=12'
      );
      var data = await res.json();
      return data.ownedNfts || [];
    } catch (e) {
      return [];
    }
  }

  /* ── RENDER ────────────────────────────────────────────────────────────── */
  function renderDashboard(address, balance, nfts) {
    var nftCards = nfts.length
      ? nfts.map(renderNFT).join('')
      : '<p class="dash-empty">No NFTs found in this wallet.</p>';

    return [
      '<div class="dash-wallet-info">',
      '  <div class="dash-row">',
      '    <span class="dash-label">Address</span>',
      '    <span class="dash-value dash-mono">' + address + '</span>',
      '  </div>',
      '  <div class="dash-row">',
      '    <span class="dash-label">Balance</span>',
      '    <span class="dash-value">' + balance + '</span>',
      '  </div>',
      '</div>',
      '<h3 class="dash-section-title">NFT Portfolio</h3>',
      '<div class="dash-nft-grid">' + nftCards + '</div>'
    ].join('');
  }

  function renderNFT(nft) {
    var name       = nft.name || nft.tokenId || 'Unknown';
    var collection = nft.contract?.name || 'Unknown Collection';
    var image      = nft.image?.thumbnailUrl || nft.image?.cachedUrl || '';
    var tokenId    = nft.tokenId || '';

    return [
      '<div class="nft-card">',
      image ? '<img class="nft-img" src="' + image + '" alt="' + name + '" loading="lazy" onerror="this.style.display=\'none\'">' : '<div class="nft-no-img">No image</div>',
      '  <div class="nft-info">',
      '    <div class="nft-name">' + name + '</div>',
      '    <div class="nft-collection">' + collection + '</div>',
      '    <div class="nft-id">#' + tokenId + '</div>',
      '  </div>',
      '</div>'
    ].join('');
  }

})();
