/* ==================================================================
   filters.js — category chips + optional search for listing pages
   Progressive enhancement: the full list is server-rendered HTML, so
   without JS every item is simply visible. State syncs to the URL
   (?category=...&q=...) so filtered views can be shared / bookmarked.
   ================================================================== */
(function () {
  'use strict';
  var grid = document.querySelector('[data-filter-grid]');
  if (!grid) return;

  var items   = Array.prototype.slice.call(grid.querySelectorAll('[data-item]'));
  var chips   = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var search  = document.querySelector('[data-filter-search]');
  var status  = document.querySelector('[data-filter-status]');
  var empty   = document.querySelector('[data-filter-empty]');
  var resetBt = document.querySelector('[data-filter-reset]');
  var noun    = status ? status.getAttribute('data-noun') : 'items';
  var valid   = chips.map(function (c) { return c.getAttribute('data-filter'); });

  var state = { category: 'all', q: '' };

  // read initial state from the URL (ignore unknown categories)
  var params = new URLSearchParams(window.location.search);
  var urlCat = params.get('category');
  if (urlCat && valid.indexOf(urlCat) > -1) state.category = urlCat;
  state.q = (params.get('q') || '').toLowerCase().trim();
  if (search) search.value = params.get('q') || '';

  function syncUrl() {
    var next = new URLSearchParams();
    if (state.category !== 'all') next.set('category', state.category);
    if (state.q) next.set('q', state.q);
    var qs = next.toString();
    history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
  }

  function apply(animate) {
    var shown = 0;
    items.forEach(function (el) {
      var catOk = state.category === 'all' || el.getAttribute('data-category') === state.category;
      var qOk = !state.q || (el.getAttribute('data-search') || el.textContent.toLowerCase()).indexOf(state.q) > -1;
      var match = catOk && qOk;
      var wasHidden = el.hidden;
      el.hidden = !match;
      if (match) {
        shown++;
        if (animate && wasHidden) {
          el.classList.add('is-entering');
          el.addEventListener('animationend', function done() {
            el.classList.remove('is-entering');
            el.removeEventListener('animationend', done);
          });
        }
      }
    });

    chips.forEach(function (c) {
      var on = c.getAttribute('data-filter') === state.category;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-pressed', String(on));
    });

    if (status) {
      status.textContent = shown === items.length
        ? 'Showing all ' + items.length + ' ' + noun
        : 'Showing ' + shown + ' of ' + items.length + ' ' + noun;
    }
    if (empty) empty.hidden = shown !== 0;
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      state.category = chip.getAttribute('data-filter');
      apply(true);
      syncUrl();
    });
  });

  if (search) {
    var t;
    search.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        state.q = search.value.toLowerCase().trim();
        apply(true);
        syncUrl();
      }, 120);
    });
  }

  if (resetBt) {
    resetBt.addEventListener('click', function () {
      state.category = 'all';
      state.q = '';
      if (search) search.value = '';
      apply(true);
      syncUrl();
    });
  }

  apply(false);
})();
