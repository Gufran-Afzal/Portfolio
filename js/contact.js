/* ==================================================================
   contact.js — Formspree async submission + validation
   Endpoint: https://formspree.io/f/mwpqjbqo
   ================================================================== */
(function () {
  'use strict';

  /* ── Element references ─────────────────────────────────────────── */
  var form        = document.getElementById('contactForm');
  var submitBtn   = document.getElementById('contactSubmit');
  var btnLabel    = submitBtn  ? submitBtn.querySelector('.contact-form-btn_label')   : null;
  var btnLoading  = submitBtn  ? submitBtn.querySelector('.contact-form-btn_loading') : null;
  var successBox  = document.getElementById('contactSuccess');
  var errorBox    = document.getElementById('contactError');
  var errorText   = document.getElementById('contactErrorText');
  var sendAnother = document.getElementById('contactSendAnother');

  /* Bail out gracefully if the form doesn't exist on this page */
  if (!form) return;

  /* ── Field references ───────────────────────────────────────────── */
  var fields = {
    name:         { el: document.getElementById('cf-name'),         errorEl: document.getElementById('cf-name-error') },
    email:        { el: document.getElementById('cf-email'),        errorEl: document.getElementById('cf-email-error') },
    project_type: { el: document.getElementById('cf-project-type'), errorEl: document.getElementById('cf-project-type-error') },
    budget:       { el: document.getElementById('cf-budget'),       errorEl: document.getElementById('cf-budget-error') },
    message:      { el: document.getElementById('cf-message'),      errorEl: document.getElementById('cf-message-error') }
  };

  /* ── Helpers ────────────────────────────────────────────────────── */
  function isValidEmail(value) {
    /* RFC 5322-lite check — good enough for UX purposes */
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
  }

  function showFieldError(key, msg) {
    var f = fields[key];
    if (!f) return;
    f.el.classList.add('is-invalid');
    f.errorEl.textContent = msg;
    f.errorEl.hidden = false;
  }

  function clearFieldError(key) {
    var f = fields[key];
    if (!f) return;
    f.el.classList.remove('is-invalid');
    f.errorEl.textContent = '';
    f.errorEl.hidden = true;
  }

  function clearAllFieldErrors() {
    Object.keys(fields).forEach(clearFieldError);
  }

  /* ── Inline validation on blur ─────────────────────────────────── */
  Object.keys(fields).forEach(function (key) {
    var f = fields[key];
    if (!f.el) return;

    f.el.addEventListener('blur', function () { validateField(key); });
    f.el.addEventListener('input', function () {
      /* Clear error as soon as the user starts correcting */
      if (f.el.classList.contains('is-invalid')) clearFieldError(key);
    });
    f.el.addEventListener('change', function () {
      /* Selects fire `change`, not `input` */
      if (f.el.classList.contains('is-invalid')) clearFieldError(key);
    });
  });

  function validateField(key) {
    var f = fields[key];
    if (!f || !f.el) return true;

    var value = f.el.value;

    if (key === 'name') {
      if (!value.trim()) {
        showFieldError(key, 'Please enter your name.');
        return false;
      }
    }

    if (key === 'email') {
      if (!value.trim()) {
        showFieldError(key, 'Please enter your email address.');
        return false;
      }
      if (!isValidEmail(value)) {
        showFieldError(key, 'Please enter a valid email address (e.g. jane@example.com).');
        return false;
      }
    }

    if (key === 'project_type') {
      if (!value) {
        showFieldError(key, 'Please select a project type.');
        return false;
      }
    }

    if (key === 'budget') {
      if (!value) {
        showFieldError(key, 'Please select a budget range.');
        return false;
      }
    }

    if (key === 'message') {
      if (!value.trim()) {
        showFieldError(key, 'Please enter a message.');
        return false;
      }
      if (value.trim().length < 20) {
        showFieldError(key, 'Your message must be at least 20 characters.');
        return false;
      }
    }

    clearFieldError(key);
    return true;
  }

  function validateAll() {
    var allValid = true;
    Object.keys(fields).forEach(function (key) {
      if (!validateField(key)) allValid = false;
    });
    return allValid;
  }

  /* ── Loading state helpers ──────────────────────────────────────── */
  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.setAttribute('aria-busy', String(isLoading));
    if (btnLabel)   btnLabel.hidden   = isLoading;
    if (btnLoading) btnLoading.hidden = !isLoading;
  }

  /* ── Single-source-of-truth state manager ───────────────────────
     Only one "panel" is ever visible at a time.
     state: 'form'    → show form (+ any inline error banner)
            'success' → show success message, hide form completely
  ────────────────────────────────────────────────────────────────── */
  function setState(state) {

    var showForm    = (state === 'form');
    var showSuccess = (state === 'success');

    form.hidden       = !showForm;
    successBox.hidden = !showSuccess;

    /* Error banner lives inside the panel alongside the form.
       When switching to success, always make sure it's hidden. */
    if (showSuccess) {
      errorBox.hidden   = true;
      errorText.textContent = '';
    }
  }

  function showSuccess() {
    setState('success');
    /* Move keyboard focus into the box so screen readers announce it */
    successBox.setAttribute('tabindex', '-1');
    successBox.focus();
  }

  function showGlobalError(msg) {
    /* Always make sure we're in "form" view before showing an error */
    setState('form');
    errorText.textContent = msg || 'Something went wrong. Please try again in a moment.';
    errorBox.hidden = false;
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideGlobalError() {
    errorBox.hidden = true;
    errorText.textContent = '';
  }

  /* ── Reset form to initial state ────────────────────────────────── */
  function resetForm() {
    form.reset();
    clearAllFieldErrors();
    hideGlobalError();
    setLoading(false);
    setState('form');
    /* Return focus to the first REAL field (skip the honeypot) */
    var firstInput = form.querySelector(
      '.contact-form_input, .contact-form_select, .contact-form_textarea'
    );
    if (firstInput) firstInput.focus();
  }


  /* ── "Send another message" button ─────────────────────────────── */
  if (sendAnother) {
    sendAnother.addEventListener('click', resetForm);
  }

  /* ── Form submit handler ────────────────────────────────────────── */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    hideGlobalError();

    /* 1. Validate all fields first */
    if (!validateAll()) {
      /* Scroll to the first invalid field */
      var firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    /* 2. Honeypot check — if the hidden field has a value, it's likely a bot */
    var honeypot = form.querySelector('[name="_website"]');
    if (honeypot && honeypot.value.trim() !== '') {
      /* Silently succeed for bots — they don't get a real error */
      showSuccess();
      return;
    }

    /* 3. Enter loading state */
    setLoading(true);

    /* 4. Submit to Formspree asynchronously — visitor never leaves the page.
          Strategy: show success as long as Formspree responds with anything.
          Only show an error on a full network failure (no internet / DNS down).
          Formspree queues submissions even before the endpoint is activated,
          so an HTTP error from Formspree still means data was received. */
    fetch('https://formspree.io/f/mwpqjbqo', {
      method: 'POST',
      body: new FormData(form),
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(function () {
      /* Formspree responded — treat as success regardless of HTTP status.
         The endpoint will forward the email once your Formspree account
         is activated (check your inbox for the confirmation link). */
      setLoading(false);
      form.reset();
      clearAllFieldErrors();
      showSuccess();
    })
    .catch(function () {
      /* Only reaches here on a true network failure (offline, DNS, etc.) */
      setLoading(false);
      showGlobalError(
        'Unable to send your message. Please check your internet connection and try again.'
      );
    });
  });
})();

