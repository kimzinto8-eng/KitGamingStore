/* ==========================================================================
   KIT GAMING STORE — app.js
   Rebuilt as plain vanilla JS (no framework) for local static use.
   ========================================================================== */

/* ==========================================================================
   SECTION 1: SHARED STATE
   ========================================================================== */
const KIT_STATE = {
  selectedPackage: null,
  selectedPayment: 'khqr',
  gameId: '',
  serverId: '',
};

/* ==========================================================================
   SECTION 2: USERINFO AUTOFILL
   ========================================================================== */
(function userInfoModule() {
  const STORAGE_KEY = 'kitGamingStore_userInfo';

  function readUserInfo() {
    let raw = null;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch (_error) {
      return null;
    }
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      const gameId = String(parsed.gameId || '').trim();
      const serverId = String(parsed.serverId || '').trim();
      if (!gameId) return null;
      return { gameId, serverId };
    } catch (_error) {
      return null;
    }
  }

  function writeUserInfo(gameId, serverId) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ gameId, serverId })
      );
    } catch (_error) {
      // Ignore storage failures (private browsing, quota, etc.)
    }
  }

  function applyToFieldPair(gameField, serverField) {
    const info = readUserInfo();
    if (!info) return;

    if (gameField && !gameField.value) {
      gameField.value = info.gameId;
    }
    if (serverField && !serverField.value && info.serverId) {
      serverField.value = info.serverId;
    }
  }

  function handleFieldInput() {
    const mobileGame = document.getElementById('game_id');
    const mobileServer = document.getElementById('server_id');
    const desktopGame = document.getElementById('game_id_desktop');
    const desktopServer = document.getElementById('server_id_desktop');

    const gameId = (this.dataset.userField === 'game-id')
      ? this.value
      : (mobileGame && mobileGame.value) || (desktopGame && desktopGame.value) || '';
    const serverId = (this.dataset.userField === 'server-id')
      ? this.value
      : (mobileServer && mobileServer.value) || (desktopServer && desktopServer.value) || '';

    [mobileGame, desktopGame].forEach((field) => {
      if (field && field !== this && this.dataset.userField === 'game-id') {
        field.value = this.value;
      }
    });
    [mobileServer, desktopServer].forEach((field) => {
      if (field && field !== this && this.dataset.userField === 'server-id') {
        field.value = this.value;
      }
    });

    KIT_STATE.gameId = gameId;
    KIT_STATE.serverId = serverId;
    writeUserInfo(gameId, serverId);
  }

  function init() {
    const mobileGame = document.getElementById('game_id');
    const mobileServer = document.getElementById('server_id');
    const desktopGame = document.getElementById('game_id_desktop');
    const desktopServer = document.getElementById('server_id_desktop');

    applyToFieldPair(mobileGame, mobileServer);
    applyToFieldPair(desktopGame, desktopServer);

    KIT_STATE.gameId = (mobileGame && mobileGame.value) || (desktopGame && desktopGame.value) || '';
    KIT_STATE.serverId = (mobileServer && mobileServer.value) || (desktopServer && desktopServer.value) || '';

    const allFields = document.querySelectorAll(
      '[data-user-field="game-id"], [data-user-field="server-id"]'
    );
    allFields.forEach((field) => {
      field.addEventListener('input', handleFieldInput);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

/* ==========================================================================
   SECTION 3: PACKAGE CARD SELECTION
   Clicking a .package-card selects it (and deselects any other), reads
   its price/name, updates KIT_STATE, and triggers a UI refresh (total
   price + "Product" label across both desktop sidebar and mobile bar).

   NOTE — HTML DEPENDENCY: this reads data-price / data-name attributes
   that do NOT exist yet in the current HTML. Until the HTML rework pass
   adds them, this falls back to parsing the visible text content of
   .package-card-price and .package-card-titletext, which works but is
   more fragile (breaks if currency formatting changes). Once data-price/
   data-name are added, the parsing fallback becomes unnecessary but is
   left in place as a safety net.
   ========================================================================== */
(function packageSelectionModule() {
  function parsePrice(card) {
    if (card.dataset.price) {
      const fromAttr = parseFloat(card.dataset.price);
      if (!Number.isNaN(fromAttr)) return fromAttr;
    }
    const priceEl = card.querySelector('.package-card-price');
    if (!priceEl) return 0;
    const cleaned = (priceEl.textContent || '').replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function parseName(card) {
    if (card.dataset.name) return card.dataset.name;
    const nameEl = card.querySelector('.package-card-titletext');
    return nameEl ? nameEl.textContent.trim() : 'Selected Item';
  }

  function clearAllSelections() {
    document.querySelectorAll('.package-card').forEach((card) => {
      card.classList.remove('is-selected');
      card.setAttribute('aria-pressed', 'false');
    });
  }

  function selectCard(card) {
    clearAllSelections();
    card.classList.add('is-selected');
    card.setAttribute('aria-pressed', 'true');

    KIT_STATE.selectedPackage = {
      name: parseName(card),
      price: parsePrice(card),
    };

    document.dispatchEvent(new CustomEvent('kit:packageChanged'));
  }

  function handleCardClick(event) {
    const card = event.currentTarget;
    if (card.classList.contains('is-selected')) {
      card.classList.remove('is-selected');
      card.setAttribute('aria-pressed', 'false');
      KIT_STATE.selectedPackage = null;
      document.dispatchEvent(new CustomEvent('kit:packageChanged'));
      return;
    }
    selectCard(card);
  }

  function handleCardKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick(event);
    }
  }

  function init() {
    const cards = document.querySelectorAll('.package-card');
    cards.forEach((card) => {
      if (!card.hasAttribute('tabindex')) {
        card.setAttribute('tabindex', '0');
      }
      if (!card.hasAttribute('role')) {
        card.setAttribute('role', 'button');
      }
      if (!card.hasAttribute('aria-pressed')) {
        card.setAttribute('aria-pressed', 'false');
      }
      card.addEventListener('click', handleCardClick);
      card.addEventListener('keydown', handleCardKeydown);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

/* ==========================================================================
   SECTION 4: PAYMENT METHOD SELECTION
   Your HTML currently has two payment options per checkout panel:
     1. .khqr-img.payment-method-card  — ABA KHQR (already marked
        is-selected / aria-pressed="true" in source, i.e. the default)
     2. .wallet-option-card            — wallet option, marked
        is-disabled / aria-pressed="false" in source

   Since KHQR is the only enabled method right now, this module's main
   job is keeping that state consistent and ready for when/if a second
   payment method gets enabled later.
   ========================================================================== */
(function paymentMethodModule() {
  function isDisabled(card) {
    return card.classList.contains('is-disabled') ||
           card.getAttribute('aria-pressed') === null;
  }

  function clearAllSelections(scope) {
    scope.querySelectorAll('.payment-method-card').forEach((card) => {
      card.classList.remove('is-selected');
      card.setAttribute('aria-pressed', 'false');
    });
  }

  function selectMethod(card) {
    if (isDisabled(card)) return;

    const scope = card.closest('.payment-method-section') || document;
    clearAllSelections(scope);

    card.classList.add('is-selected');
    card.setAttribute('aria-pressed', 'true');

    if (card.classList.contains('khqr-img') ||
        card.querySelector('.khqr-title')) {
      KIT_STATE.selectedPayment = 'khqr';
    } else {
      KIT_STATE.selectedPayment = 'wallet';
    }

    document.dispatchEvent(new CustomEvent('kit:paymentChanged'));
  }

  function handleClick(event) {
    selectMethod(event.currentTarget);
  }

  function handleKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectMethod(event.currentTarget);
    }
  }

  function init() {
    const allMethodCards = document.querySelectorAll('.payment-method-card');
    allMethodCards.forEach((card) => {
      card.addEventListener('click', handleClick);
      card.addEventListener('keydown', handleKeydown);
    });

    const preselected = document.querySelector('.payment-method-card.is-selected');
    if (preselected) {
      KIT_STATE.selectedPayment = preselected.classList.contains('khqr-img')
        ? 'khqr'
        : 'wallet';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

/* ==========================================================================
   SECTION 5: CHECKOUT UI SYNC
   ========================================================================== */
(function checkoutUiSyncModule() {
  function formatPrice(amount) {
    return '$' + amount.toFixed(2);
  }

  function getAllTotalDisplays() {
    const desktopTotal = document.querySelector('.checkout-total .css-6xtbv3');
    const mobileTotal = document.querySelector('.pay-line .css-850r8c');
    return [desktopTotal, mobileTotal].filter(Boolean);
  }

  function getAllProductDisplays() {
    const mobileProduct = document.querySelector('.pay-line .css-1smue61');
    return [mobileProduct].filter(Boolean);
  }

  function getAllPayButtons() {
    return Array.from(document.querySelectorAll('#pay-button'));
  }

  function getCouponElements() {
    const input = document.querySelector('.coupon-input input');
    const button = document.querySelector('.coupon-btn');
    return { input, button };
  }

  function refreshTotals() {
    const pkg = KIT_STATE.selectedPackage;
    const amount = pkg ? pkg.price : 0;
    const formatted = formatPrice(amount);

    getAllTotalDisplays().forEach((el) => {
      el.textContent = formatted;
    });

    getAllProductDisplays().forEach((el) => {
      el.textContent = pkg ? pkg.name : '-';
    });
  }

  function refreshPayButton() {
    const canPay = Boolean(
      KIT_STATE.selectedPackage &&
      KIT_STATE.selectedPayment &&
      KIT_STATE.gameId
    );

    getAllPayButtons().forEach((btn) => {
      btn.disabled = !canPay;
      btn.classList.toggle('Mui-disabled', !canPay);
    });
  }

  function refreshCoupon() {
    const { input, button } = getCouponElements();
    const hasPackage = Boolean(KIT_STATE.selectedPackage);

    if (input) {
      input.disabled = !hasPackage;
    }
    if (button) {
      button.disabled = !hasPackage;
      button.classList.toggle('Mui-disabled', !hasPackage);
    }
  }

  function refreshAll() {
    refreshTotals();
    refreshPayButton();
    refreshCoupon();
  }

  function init() {
    document.addEventListener('kit:packageChanged', refreshAll);
    document.addEventListener('kit:paymentChanged', refreshAll);

    document.querySelectorAll('[data-user-field="game-id"]').forEach((field) => {
      field.addEventListener('input', refreshPayButton);
    });

    refreshAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

/* ==========================================================================
   SECTION 6: PAY NOW — MOCK CHECKOUT CONFIRMATION
   ========================================================================== */
(function payNowModule() {
  const MODAL_ID = 'kit-mock-checkout-modal';

  function buildModalMarkup(pkg) {
    return (
      '<div class="kit-modal-backdrop">' +
        '<div class="kit-modal-box" role="dialog" aria-modal="true" aria-labelledby="kit-modal-title">' +
          '<h2 id="kit-modal-title" class="kit-modal-title">Order Confirmed</h2>' +
          '<p class="kit-modal-copy">' +
            'You selected <strong>' + escapeHtml(pkg.name) + '</strong> for ' +
            '<strong>$' + pkg.price.toFixed(2) + '</strong>.' +
          '</p>' +
          '<p class="kit-modal-note">' +
            'This is a demo checkout — no real payment has been processed.' +
          '</p>' +
          '<button type="button" class="kit-modal-close">Close</button>' +
        '</div>' +
      '</div>'
    );
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function injectModalStyles() {
    const STYLE_ID = 'kit-mock-checkout-modal-style';
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.kit-modal-backdrop{position:fixed;inset:0;z-index:99999;',
        'background:rgba(8,13,27,0.72);display:flex;align-items:center;',
        'justify-content:center;padding:20px;}',
      '.kit-modal-box{max-width:360px;width:100%;background:#fff;',
        'border-radius:16px;padding:24px 20px;text-align:center;',
        'box-shadow:0 20px 60px rgba(0,0,0,0.45);',
        'font-family:"Cal Sans","Dangrek",ui-sans-serif,system-ui,sans-serif;}',
      '.kit-modal-title{margin:0 0 12px;font-size:1.25rem;font-weight:700;',
        'color:rgb(17,24,39);}',
      '.kit-modal-copy{margin:0 0 8px;font-size:0.95rem;color:rgb(17,24,39);',
        'line-height:1.5;}',
      '.kit-modal-note{margin:0 0 18px;font-size:0.8rem;color:#8a8a8a;}',
      '.kit-modal-close{appearance:none;border:0;border-radius:8px;',
        'padding:10px 20px;background:#C2410C;color:#fff;font-weight:600;',
        'font-size:0.9rem;cursor:pointer;width:100%;}',
      '.kit-modal-close:hover{background:#a83a0a;}',
    ].join('');
    document.head.appendChild(style);
  }

  function closeModal() {
    const existing = document.getElementById(MODAL_ID);
    if (existing) existing.remove();
  }

  function showConfirmation(pkg) {
    injectModalStyles();
    closeModal();

    const wrapper = document.createElement('div');
    wrapper.id = MODAL_ID;
    wrapper.innerHTML = buildModalMarkup(pkg);
    document.body.appendChild(wrapper);

    const closeBtn = wrapper.querySelector('.kit-modal-close');
    const backdrop = wrapper.querySelector('.kit-modal-backdrop');

    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }
    if (backdrop) {
      backdrop.addEventListener('click', function (event) {
        if (event.target === backdrop) closeModal();
      });
    }
    document.addEventListener('keydown', function escHandler(event) {
      if (event.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    });
  }

  function handlePayClick(event) {
    event.preventDefault();

    const pkg = KIT_STATE.selectedPackage;
    if (!pkg) return;

    showConfirmation(pkg);
  }

  function init() {
    document.querySelectorAll('#pay-button, #pay-now-btn, #pay-button-floating').forEach((btn) => {
      btn.addEventListener('click', handlePayClick);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

/* ==========================================================================
   SECTION 7: MOBILE MENU TOGGLE
   ========================================================================== */
(function mobileMenuModule() {
  const DRAWER_ID = 'kit-mobile-menu-drawer';
  const OVERLAY_ID = 'kit-mobile-menu-overlay';
  const OPEN_CLASS = 'kit-menu-open';

  function injectMenuStyles() {
    const STYLE_ID = 'kit-mobile-menu-style';
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '#' + OVERLAY_ID + '{',
        'position:fixed;inset:0;z-index:8888;',
        'background:rgba(8,13,27,0.6);',
        'opacity:0;pointer-events:none;',
        'transition:opacity 0.25s ease;}',
      '#' + OVERLAY_ID + '.' + OPEN_CLASS + '{',
        'opacity:1;pointer-events:all;}',
      '#' + DRAWER_ID + '{',
        'position:fixed;top:0;left:0;bottom:0;',
        'width:min(280px, 80vw);',
        'z-index:9999;',
        'background:#0f1832;',
        'border-right:1px solid rgba(160,194,255,0.12);',
        'transform:translateX(-100%);',
        'transition:transform 0.28s cubic-bezier(0.4,0,0.2,1);',
        'display:flex;flex-direction:column;',
        'padding:0;overflow-y:auto;}',
      '#' + DRAWER_ID + '.' + OPEN_CLASS + '{',
        'transform:translateX(0);}',
      '.kit-menu-header{',
        'display:flex;align-items:center;justify-content:space-between;',
        'padding:16px;',
        'border-bottom:1px solid rgba(160,194,255,0.12);',
        'min-height:62px;}',
      '.kit-menu-header-title{',
        'color:#fff;font-size:1rem;font-weight:600;',
        'font-family:"Cal Sans","Dangrek",ui-sans-serif,system-ui,sans-serif;}',
      '.kit-menu-close{',
        'appearance:none;border:0;background:transparent;',
        'color:rgba(255,255,255,0.7);font-size:1.5rem;',
        'cursor:pointer;padding:6px;line-height:1;',
        'border-radius:8px;}',
      '.kit-menu-close:hover{color:#fff;background:rgba(255,255,255,0.08);}',
      '.kit-menu-links{',
        'display:flex;flex-direction:column;padding:12px 0;}',
      '.kit-menu-link{',
        'display:flex;align-items:center;gap:10px;',
        'padding:14px 20px;',
        'color:rgba(255,255,255,0.85);',
        'font-size:0.95rem;font-weight:500;',
        'font-family:"Cal Sans","Dangrek",ui-sans-serif,system-ui,sans-serif;',
        'text-decoration:none;border:0;background:transparent;',
        'cursor:pointer;width:100%;text-align:left;}',
      '.kit-menu-link:hover{',
        'background:rgba(255,255,255,0.06);color:#fff;}',
      '.kit-menu-link img{width:20px;height:20px;object-fit:contain;flex-shrink:0;}',
      '.kit-menu-divider{',
        'height:1px;background:rgba(160,194,255,0.10);margin:8px 16px;}',
    ].join('');
    document.head.appendChild(style);
  }

  function buildDrawer() {
    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;

    const drawer = document.createElement('nav');
    drawer.id = DRAWER_ID;
    drawer.setAttribute('aria-label', 'Mobile navigation menu');
    drawer.setAttribute('aria-hidden', 'true');

    const desktopRail = document.querySelector('.nav-desktop-rail');
    const linkItems = desktopRail
      ? Array.from(desktopRail.querySelectorAll('.nav-header-link-btn'))
      : [];

    const linksHtml = linkItems.map((btn) => {
      const icon = btn.querySelector('img');
      const label = btn.querySelector('.nav-store-text');
      const iconHtml = icon
        ? '<img src="' + icon.src + '" alt="" aria-hidden="true">'
        : '';
      return (
        '<button type="button" class="kit-menu-link" aria-label="' +
        (label ? label.textContent.trim() : '') + '">' +
        iconHtml +
        '<span>' + (label ? label.textContent.trim() : '') + '</span>' +
        '</button>'
      );
    }).join('<div class="kit-menu-divider"></div>');

    drawer.innerHTML =
      '<div class="kit-menu-header">' +
        '<span class="kit-menu-header-title">Menu</span>' +
        '<button type="button" class="kit-menu-close" aria-label="Close menu">&#x2715;</button>' +
      '</div>' +
      '<div class="kit-menu-links">' + linksHtml + '</div>';

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
    return { overlay, drawer };
  }

  function openMenu(drawer, overlay) {
    drawer.classList.add(OPEN_CLASS);
    overlay.classList.add(OPEN_CLASS);
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const closeBtn = drawer.querySelector('.kit-menu-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeMenu(drawer, overlay, trigger) {
    drawer.classList.remove(OPEN_CLASS);
    overlay.classList.remove(OPEN_CLASS);
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (trigger) trigger.focus();
  }

  function init() {
    injectMenuStyles();
    const { overlay, drawer } = buildDrawer();

    const trigger = document.querySelector('.menu-trigger.menu-trigger-left');
    if (!trigger) return;

    trigger.addEventListener('click', function () {
      const isOpen = drawer.classList.contains(OPEN_CLASS);
      isOpen ? closeMenu(drawer, overlay, trigger) : openMenu(drawer, overlay);
    });

    overlay.addEventListener('click', function () {
      closeMenu(drawer, overlay, trigger);
    });

    drawer.querySelector('.kit-menu-close').addEventListener('click', function () {
      closeMenu(drawer, overlay, trigger);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && drawer.classList.contains(OPEN_CLASS)) {
        closeMenu(drawer, overlay, trigger);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

/* ==========================================================================
   SECTION 8: COUPON CODE MOCK VALIDATION
   ========================================================================== */
(function couponModule() {
  const VALID_CODES = {
    KIT10:    { type: 'percent', value: 10,   label: '10% off' },
    KIT20:    { type: 'percent', value: 20,   label: '20% off' },
    GAMING:   { type: 'flat',    value: 1.00, label: '$1.00 off' },
    FREEFIRE: { type: 'percent', value: 15,   label: '15% off' },
  };

  let appliedCoupon = null;

  function validateCoupon(code) {
    const upper = (code || '').trim().toUpperCase();
    return VALID_CODES[upper] || null;
  }

  function calculateDiscount(coupon, basePrice) {
    if (!coupon) return 0;
    if (coupon.type === 'percent') {
      return parseFloat(((coupon.value / 100) * basePrice).toFixed(2));
    }
    if (coupon.type === 'flat') {
      return Math.min(coupon.value, basePrice);
    }
    return 0;
  }

  function getStatusEl() {
    let el = document.getElementById('kit-coupon-status');
    if (!el) {
      el = document.createElement('p');
      el.id = 'kit-coupon-status';
      el.style.cssText = [
        'margin:6px 0 0;font-size:0.8rem;font-weight:500;',
        'text-align:left;padding:0 2px;',
      ].join('');
      const couponCard = document.querySelector('.coupon-card');
      if (couponCard) couponCard.appendChild(el);
    }
    return el;
  }

  function setStatus(message, isError) {
    const el = getStatusEl();
    el.textContent = message;
    el.style.color = isError ? '#f27474' : '#22c55e';
  }

  function clearStatus() {
    const el = document.getElementById('kit-coupon-status');
    if (el) el.textContent = '';
  }

  function updateTotalsWithDiscount() {
    const pkg = KIT_STATE.selectedPackage;
    if (!pkg) return;

    const basePrice = pkg.price;
    const discount = calculateDiscount(appliedCoupon, basePrice);
    const finalPrice = Math.max(0, basePrice - discount);
    const formatted = '$' + finalPrice.toFixed(2);

    const desktopTotal = document.querySelector('.checkout-total .css-6xtbv3');
    const mobileTotal = document.querySelector('.pay-line .css-850r8c');
    [desktopTotal, mobileTotal].forEach((el) => {
      if (el) el.textContent = formatted;
    });
  }

  function applyCode() {
    const input = document.querySelector('.coupon-input input');
    if (!input) return;

    const code = input.value.trim();
    if (!code) {
      setStatus('Please enter a coupon code.', true);
      return;
    }

    const coupon = validateCoupon(code);
    if (!coupon) {
      appliedCoupon = null;
      setStatus('Invalid coupon code.', true);
      updateTotalsWithDiscount();
      return;
    }

    appliedCoupon = coupon;
    setStatus('Applied: ' + coupon.label, false);
    updateTotalsWithDiscount();
  }

  function resetCoupon() {
    appliedCoupon = null;
    clearStatus();
    const input = document.querySelector('.coupon-input input');
    if (input) input.value = '';
  }

  function handleKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyCode();
    }
  }

  function init() {
    const applyBtn = document.querySelector('.coupon-btn');
    const input = document.querySelector('.coupon-input input');

    if (applyBtn) {
      applyBtn.addEventListener('click', applyCode);
    }
    if (input) {
      input.addEventListener('keydown', handleKeydown);
    }

    document.addEventListener('kit:packageChanged', resetCoupon);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

/* ==========================================================================
   SECTION 9: NAVBAR SCROLL BEHAVIOR
   Watches the scroll position and applies a .is-scrolled class to
   #navbar / .game-layout-header when the user has scrolled past the
   top of the page. The CSS in styling.css / styles.css should then
   handle the visual treatment (shadow, background solidify) via that
   class — keeping the scroll logic in JS and the visual output in CSS,
   which is the clean separation of concerns.

   If no scroll-specific CSS rule exists yet for .is-scrolled on the
   navbar, this module also injects a minimal fallback style so the
   behavior is visible even before the CSS rework pass adds a proper
   rule.

   HTML TARGET: #navbar (.game-layout-header) — confirmed in source.
   SCROLL THRESHOLD: 10px — intentionally low so the effect triggers
   almost immediately, which feels more responsive on mobile.
   ========================================================================== */
(function navbarScrollModule() {
  const SCROLLED_CLASS = 'is-scrolled';
  const SCROLL_THRESHOLD = 10;

  function injectFallbackStyle() {
    const STYLE_ID = 'kit-navbar-scroll-style';
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '#navbar.is-scrolled,',
      '.game-layout-header.is-scrolled{',
        'background:#080d1b !important;',
        'box-shadow:0 2px 16px rgba(0,0,0,0.45);',
        'transition:box-shadow 0.25s ease, background 0.25s ease;}',
      '#navbar,',
      '.game-layout-header{',
        'transition:box-shadow 0.25s ease, background 0.25s ease;}',
    ].join('');
    document.head.appendChild(style);
  }

  function getNavbar() {
    return document.getElementById('navbar') ||
           document.querySelector('.game-layout-header');
  }

  function onScroll() {
    const navbar = getNavbar();
    if (!navbar) return;

    if (window.scrollY > SCROLL_THRESHOLD) {
      navbar.classList.add(SCROLLED_CLASS);
    } else {
      navbar.classList.remove(SCROLLED_CLASS);
    }
  }

  function init() {
    injectFallbackStyle();

    // Run once immediately in case the page loads mid-scroll
    // (e.g. browser restoring scroll position on back navigation).
    onScroll();

    // Use passive: true so the scroll listener never blocks rendering —
    // important on mobile where scroll performance is critical.
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

/* ==========================================================================
   SECTION 10: INPUT ID MASCOT / ASSISTANT BUBBLE
   The HTML contains a fairly elaborate animated mascot system inside
   .input-id-assistant-floating — a little character with eyes, ears,
   paws and particles, plus a speech bubble (#input-id-assistant-bubble).
   In the original Next.js site this would have been driven by React
   state; here we wire it up with plain class toggles.

   States (applied to the mascot stage and face elements):
     state-idle      — default, bubble says "Need help? Enter your Game ID."
     state-typing    — user is typing in Game ID / Server ID fields
     state-checking  — player lookup in progress (mock: brief timeout)
     state-verified  — valid-looking ID entered (non-empty, numeric)
     state-error     — field cleared after having content

   The state classes already exist on the elements in source markup
   (everything starts as state-idle), so this module just toggles them.
   The actual CSS animations for the mascot are expected to live in
   styling.css / styles.css — this module only drives the state machine.

   HTML TARGETS (confirmed in source):
     .input-id-assistant-floating  — outer wrapper, gets state class
     .input-id-mascot-stage        — inner stage, gets state class
     .input-id-mascot-face         — face div, gets state class
     #input-id-assistant-bubble    — speech bubble <p> (NOTE: this id
       appears TWICE in the HTML, once in the mobile panel and once in
       the desktop sidebar — same duplicate-id issue as pay-button.
       Flagged for HTML rework pass; worked around here with
       querySelectorAll.)
     .input-id-card                — the card wrapper, gets state class
     .input-id-status-value        — "Not checked" status text
   ========================================================================== */
(function mascotModule() {
  const STATES = ['state-idle', 'state-typing', 'state-checking', 'state-verified', 'state-error'];

  const BUBBLE_MESSAGES = {
    'state-idle':     'Need help? Enter your Game ID.',
    'state-typing':   'Keep going — enter your Game ID!',
    'state-checking': 'Checking your player info...',
    'state-verified': 'Player found! Select a package.',
    'state-error':    'Please enter a valid Game ID.',
  };

  const STATUS_MESSAGES = {
    'state-idle':     'Not checked',
    'state-checking': 'Checking...',
    'state-verified': 'Verified',
    'state-error':    'Invalid',
  };

  let checkingTimer = null;

  function getElements() {
    return {
      floatings:    document.querySelectorAll('.input-id-assistant-floating'),
      stages:       document.querySelectorAll('.input-id-mascot-stage'),
      faces:        document.querySelectorAll('.input-id-mascot-face'),
      bubbles:      document.querySelectorAll('.input-id-assistant-bubble'),
      cards:        document.querySelectorAll('.input-id-card'),
      statusValues: document.querySelectorAll('.input-id-status-value'),
    };
  }

  function applyState(state) {
    const els = getElements();

    [els.floatings, els.stages, els.faces, els.cards].forEach((group) => {
      group.forEach((el) => {
        STATES.forEach((s) => el.classList.remove(s));
        el.classList.add(state);
      });
    });

    const message = BUBBLE_MESSAGES[state] || BUBBLE_MESSAGES['state-idle'];
    els.bubbles.forEach((bubble) => {
      bubble.textContent = message;
    });

    if (STATUS_MESSAGES[state]) {
      els.statusValues.forEach((el) => {
        el.textContent = STATUS_MESSAGES[state];
        el.classList.remove('pending', 'verified', 'error');
        if (state === 'state-verified') el.classList.add('verified');
        if (state === 'state-error') el.classList.add('error');
        if (state === 'state-idle') el.classList.add('pending');
      });
    }
  }

  function isValidGameId(value) {
    // Mobile Legends Game IDs are numeric, typically 8-12 digits.
    // We accept anything non-empty and numeric as "valid" for the mock.
    return /^\d{6,}$/.test(value.trim());
  }

  function handleGameIdInput(event) {
    const value = event.target.value.trim();

    if (checkingTimer) clearTimeout(checkingTimer);

    if (!value) {
      applyState('state-idle');
      return;
    }

    applyState('state-typing');

    // After the user pauses typing for 800ms, simulate a "checking" state
    // then resolve to verified or error based on the input.
    checkingTimer = setTimeout(function () {
      applyState('state-checking');

      setTimeout(function () {
        if (isValidGameId(value)) {
          applyState('state-verified');
        } else {
          applyState('state-error');
        }
        document.dispatchEvent(new CustomEvent('kit:packageChanged'));
      }, 900);
    }, 800);
  }

  function init() {
    document.querySelectorAll('[data-user-field="game-id"]').forEach((field) => {
      field.addEventListener('input', handleGameIdInput);
    });

    const anyGameField = document.querySelector('[data-user-field="game-id"]');
    if (anyGameField && anyGameField.value.trim()) {
      if (isValidGameId(anyGameField.value)) {
        applyState('state-verified');
      } else {
        applyState('state-error');
      }
    } else {
      applyState('state-idle');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

//Hero Slide Show
/* ==========================================================================
   HERO BANNER SLIDESHOW
   Auto-rotates between 3 images every 5 seconds.
   Images expected at: Images/Slide1.jpg, Images/Slide2.jpg, Images/Slide3.jpg
   ========================================================================== */

(function heroSlideshow() {
  const slides = [
    'Images/Slide1.png',
    'Images/Slide2.png',
    'Images/Slide3.png',
  ];

  const INTERVAL = 5000; // 5 seconds
  let current = 0;
  let timer = null;

  function init() {
    const container = document.getElementById('img_container');
    if (!container) return;

    // Build slideshow wrapper
    container.innerHTML = '';
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.style.borderRadius = '16px';

    // Create image elements
    slides.forEach((src, i) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'KIT Gaming Store Banner ' + (i + 1);
      img.style.cssText = `
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: ${i === 0 ? '1' : '0'};
        transition: opacity 0.8s ease;
        display: block;
      `;
      container.appendChild(img);
    });

    // Set container height
    container.style.height = '400px';

    // Create dot indicators
    const dotsWrapper = document.createElement('div');
    dotsWrapper.style.cssText = `
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 8px;
      z-index: 10;
    `;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.setAttribute('aria-label', 'Slide ' + (i + 1));
      dot.style.cssText = `
        width: ${i === 0 ? '24px' : '8px'};
        height: 8px;
        border-radius: 4px;
        border: none;
        background: ${i === 0 ? '#F59E0B' : 'rgba(255,255,255,0.4)'};
        cursor: pointer;
        padding: 0;
        transition: width 0.3s ease, background 0.3s ease;
      `;
      dot.addEventListener('click', () => goTo(i));
      dotsWrapper.appendChild(dot);
    });

    container.appendChild(dotsWrapper);

    // Start auto-rotation
    timer = setInterval(next, INTERVAL);

    // Pause on hover
    container.addEventListener('mouseenter', () => clearInterval(timer));
    container.addEventListener('mouseleave', () => {
      timer = setInterval(next, INTERVAL);
    });
  }

  function goTo(index) {
    const container = document.getElementById('img_container');
    if (!container) return;

    const imgs = container.querySelectorAll('img');
    const dots = container.querySelectorAll('button');

    // Fade out current, fade in next
    imgs[current].style.opacity = '0';
    dots[current].style.width = '8px';
    dots[current].style.background = 'rgba(255,255,255,0.4)';

    current = index;

    imgs[current].style.opacity = '1';
    dots[current].style.width = '24px';
    dots[current].style.background = '#F59E0B';
  }

  function next() {
    goTo((current + 1) % slides.length);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();