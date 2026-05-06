---
layout: default
title: "Dashboard"
permalink: /dashboard/
---

<div data-web3-locked>
  <div class="gate-screen">
    <p class="eyebrow">Members</p>
    <h2>Connect your wallet to view your dashboard.</h2>
    <p>See your ETH balance and NFT portfolio. No transaction required — just a signature.</p>
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
