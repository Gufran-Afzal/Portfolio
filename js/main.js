/* ==================================================================
   scroll-reveal.js — WAVE-STAGGER ENGINE  v2
   Responsive-safe: thresholds auto-clamp so mobile never gets stuck.
   ================================================================== */
(function () {
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DEFAULT_WAVE_STEP = 80;   // ms between each index step — tighter = smoother wave
  var COUNTER_KICKOFF = 150;    // ms after an element reveals before its counter starts
  var CHAR_STEP = 24;           // ms between each character starting (tighter = more fluid)
  var CHAR_DURATION = 600;      // ms, matches .js-anim-char transition
 
  function splitChars(el) {
    // Walks the element's children instead of flattening textContent, so any
    // nested tags (e.g. a highlighted word in a heading line) survive intact
    // — every text node at any depth gets wrapped in .js-anim-char spans,
    // and the --i counter stays continuous across the whole line.
    var i = 0;
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === Node.TEXT_NODE) {
          var frag = document.createDocumentFragment();
          child.textContent.split('').forEach(function (ch) {
            var span = document.createElement('span');
            span.className = 'js-anim-char';
            span.style.setProperty('--i', i);
            span.textContent = ch === ' ' ? '\u00A0' : ch;
            frag.appendChild(span);
            i++;
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    }
    walk(el);
    return i;
  }
 
  function animateCount(el, delay) {
    var target = parseInt(el.getAttribute('data-count-to'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = parseInt(el.getAttribute('data-count-duration') || '1200', 10);
 
    setTimeout(function () {
      if (prefersReducedMotion) { el.textContent = target + suffix; return; }
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1); // linear, no easing curve
        el.textContent = Math.floor(progress * target) + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      }
      requestAnimationFrame(step);
    }, Math.max(delay, 0));
  }
 
  function instantReveal(group) {
    group.querySelectorAll('[data-animate]').forEach(function (el) { el.classList.add('is-visible'); });
    group.querySelectorAll('[data-count-to]').forEach(function (el) {
      var target = el.getAttribute('data-count-to');
      var suffix = el.getAttribute('data-suffix') || '';
      el.textContent = target + suffix;
    });
  }
 
  function runGroup(group) {
    if (prefersReducedMotion) { instantReveal(group); return; }
 
    var waveStep = parseInt(group.getAttribute('data-animate-wave') || String(DEFAULT_WAVE_STEP), 10);
    var items = Array.prototype.slice.call(group.querySelectorAll('[data-animate]'));
 
    // Each item's start time is derived purely from its index in the wave
    // (auto DOM order, or an explicit data-animate-index override) plus an
    // optional fine-tune delay. Items no longer wait for prior items to
    // finish animating — they all fire independently, overlapping freely.
    items.forEach(function (el, autoIndex) {
      var type = el.getAttribute('data-animate');
      var idxAttr = el.getAttribute('data-animate-index');
      var index = idxAttr !== null && idxAttr !== '' ? parseFloat(idxAttr) : autoIndex;
      var extraDelay = parseInt(el.getAttribute('data-animate-delay') || '0', 10);
      var startAt = Math.max(index * waveStep + extraDelay, 0);
 
      if (type === 'chars') {
        var n = splitChars(el);
        var chars = el.querySelectorAll('.js-anim-char');
        chars.forEach(function (c, ci) {
          setTimeout(function () { c.classList.add('is-visible'); }, startAt + ci * CHAR_STEP);
        });
      } else {
        setTimeout(function () { el.classList.add('is-visible'); }, startAt);
      }
 
      // any counters living inside (or on) this element start right after
      // THIS element reveals — not after the whole sequence up to it.
      var counters = el.hasAttribute('data-count-to') ? [el] : el.querySelectorAll('[data-count-to]');
      counters.forEach(function (c, ci) {
        animateCount(c, startAt + COUNTER_KICKOFF + ci * 60);
      });
    });
  }
 
  var groups = document.querySelectorAll('[data-animate-group]');
  groups.forEach(function (group) {
    var rawThreshold = parseFloat(group.getAttribute('data-animate-threshold') || '0.3');

    // Clamp threshold so it never exceeds what the viewport can actually show.
    // If the section is taller than the viewport, a threshold of "1" would never
    // fire on mobile — so we cap it at (viewportH / groupH) * 0.85.
    function safeThreshold() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var groupH = group.getBoundingClientRect().height || vh;
      var maxSafe = Math.min(1, (vh / groupH) * 0.85);
      return Math.min(rawThreshold, maxSafe);
    }

    var threshold = safeThreshold();

    // rootMargin "-10% 0px": animation triggers when the element has scrolled
    // 10% of the viewport height into view — gives a slightly-ahead-of-time
    // feel that makes the wave look more natural while scrolling.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { runGroup(group); io.disconnect(); }
      });
    }, { threshold: threshold, rootMargin: '0px 0px -8% 0px' });
    io.observe(group);
  });
})();