/* ==================================================================
  scroll-reveal.js — WAVE-STAGGER ENGINE  v2
  Responsive-safe: thresholds auto-clamp so mobile never gets stuck.
  ================================================================== */

const ghost = document.getElementById('ghostHeader');
const overlay = document.getElementById('headerMobileOverlay');
const toggles = document.querySelectorAll('[data-menu-toggle]');
const mobileLinks = overlay.querySelectorAll('.header_mobile-link, .header_mobile-cta');
const STICKY_OFFSET = 200; // roughly the primary header's own height
let ticking = false;
let menuOpen = false;

// --- Ghost header fade-in, rAF-throttled so it's synced to paint ---
function updateGhostState() {
  const shouldShow = window.scrollY > STICKY_OFFSET;
  ghost.classList.toggle('header-ghost--visible', shouldShow);

  // Keep the hidden ghost header out of the tab order / AT tree.
  // `inert` (native, no polyfill needed in evergreen browsers) disables
  // focus + interaction on everything inside it in one line.
  ghost.toggleAttribute('inert', !shouldShow);
  ghost.setAttribute('aria-hidden', String(!shouldShow));

  ticking = false;
}
function handleScroll() {
  if (!ticking) {
    requestAnimationFrame(updateGhostState);
    ticking = true;
  }
}
window.addEventListener('scroll', handleScroll, { passive: true });
updateGhostState();

// --- Shared mobile popup menu, triggerable from either header ---
function openMenu() {
  menuOpen = true;
  overlay.classList.add('header_mobile-overlay--open');
  toggles.forEach((btn) => {
    btn.classList.add('header_toggle--active');
    btn.setAttribute('aria-expanded', 'true');
  });
  document.body.classList.add('header_no-scroll');
}
function closeMenu(focusTarget) {
  menuOpen = false;
  overlay.classList.remove('header_mobile-overlay--open');
  toggles.forEach((btn) => {
    btn.classList.remove('header_toggle--active');
    btn.setAttribute('aria-expanded', 'false');
  });
  document.body.classList.remove('header_no-scroll');
  if (focusTarget) focusTarget.focus();
}

toggles.forEach((btn) => {
  btn.addEventListener('click', () => (menuOpen ? closeMenu(btn) : openMenu()));
});
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeMenu(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuOpen) closeMenu();
});
mobileLinks.forEach((link) => link.addEventListener('click', () => closeMenu()));
window.addEventListener('resize', () => {
  if (window.innerWidth >= 992 && menuOpen) closeMenu();
});

(function () {
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DESKTOP_BREAKPOINT = 900; // px — char animation only runs above this width
  var isMobile = window.innerWidth < DESKTOP_BREAKPOINT;
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
 
      if (type === 'chars' && !isMobile) {
        // Desktop only: split heading into individual chars and animate each one
        splitChars(el);
        var chars = el.querySelectorAll('.js-anim-char');
        chars.forEach(function (c, ci) {
          setTimeout(function () { c.classList.add('is-visible'); }, startAt + ci * CHAR_STEP);
        });
      } else {
        // Mobile (or any non-chars type): simple opacity + translateY reveal — no extra DOM nodes
        // Make sure the element itself is visible (chars sets opacity:1 via CSS, others start at 0)
        if (type === 'chars') {
          // On mobile the heading has opacity:1 from CSS already, just mark it visible
          el.classList.add('is-visible');
        } else {
          setTimeout(function () { el.classList.add('is-visible'); }, startAt);
        }
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


/* ==================================================================
   process-timeline.js — scroll-linked progress timeline
   Pair with .process-section markup (data-process-list / -track /
   -fill / -step / -icon attributes). Self-contained, one section
   per page assumed; duplicate the data-process-list block if you
   ever need a second timeline.

   How it works:
   - A single "trigger line" sits at 50% of the viewport height.
   - Progress = how far that trigger line has traveled down the
     track (0 at the top icon, 1 at the bottom icon), clamped 0–1.
   - The fill bar's height is set directly from that progress.
   - A step is marked .is-active the moment the trigger line reaches
     or passes its icon's center — the exact same reference point
     the fill bar uses, so the bar and the active cards can never
     drift out of sync.
   ================================================================== */
(function () {
  var list = document.querySelector('[data-process-list]');
  if (!list) return;

  var track = list.querySelector('[data-process-track]');
  var fill = list.querySelector('[data-process-fill]');
  var steps = Array.prototype.slice.call(list.querySelectorAll('[data-process-step]'));
  if (!track || !fill || !steps.length) return;

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    steps.forEach(function (step) { step.classList.add('is-active'); });
    fill.style.height = '100%';
    return;
  }

  var icons = steps.map(function (step) { return step.querySelector('[data-process-icon]'); });
  var ticking = false;
  var resizeTimer = null;

  // Positions the track/fill container to span exactly from the first
  // icon's center to the last icon's center, measured against the
  // list. Re-run on resize since card heights reflow at each breakpoint.
  function measureTrack() {
    var listRect = list.getBoundingClientRect();
    var firstRect = icons[0].getBoundingClientRect();
    var lastRect = icons[icons.length - 1].getBoundingClientRect();
    var top = (firstRect.top + firstRect.height / 2) - listRect.top;
    var bottom = (lastRect.top + lastRect.height / 2) - listRect.top;
    track.style.top = top + 'px';
    track.style.height = Math.max(bottom - top, 0) + 'px';
  }

  function update() {
    ticking = false;
    var triggerY = window.innerHeight * 0.5;
    var trackRect = track.getBoundingClientRect();

    var progress = trackRect.height > 0
      ? (triggerY - trackRect.top) / trackRect.height
      : 0;
    progress = Math.min(Math.max(progress, 0), 1);

    fill.style.height = (progress * 100) + '%';

    icons.forEach(function (icon, i) {
      var rect = icon.getBoundingClientRect();
      var center = rect.top + rect.height / 2;
      steps[i].classList.toggle('is-active', center <= triggerY);
    });
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      measureTrack();
      update();
    }, 120);
  }

  measureTrack();
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
})();