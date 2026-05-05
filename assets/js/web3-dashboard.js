(function () {
  'use strict';

  // Set your Alchemy key here after getting it from alchemy.com
  var ALCHEMY_KEY = window._alchemyKey || 'YOUR_ALCHEMY_API_KEY';

  window.Web3Dashboard = { init: init };

  async function init(containerSelector) {
    // FIX: wait for Web3Auth to be ready
    var container = document.querySelector(containerSelector);
    if (!container) return;

    if (!window.Web3Auth || !window.Web3Auth.isConnected()) {
      container.innerHTML = '<div class="dash-loading">Wallet not connected.</div>';
      return;
    }

    var address = window.Web3Auth.getAddress();
    container.innerHTML = '<div class="dash-loading">Loading wallet data…</div>';

    // Refresh Alchemy key in case it was set after script load
    ALCHEMY_KEY = window._alchemyKey || ALCHEMY_KEY;
    var ALCHEMY_URL = 'https://eth-mainnet.g.alchemy.com/v2/' + ALCHEMY_KEY;
    var ALCHEMY_NFT = 'https://eth-mainnet.g.alchemy.com/nft/v3/' + ALCHEMY_KEY;

    try {
      var balance = await fetchBalance(address, ALCHEMY_URL);
      var nfts    = await fetchNFTs(address, ALCHEMY_NFT);
      container.innerHTML = renderDashboard(address, balance, nfts);
    } catch (err) {
      console.error('[Dashboard]', err);
      container.innerHTML = '<div class="dash-error">Could not load wallet data. Check your Alchemy API key.</div>';
    }
  }

  async function fetchBalance(address, url) {
    try {
      var res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [address, 'latest'] })
      });
      var data = await res.json();
      if (!data.result) return '—';
      var wei = parseInt(data.result, 16);
      return (wei / 1e18).toFixed(4) + ' ETH';
    } catch(e) { return '—'; }
  }

  async function fetchNFTs(address, url) {
    try {
      var res  = await fetch(url + '/getNFTsForOwner?owner=' + address + '&withMetadata=true&pageSize=12');
      var data = await res.json();
      return data.ownedNfts || [];
    } catch(e) { return []; }
  }

  function renderDashboard(address, balance, nfts) {
    var nftSection = nfts.length
      ? nfts.map(function(nft) {
          var name       = nft.name || ('#' + nft.tokenId) || 'Unknown';
          var collection = (nft.contract && nft.contract.name) || 'Unknown Collection';
          var image      = (nft.image && (nft.image.thumbnailUrl || nft.image.cachedUrl)) || '';
          var tokenId    = nft.tokenId || '';
          return '<div class="nft-card">' +
            (image ? '<img class="nft-img" src="' + image + '" alt="' + name + '" loading="lazy" onerror="this.style.display=\'none\'">' : '<div class="nft-no-img">No image</div>') +
            '<div class="nft-info">' +
              '<div class="nft-name">' + name + '</div>' +
              '<div class="nft-collection">' + collection + '</div>' +
              '<div class="nft-id">#' + tokenId + '</div>' +
            '</div></div>';
        }).join('')
      : '<p class="dash-empty">No NFTs found in this wallet.</p>';

    return '<div class="dash-wallet-info">' +
        '<div class="dash-row"><span class="dash-label">Address</span><span class="dash-value dash-mono">' + address + '</span></div>' +
        '<div class="dash-row"><span class="dash-label">Balance</span><span class="dash-value">' + balance + '</span></div>' +
      '</div>' +
      '<h3 class="dash-section-title">NFT Portfolio</h3>' +
      '<div class="dash-nft-grid">' + nftSection + '</div>';
  }

})();
