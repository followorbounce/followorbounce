---
layout: default
title: "Dashboard"
permalink: /dashboard/
---

<script>
  // Set your API keys here
  window._alchemyKey   = 'XiZdGt7aHKwDQqkOEf9bR';    // alchemy.com
  window._wcProjectId  = 'ebb1ff54315af11e8b017b588e72b09b';   // cloud.walletconnect.com
</script>

<div data-web3-locked>
  <div class="gate-screen">
    <p class="eyebrow">Members</p>
    <h2>Connect your wallet to view your dashboard.</h2>
    <p>See your ETH balance and NFT portfolio.</p>
    <button class="gate-connect-btn" onclick="Web3Auth.requireAuth()">Connect Wallet →</button>
  </div>
</div>

<div data-web3-gate>
  <div class="page-hero">
    <p class="eyebrow">Dashboard</p>
    <h1>My Wallet</h1>
  </div>
  <div id="dashboard-container"></div>
</div>

<script>
  function loadDashboard() {
    if (window.Web3Auth && window.Web3Auth.isConnected() && window.Web3Dashboard) {
      Web3Dashboard.init('#dashboard-container');
    }
  }
  document.addEventListener('web3:connected', loadDashboard);
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loadDashboard, 300);
  });
</script>
