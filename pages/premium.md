---
layout: default
title: "Premium"
permalink: /premium/
---

<!-- LOCK SCREEN — shown when wallet not connected -->
<div data-web3-locked>
  <div class="gate-screen">
    <p class="eyebrow">Members Only</p>
    <h2>Connect your wallet to access this content.</h2>
    <p>This page is available exclusively to wallet-verified readers. Connect any Ethereum wallet — MetaMask, Rainbow, Coinbase Wallet, or any WalletConnect-compatible mobile wallet.</p>
    <p>No transaction. No gas. Just a signature to prove ownership.</p>
    <button class="gate-connect-btn" onclick="Web3Auth.requireAuth()">Connect Wallet →</button>
  </div>
</div>

<!-- GATED CONTENT — shown only when wallet connected -->
<div data-web3-gate>
  <div class="page-hero">
    <p class="eyebrow">Members</p>
    <h1>Premium Content</h1>
    <p class="subtitle">Connected as <span id="web3-address" style="color:var(--rust);font-size:.8em;"></span></p>
  </div>

  <div class="page-content">

## Welcome

You are verified. This content is visible only to wallet-connected readers.

---

## How to add more gated pages

Add any page in `pages/` with this structure:

```html
<!-- Lock screen -->
<div data-web3-locked>
  <div class="gate-screen">
    <h2>Connect your wallet</h2>
    <button class="gate-connect-btn" onclick="Web3Auth.requireAuth()">
      Connect Wallet →
    </button>
  </div>
</div>

<!-- Gated content -->
<div data-web3-gate>
  Your premium content here.
</div>
```

The `web3-auth.js` script handles showing/hiding automatically.

  </div>
</div>
