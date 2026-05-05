(function () {
  'use strict';

  window.Web3Dashboard = { init: init };

  async function init(containerSelector) {
    var container = document.querySelector(containerSelector);
    if (!container) return;

    if (!window.Web3Auth || !window.Web3Auth.isConnected()) {
      container.innerHTML = '<p class="dash-empty">Wallet not connected.</p>';
      return;
    }

    var address    = window.Web3Auth.getAddress();
    var alchemyKey = window._alchemyKey || '';

    container.innerHTML = '<div class="dash-loading">Loading wallet data…</div>';

    var balance = await fetchBalance(address, alchemyKey);
    var nfts    = alchemyKey && alchemyKey !== 'YOUR_ALCHEMY_API_KEY'
      ? await fetchNFTs(address, alchemyKey)
      : [];

    container.innerHTML = render(address, balance, nfts, !alchemyKey || alchemyKey === 'YOUR_ALCHEMY_API_KEY');
  }

  /* ── BALANCE — uses window.ethereum directly, no SDK needed ───────────── */
  async function fetchBalance(address, alchemyKey) {
    // Try injected provider first (no eval, no external SDK)
    try {
      if (window.ethereum) {
        var hex = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [address, 'latest']
        });
        var wei = parseInt(hex, 16);
        return (wei / 1e18).toFixed(4) + ' ETH';
      }
    } catch(e) {}

    // Fallback: Alchemy JSON-RPC (simple fetch, no SDK)
    if (alchemyKey && alchemyKey !== 'YOUR_ALCHEMY_API_KEY') {
      try {
        var res = await fetch('https://eth-mainnet.g.alchemy.com/v2/' + alchemyKey, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc:'2.0', id:1, method:'eth_getBalance', params:[address,'latest'] })
        });
        var data = await res.json();
        if (data.result) {
          var w = parseInt(data.result, 16);
          return (w / 1e18).toFixed(4) + ' ETH';
        }
      } catch(e) {}
    }

    return '—';
  }

  /* ── NFTs — Alchemy REST API (plain fetch, no SDK) ─────────────────────── */
  async function fetchNFTs(address, alchemyKey) {
    try {
      var url = 'https://eth-mainnet.g.alchemy.com/nft/v3/' + alchemyKey +
                '/getNFTsForOwner?owner=' + address + '&withMetadata=true&pageSize=12';
      var res  = await fetch(url);
      var data = await res.json();
      return data.ownedNfts || [];
    } catch(e) { return []; }
  }

  /* ── RENDER ────────────────────────────────────────────────────────────── */
  function render(address, balance, nfts, noAlchemy) {
    var nftSection;
    if (noAlchemy) {
      nftSection = '<p class="dash-empty" style="font-size:.75rem;color:#b8b3a8;">Add your Alchemy API key in pages/dashboard.md to see NFTs.</p>';
    } else if (nfts.length) {
      nftSection = nfts.map(function(nft) {
        var name   = nft.name || ('#' + nft.tokenId) || 'Unknown';
        var coll   = (nft.contract && nft.contract.name) || 'Unknown Collection';
        var img    = (nft.image && (nft.image.thumbnailUrl || nft.image.cachedUrl)) || '';
        var tid    = nft.tokenId || '';
        return '<div class="nft-card">' +
          (img ? '<img class="nft-img" src="' + img + '" alt="' + name + '" loading="lazy" onerror="this.style.display=\'none\'">' : '<div class="nft-no-img">No image</div>') +
          '<div class="nft-info">' +
            '<div class="nft-name">'       + name + '</div>' +
            '<div class="nft-collection">' + coll + '</div>' +
            '<div class="nft-id">#'        + tid  + '</div>' +
          '</div></div>';
      }).join('');
    } else {
      nftSection = '<p class="dash-empty">No NFTs found in this wallet.</p>';
    }

    return '<div class="dash-wallet-info">' +
        '<div class="dash-row"><span class="dash-label">Address</span><span class="dash-value dash-mono">' + address + '</span></div>' +
        '<div class="dash-row"><span class="dash-label">Balance</span><span class="dash-value">' + balance + '</span></div>' +
      '</div>' +
      '<h3 class="dash-section-title">NFT Portfolio</h3>' +
      '<div class="dash-nft-grid">' + nftSection + '</div>';
  }

})();
