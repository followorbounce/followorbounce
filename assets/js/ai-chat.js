/**
 * ai-chat.js — Follow or Bounce
 * Floating AI chat widget powered by Google Gemini.
 * API key should be stored in a server-side environment variable in production.
 * For GitHub Pages (static only), this calls Gemini directly from the client.
 *
 * ⚠️  Never commit a real API key to a public repository.
 *     Use a backend proxy or environment variable injection in production.
 */

(function () {
  'use strict';

  // ── CONFIG ────────────────────────────────────────────────────────────────────
  // Replace with your actual key or wire up a backend proxy endpoint.
  var API_KEY = '';
  var GEMINI_ENDPOINT =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + API_KEY;

  // ── ELEMENTS ──────────────────────────────────────────────────────────────────
  var fab     = document.querySelector('.ai-chat__button');
  var modal   = document.querySelector('.ai-chat__modal');
  var closeBtn = document.querySelector('.ai-chat__close');
  var input   = document.querySelector('.ai-chat__input');
  var sendBtn = document.querySelector('.ai-chat__send');
  var messages = document.querySelector('.ai-chat__messages');

  if (!fab || !modal) return; // Widget not present on this page

  // ── OPEN / CLOSE ──────────────────────────────────────────────────────────────
  fab.addEventListener('click', function () {
    modal.classList.add('is-open');
    modal.removeAttribute('aria-hidden');
    input && input.focus();
  });

  function closeChat() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    fab && fab.focus();
  }

  closeBtn && closeBtn.addEventListener('click', closeChat);

  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeChat();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeChat();
  });

  // ── SEND MESSAGE ──────────────────────────────────────────────────────────────
  function appendMessage(role, text) {
    var p = document.createElement('p');
    p.innerHTML = '<b>' + (role === 'user' ? 'You' : 'AI') + ':</b> ' + escapeHtml(text);
    messages.appendChild(p);
    messages.scrollTop = messages.scrollHeight;
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  async function sendMessage() {
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;

    appendMessage('user', text);
    input.value = '';

    try {
      var res = await fetch(GEMINI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: text }] }] })
      });

      var data = await res.json();
      var reply = (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0].text
      ) || 'No response received.';

      appendMessage('ai', reply);
    } catch (err) {
      appendMessage('ai', 'Error contacting AI. Please try again.');
      console.error('[ai-chat]', err);
    }
  }

  sendBtn && sendBtn.addEventListener('click', sendMessage);
  input && input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

})();
