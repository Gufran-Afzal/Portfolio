/* ==================================================================
   scroll-reveal.js — THE REUSABLE ENGINE (wave-stagger version)
   Drop this file once in assets/js/. It reads a handful of
   data-attributes and needs no per-section edits ever again:
 
   data-animate-group              → put on the outer wrapper of a
                                      section. Everything inside with
                                      data-animate runs as one wave
                                      once the group scrolls into view.
   data-animate-threshold="0.3"    → optional, how much of the group
                                      must be visible to trigger (0–1)
   data-animate-wave="90"          → optional, ms between each index
                                      step (default 90). Lower = tighter
                                      wave, higher = more staggered.
 
   data-animate="chars"            → splits text into characters and
                                      reveals them with blur + slide,
                                      staggered.
   data-animate="fade-up|fade-left|fade-right|fade-in|scale-in"
                                    → generic directional reveal.
 
   data-animate-index="2"          → optional. Overrides this element's
                                      position in the wave. Elements with
                                      the SAME index start at the exact
                                      same time (e.g. give a heading and
                                      a side image both index="0" so the
                                      image slides in alongside the
                                      heading instead of after it).
                                      If omitted, elements get an index
                                      automatically based on DOM order
                                      (0, 1, 2, ...).
   data-animate-delay="200"        → optional ms fine-tune, +/- allowed,
                                      added on TOP of index * wave. Use
                                      this for small nudges; use
                                      data-animate-index for "this
                                      should clearly happen at the same
                                      beat as that other element".
 
   data-count-to="30"              → put directly on any element (or
   data-suffix="+"                   nested inside a data-animate
   data-count-duration="1200"        element) to linear-count it up.
                                      Starts shortly after its parent's
                                      own reveal fires — not after the
                                      whole sequence before it finishes.
   ================================================================== */
(function () {
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DEFAULT_WAVE_STEP = 90;   // ms between each index step in the wave
  var COUNTER_KICKOFF = 150;    // ms after an element reveals before its counter starts
  var CHAR_STEP = 28;           // ms between each character starting
  var CHAR_DURATION = 550;      // ms, matches .js-anim-char transition
 
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
    var threshold = parseFloat(group.getAttribute('data-animate-threshold') || '0.3');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { runGroup(group); io.disconnect(); }
      });
    }, { threshold: threshold });
    io.observe(group);
  });
})();