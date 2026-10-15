/* ==================================================================
   article.js — reading progress bar + copy buttons for code blocks
   ================================================================== */
(function () {
  'use strict';

  /* ---- reading progress ---- */
  var bar = document.querySelector('[data-read-progress]');
  var article = document.querySelector('.prose--article');
  if (bar && article) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var rect = article.getBoundingClientRect();
      var total = rect.height - window.innerHeight * 0.6;
      var done = Math.min(Math.max(-rect.top + window.innerHeight * 0.2, 0), Math.max(total, 1));
      bar.style.transform = 'scaleX(' + (total > 0 ? done / total : 1) + ')';
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---- copy buttons ---- */
  document.querySelectorAll('[data-code-block]').forEach(function (block) {
    var btn = block.querySelector('[data-copy]');
    var code = block.querySelector('code');
    if (!btn || !code) return;

    function fallbackCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      return ok;
    }

    btn.addEventListener('click', function () {
      var text = code.textContent;
      var done = function (ok) {
        btn.textContent = ok ? 'Copied' : 'Press Ctrl+C';
        setTimeout(function () { btn.textContent = 'Copy'; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
      } else {
        done(fallbackCopy(text));
      }
    });
  });
})();
