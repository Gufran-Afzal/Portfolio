document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('navLinks');
  const links = document.querySelectorAll('.header_nav-link');

  function toggleMenu() {
    const isOpen = nav.classList.toggle('open');
    hamburger.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  hamburger.addEventListener('click', toggleMenu);

  links.forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      nav.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  // Portfolio Tab Filtering
  const tabs = document.querySelectorAll('.portfolio-section-tab');
  const cols = document.querySelectorAll('.portfolio-section_col');

  if (tabs.length && cols.length) {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        if (tab.classList.contains('active')) return;

        // Update active tab class
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const filterValue = tab.getAttribute('data-filter');

        // Phase 1: Fade out visible elements
        cols.forEach(col => {
          if (!col.classList.contains('hidden')) {
            col.classList.add('fade-out');
          }
        });

        // Phase 2: Toggle hidden state and fade-in the filtered elements
        setTimeout(() => {
          cols.forEach(col => {
            const matchesFilter = filterValue === 'all' || col.classList.contains(filterValue);

            if (matchesFilter) {
              col.classList.remove('hidden', 'fade-out');
              // Trigger a reflow to reset the CSS keyframe animation
              void col.offsetHeight;
              col.classList.add('fade-in');
            } else {
              col.classList.add('hidden');
              col.classList.remove('fade-out', 'fade-in');
            }
          });

          // Phase 3: Clean up fade-in class after animation finishes
          setTimeout(() => {
            cols.forEach(col => col.classList.remove('fade-in'));
          }, 350);

        }, 350);
      });
    });
  }
});

/**
* Trap keyboard focus inside a container (e.g. modal).
* Returns a controller with a cleanup method.
*/
function trapFocus(container, initialFocus = null) {
  // Collect focusable elements inside container
  const focusable = Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex^="-"])'
    )
  );

  if (!focusable.length) return; // no focusable elements

  const firstEl = focusable[0];
  const lastEl = focusable[focusable.length - 1];

  // Focus initial element or first available
  (initialFocus || firstEl).focus();

  function onKeydown(e) {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      // Shift + Tab (backward)
      if (document.activeElement === firstEl || document.activeElement === container) {
        e.preventDefault();
        lastEl.focus();
      }
    } else {
      // Tab forward
      if (document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }

    // ✅ Extra safeguard: if focus escapes, bring it back
    if (!container.contains(document.activeElement)) {
      e.preventDefault();
      firstEl.focus();
    }
  }

  function onFocusIn(e) {
    if (!container.contains(e.target)) {
      // Force focus back inside
      e.stopPropagation();
      firstEl.focus();
    }
  }

  document.addEventListener("keydown", onKeydown);
  document.addEventListener("focusin", onFocusIn);

  return {
    release(returnTo = null) {
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("focusin", onFocusIn);
      if (returnTo) returnTo.focus();
    }
  };
}

class ModalComponent extends HTMLElement {
  constructor() {
    super();

    // In your structure, <modal-component> itself is the dialog
    this.modal = this.querySelector(".modal-container") || this;

    // Overlay + close button
    this.overlay = this.querySelector(".modal-overlay");
    this.closeBtn = this.querySelector(".btn-close-modal");

    // Trap focus handler
    this.trap = null;

    // Opener reference for returning focus
    this.opener = null;

    // Bind methods once
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onOutsideClick = this.onOutsideClick.bind(this);
  }

  connectedCallback() {
    // Attach open buttons automatically
    document.querySelectorAll(`[data-modal-target="#${this.id}"]`)
      .forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          this.open(btn);
        });
      });

    // Close button inside modal
    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () => this.close());
    }
  }

  open(opener = null) {
    this.classList.add("is-active");
    document.body.classList.add("no-scroll");

    // Trap focus inside modal container
    this.trap = trapFocus(this.modal, this.closeBtn || this.modal);

    // Store opener for restoring focus later
    this.opener = opener;

    // Accessibility state
    this.setAttribute("aria-hidden", "false");

    // Event listeners
    document.addEventListener("keyup", this.onKeyUp);
    if (this.overlay) this.overlay.addEventListener("click", this.onOutsideClick);
  }

  close() {
    this.classList.remove("is-active");
    document.body.classList.remove("no-scroll");

    // Release focus trap
    if (this.trap) {
      this.trap.release(this.opener);
      this.trap = null;
    }

    // Restore focus to opener
    if (this.opener) {
      this.opener.focus();
      this.opener = null;
    }

    // Accessibility state
    this.setAttribute("aria-hidden", "true");

    // Remove listeners
    document.removeEventListener("keyup", this.onKeyUp);
    if (this.overlay) this.overlay.removeEventListener("click", this.onOutsideClick);
  }

  onKeyUp(e) {
    if (e.key === "Escape") {
      this.close();
    }
  }

  onOutsideClick(e) {
    if (e.target === this.overlay) {
      this.close();
    }
  }
}

// Register custom element safely
if (!customElements.get("modal-component")) {
  customElements.define("modal-component", ModalComponent);
}