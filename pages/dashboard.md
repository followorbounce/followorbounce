---
layout: default
title: "Dashboard"
permalink: /dashboard/
---

<!-- LOCKED — not connected -->
<div data-web3-locked>
  <div class="gate-screen">
    <p class="eyebrow">Members</p>
    <h2>Connect your wallet to view your dashboard.</h2>
    <p>See your ETH balance and NFT portfolio. Connect any Ethereum wallet — MetaMask on desktop, or any WalletConnect-compatible wallet on mobile.</p>
    <button class="gate-connect-btn" onclick="Web3Auth.requireAuth()">Connect Wallet →</button>
  </div>
</div>

<!-- DASHBOARD — connected -->
<div data-web3-gate>
  <div class="page-hero">
    <p class="eyebrow">Dashboard</p>
    <h1>My Wallet</h1>
    <p class="subtitle" style="font-family:'DM Mono',monospace;font-size:.75rem;" data-web3-address></p>
  </div>

  <div id="dashboard-container"></div>
</div>

<script>
document.addEventListener('web3:connected', function () {
  if (window.Web3Dashboard) Web3Dashboard.init('#dashboard-container');
});
// If already connected on page load
document.addEventListener('DOMContentLoaded', function () {
  if (window.Web3Auth && window.Web3Auth.isConnected()) {
    setTimeout(function () {
      if (window.Web3Dashboard) Web3Dashboard.init('#dashboard-container');
    }, 500);
  }
});
</script>
