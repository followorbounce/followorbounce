/**
 * assets/js/ai-widget.js
 * AI floating chat widget.
 * Loaded only on pages with `ai_widget: true` in front-matter.
 *
 * Replace API_KEY and endpoint with your provider of choice.
 * By default this targets the Gemini API; swap for Anthropic etc.
 */

(function () {
  'use strict';

  const API_KEY = ''; // ← set via Jekyll environment variable or _config.yml secret
  const modal   = document.getElementById('aiModal');
  const messages = document.getElementById('aiMessages');
  const trigger  = document.getElementById('aiButton');

  if (!modal || !messages || !trigger) return;

  // ── Open ─────────────────────────────────────────────────────
  trigger.addEventListener('click', () => {
    modal.hidden = false;
    modal.removeAttribute('hidden');
    trigger.setAttribute('aria-expanded', 'true');
    document.getElementById('aiInput')?.focus();
  });

  // ── Close ─────────────────────────────────────────────────────
  window.closeAI = function () {
    modal.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  };

  // Close on backdrop click
  modal.addEventListener('click', e => {
    if (e.target === modal) closeAI();
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) closeAI();
  });

  // ── Send message ─────────────────────────────────────────────
  window.sendAI = async function () {
    const input = document.getElementById('aiInput');
    const text  = input?.value?.trim();
    if (!text) return;

    appendMessage('You', text);
    input.value = '';

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text }] }] }),
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data  = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
      appendMessage('AI', reply);

    } catch (err) {
      appendMessage('Error', err.message);
    }
  };

  // ── Enter key in input ────────────────────────────────────────
  document.getElementById('aiInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAI();
    }
  });

  // ── Helper ────────────────────────────────────────────────────
  function appendMessage (sender, text) {
    const p = document.createElement('p');
    p.innerHTML = `<strong>${sender}:</strong> ${escapeHtml(text)}`;
    messages.appendChild(p);
    messages.scrollTop = messages.scrollHeight;
  }

  function escapeHtml (str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

}());
