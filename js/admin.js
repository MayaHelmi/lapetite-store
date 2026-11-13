/* =========================================================
   Admin panel (DEMO) — orders, products, reviews, delivery fees.
   Talks only to LP.api.admin (js/api.js), so it keeps working
   when the demo storage is swapped for a real backend.
   ========================================================= */
(function () {
  const A = LP.api.admin;
  const STEPS = LP.config.orderSteps;
  const STATUSES = STEPS.concat("cancelled");
  const TABS = ["orders", "products", "reviews", "delivery"];

  const state = {
    tab: TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "orders",
    status: "all",
    q: "",
    productQ: "",
    productCat: "",
    sheet: null,         // { type: "order", number } | { type: "product", id | null }
    draft: null,         // product being edited
    confirm: "",         // two-step buttons: which one is armed
    errors: {}
  };
  let orders = [];
  let products = [];
  let reviews = [];
  let settings = null;
  let bound = false;
  let confirmTimer = 0;

  const t = (k, v) => LP.t(k, v);
  const esc = LP.esc;
  const sheet = () => document.getElementById("admin-sheet");

  async function load() {
    [orders, products, reviews, settings] = await Promise.all([A.listOrders(), A.listProducts(), A.listReviews(), A.getSettings()]);
  }

  /* ---------- Login ---------- */
  function loginHtml() {
    return '<main class="admin-login">' +
      '<form class="admin-login__card" id="login-form" novalidate>' +
        '<p class="wordmark">' + LP.config.brand + "<small>" + t("tagline") + "</small></p>" +
        '<h1 class="h3">' + t("adminLoginTitle") + "</h1>" +
        '<div class="field"><label class="field__label" for="a-code">' + t("adminPasscode") + "</label>" +
          '<input class="input" id="a-code" type="password" autocomplete="current-password" required dir="ltr">' +
          '<p class="field__error" id="a-code-error" role="alert"></p></div>' +
        '<button class="btn btn--primary btn--block" type="submit">' + t("adminLogin") + "</button>" +
        '<p class="admin-demo">' + t("adminDemoNote", { code: LP.config.adminDemoPasscode }) + "</p>" +
        '<button class="lang-btn" type="button" data-lang-toggle aria-label="' + t("langToggleLabel") + '">' + t("langToggle") + "</button>" +
      "</form>" +
    "</main>";
  }

  /* ---------- Shell ---------- */
  function shellHtml(content) {
    const pending = orders.filter(o => o.status === "review").length;
    const toApprove = reviews.filter(r => r.status === "pending").length;
    const tab = (id, label, extra) =>
      '<button class="admin-tab" type="button" role="tab" data-tab="' + id + '" aria-selected="' + (state.tab === id) + '">' + label + (extra || "") + "</button>";
    return '<header class="admin-bar"><div class="container admin-bar__inner">' +
        '<a class="wordmark" href="admin.html">' + LP.config.brand + "<small>" + t("adminTitle") + "</small></a>" +
        '<div class="admin-bar__end">' +
          '<a class="icon-btn" href="index.html" target="_blank" rel="noopener" aria-label="' + t("adminViewStore") + '" title="' + t("adminViewStore") + '">' + LP.icons.home + "</a>" +
          '<button class="lang-btn" type="button" data-lang-toggle aria-label="' + t("langToggleLabel") + '">' + t("langToggle") + "</button>" +
          '<button class="icon-btn" type="button" data-logout aria-label="' + t("adminLogout") + '" title="' + t("adminLogout") + '">' + LP.icons.logout + "</button>" +
        "</div>" +
        '<nav class="admin-tabs" role="tablist" aria-label="' + t("adminTitle") + '">' +
          tab("orders", t("adminOrders"), pending ? '<span class="admin-tab__count">' + pending + "</span>" : "") +
          tab("products", t("adminProducts")) +
          tab("reviews", t("adminReviews"), toApprove ? '<span class="admin-tab__count">' + toApprove + "</span>" : "") +
          tab("delivery", t("adminDelivery")) +
        "</nav>" +
      "</div></header>" +
      '<main class="container admin-main" id="main">' + content + "</main>";
  }

  /* ---------- Orders ---------- */
  function orderMatches(o) {
    if (state.status !== "all" && o.status !== state.status) return false;
    const q = state.q.trim().toLowerCase();
    if (!q) return true;
    const digits = LP.latinDigits(q).replace(/[^\d]/g, "");
    return String(o.number).includes(q.replace("#", "")) ||
      o.customer.name.toLowerCase().includes(q) ||
      (digits.length > 2 && o.customer.phone.includes(LP.normPhone(digits).replace(/^0/, "")));
  }

  function ordersHtml() {
    const count = s => orders.filter(o => o.status === s).length;
    const active = ["confirmed", "preparing", "shipping"].reduce((n, s) => n + count(s), 0);
    const sales = orders.filter(o => o.status === "delivered").reduce((sum, o) => sum + o.total, 0);
    const stat = (label, value, filter) =>
      '<button class="admin-stat" type="button"' + (filter ? ' data-filter="' + filter + '"' : " disabled") + '><span class="admin-stat__value">' + value + '</span><span class="admin-stat__label">' + label + "</span></button>";

    const chips = [["all", t("any"), orders.length]].concat(STATUSES.map(s => [s, LP.statusLabel(s), count(s)]))
      .map(([v, label, n]) => '<button class="chip chip--small" type="button" data-filter="' + v + '" aria-pressed="' + (state.status === v) + '">' + label + ' <span class="admin-chip-count">' + n + "</span></button>").join("");

    const list = orders.filter(orderMatches);
    const rows = list.map(o => {
      const c = o.customer;
      const qty = o.items.reduce((n, i) => n + i.qty, 0);
      return '<li><button class="order-line" type="button" data-open-order="' + o.number + '">' +
        '<span class="order-line__id"><strong>#' + o.number + "</strong><small>" + LP.formatDate(o.createdAt) + "</small></span>" +
        '<span class="order-line__who"><strong>' + esc(c.name) + '</strong><small dir="ltr">' + esc(c.phone) + "</small></span>" +
        '<span class="order-line__city">' + LP.label("cities", c.city) + "</span>" +
        '<span class="order-line__qty">' + LP.piecesLabel(qty) + "</span>" +
        '<span class="order-line__total">' + LP.formatPrice(o.total) + "</span>" +
        '<span class="order-line__status"><span class="status status--' + o.status + '">' + LP.statusLabel(o.status) + "</span></span>" +
      "</button></li>";
    }).join("");

    return '<h1 class="sr-only">' + t("adminOrders") + "</h1>" +
      '<div class="admin-stats">' +
        stat(t("adminStatPending"), count("review"), "review") +
        stat(t("adminStatActive"), active, "") +
        stat(t("adminStatDelivered"), count("delivered"), "delivered") +
        stat(t("adminStatSales"), LP.formatPrice(sales), "") +
      "</div>" +
      '<div class="admin-toolbar">' +
        '<div class="chips" role="group" aria-label="' + t("adminStatus") + '">' + chips + "</div>" +
        '<input class="input admin-search" type="search" id="order-search" placeholder="' + t("adminSearchOrders") + '" aria-label="' + t("adminSearchOrders") + '" value="' + esc(state.q) + '">' +
      "</div>" +
      (list.length
        ? '<div class="order-head" aria-hidden="true"><span>' + t("orderNumber") + "</span><span>" + t("adminCustomer") + "</span><span>" + t("city") + "</span><span>" + t("adminItems") + "</span><span>" + t("total") + "</span><span>" + t("adminStatus") + "</span></div>" +
          '<ul class="order-lines">' + rows + "</ul>"
        : '<div class="empty">' + LP.icons.receipt + '<p class="h3">' + t("adminNoOrders") + '</p><p class="text-secondary">' + t("adminNoOrdersText") + "</p></div>");
  }

  function orderSheetHtml(o) {
    const c = o.customer;
    const idx = STEPS.indexOf(o.status);
    const next = idx >= 0 && idx < STEPS.length - 1 ? STEPS[idx + 1] : "";
    const closed = o.status === "delivered" || o.status === "cancelled";
    const wa = "https://wa.me/962" + c.phone.replace(/^0/, "");
    const row = (label, value) => '<div class="order-row"><span>' + label + "</span><span>" + value + "</span></div>";
    const items = o.items.map(i =>
      '<li class="order-item"><img src="' + LP.thumb(LP.orderItemImage(i)) + '" alt="" width="900" height="1200" loading="lazy">' +
        '<div class="order-item__body"><p class="order-item__name">' + esc(i.name[LP.lang] || i.name.ar) + "</p>" +
        '<p class="order-item__meta">' + LP.label("colors", i.color) + " · " + t("sizeLabel") + " " + LP.label("sizes", i.size) + " · " + t("qtyShort", { n: i.qty }) + "</p></div>" +
        '<strong class="order-item__price">' + LP.formatPrice(i.price * i.qty) + "</strong></li>").join("");
    const history = o.history.slice().reverse().map(h =>
      '<li><span class="status status--' + h.status + '">' + LP.statusLabel(h.status) + "</span><time>" + LP.formatDate(h.at) + "</time></li>").join("");
    const armed = state.confirm === "cancel-" + o.number;

    return '<div class="admin-sheet__head">' +
        '<div><h2 class="h3">' + t("orderTitle", { n: o.number }) + '</h2><span class="status status--' + o.status + '">' + LP.statusLabel(o.status) + "</span></div>" +
        '<button class="icon-btn" type="button" data-close-sheet aria-label="' + t("close") + '">' + LP.icons.close + "</button>" +
      "</div>" +
      '<div class="admin-sheet__body">' +
        '<section class="admin-block admin-status">' +
          (next ? '<button class="btn btn--primary btn--block" type="button" data-set-status="' + next + '">' + t("adminMoveTo", { s: LP.statusLabel(next) }) + "</button>" : "") +
          '<div class="field"><label class="field__label" for="status-select">' + t("adminSetStatus") + "</label>" +
            '<select class="select" id="status-select" data-status-select>' + STATUSES.map(s => '<option value="' + s + '"' + (s === o.status ? " selected" : "") + ">" + LP.statusLabel(s) + "</option>").join("") + "</select></div>" +
          (!closed ? '<button class="btn btn--danger btn--block" type="button" data-cancel-order="' + o.number + '">' + t(armed ? "adminConfirmCancel" : "adminCancelOrder") + "</button>" : "") +
        "</section>" +
        '<section class="admin-block"><h3 class="admin-block__title">' + t("adminCustomer") + "</h3>" +
          '<div class="order-rows">' +
            row(t("name"), esc(c.name)) +
            row(t("phone"), '<span dir="ltr">' + esc(c.phone) + "</span>") +
            row(t("city"), LP.label("cities", c.city)) +
            row(t("address"), esc(c.address)) +
            (c.notes ? row(t("notes"), esc(c.notes)) : "") +
          "</div>" +
          '<div class="admin-contact">' +
            '<a class="btn btn--secondary" href="tel:' + esc(c.phone) + '">' + LP.icons.phone + "<span>" + t("adminCall") + "</span></a>" +
            '<a class="btn btn--secondary" href="' + wa + '" target="_blank" rel="noopener">' + LP.icons.whatsapp + "<span>" + t("adminWhatsapp") + "</span></a>" +
            (c.location ? '<a class="btn btn--secondary" href="' + LP.config.mapsUrl + c.location.lat + "," + c.location.lng + '" target="_blank" rel="noopener">' + LP.icons.pin + "<span>" + t("locationView") + "</span></a>" : "") +
          "</div>" +
        "</section>" +
        '<section class="admin-block"><h3 class="admin-block__title">' + t("adminItems") + "</h3>" +
          '<ul class="order-items">' + items + "</ul>" +
          '<div class="order-rows">' +
            row(t("orderDate"), LP.formatDate(o.createdAt)) +
            row(t("paymentTitle"), t("paymentCod")) +
            row(t("subtotal"), LP.formatPrice(o.subtotal)) +
            row(t("delivery"), LP.formatPrice(o.deliveryFee)) +
            '<div class="order-row order-row--total"><span>' + t("total") + "</span><span>" + LP.formatPrice(o.total) + "</span></div>" +
          "</div>" +
        "</section>" +
        '<section class="admin-block"><h3 class="admin-block__title">' + t("adminNote") + "</h3>" +
          '<textarea class="textarea" id="order-note" aria-label="' + t("adminNote") + '">' + esc(o.adminNote || "") + "</textarea>" +
          '<p class="field__hint">' + t("adminNoteHint") + "</p>" +
          '<button class="btn btn--secondary" type="button" data-save-note="' + o.number + '">' + t("adminSaveNote") + "</button>" +
        "</section>" +
        '<section class="admin-block"><h3 class="admin-block__title">' + t("adminHistory") + "</h3>" +
          '<ol class="admin-history">' + history + "</ol>" +
          '<a class="link" href="order.html?t=' + encodeURIComponent(o.token) + '" target="_blank" rel="noopener">' + t("adminCustomerView") + LP.icons.arrow + "</a>" +
        "</section>" +
      "</div>";
  }

  /* ---------- Products ---------- */
  function productMatches(p) {
    if (state.productCat && p.category !== state.productCat) return false;
    const q = LP.searchText(state.productQ.trim());
    return !q || LP.searchText(p.name.ar + " " + p.name.en + " " + p.id).includes(q);
  }

  function productsHtml() {
    const cats = Object.keys(LP.labels.categories);
    const list = products.filter(productMatches);
    const rows = list.map(p => {
      const img = LP.imagesFor(p, LP.firstImageColor(p))[0];
      const tags = (p.origin === "added" ? '<span class="admin-tag">' + t("adminAdded") + "</span>" : "") +
        (p.hidden ? '<span class="admin-tag admin-tag--muted">' + t("adminHidden") + "</span>" : "");
      return '<li class="product-line' + (p.hidden ? " is-hidden" : "") + '">' +
        '<button class="product-line__main" type="button" data-edit-product="' + p.id + '">' +
          '<img src="' + LP.thumb(img) + '" alt="" width="900" height="1200" loading="lazy">' +
          '<span class="product-line__text"><strong>' + esc(p.name[LP.lang]) + "</strong>" +
            "<small>" + LP.label("categories", p.category) + " · " + LP.label("collections", p.collection) + "</small>" +
            '<span class="product-line__dots" aria-label="' + t("adminColors") + ": " + p.colors.map(c => LP.label("colors", c)).join("، ") + '">' + p.colors.map(c => '<span class="dot" style="background: var(--swatch-' + c + ')"></span>').join("") + "</span>" +
            (tags ? '<span class="admin-tags">' + tags + "</span>" : "") +
          "</span>" +
          '<span class="product-line__price">' + LP.formatPrice(p.price) + "</span>" +
        "</button>" +
        '<label class="switch"><input type="checkbox" data-sold-out="' + p.id + '"' + (p.soldOut ? " checked" : "") + '><span class="switch__track" aria-hidden="true"></span><span>' + t("soldOut") + "</span></label>" +
      "</li>";
    }).join("");

    return '<h1 class="sr-only">' + t("adminProducts") + "</h1>" +
      '<div class="admin-toolbar">' +
        '<input class="input admin-search" type="search" id="product-search" placeholder="' + t("adminSearchProducts") + '" aria-label="' + t("adminSearchProducts") + '" value="' + esc(state.productQ) + '">' +
        '<select class="select admin-filter" id="product-cat" aria-label="' + t("adminCategory") + '"><option value="">' + t("adminCategory") + ": " + t("any") + "</option>" +
          cats.map(c => '<option value="' + c + '"' + (state.productCat === c ? " selected" : "") + ">" + LP.label("categories", c) + "</option>").join("") + "</select>" +
        '<button class="btn btn--primary" type="button" data-new-product>' + LP.icons.plus + "<span>" + t("adminAddProduct") + "</span></button>" +
      "</div>" +
      '<p class="admin-count">' + t("adminProductCount", { n: list.length }) + "</p>" +
      '<ul class="product-lines">' + rows + "</ul>";
  }

  function blankProduct() {
    return { id: "", origin: "new", name: { ar: "", en: "" }, desc: { ar: "", en: "" }, price: "", category: "sets", collection: "autumn",
      colors: [], sizes: ["1", "2"], badges: ["new"], soldOut: false, hidden: false, images: {}, imageUrls: {} };
  }

  function photosOf(d) {
    if (d.origin === "base") return LP.imagesFor(d, LP.firstImageColor(d));
    const key = Object.keys(d.imageUrls || {})[0];
    return key ? d.imageUrls[key] : [];
  }

  function productSheetHtml() {
    const d = state.draft;
    const e = state.errors;
    const isNew = d.origin === "new";
    const err = k => '<p class="field__error" role="alert">' + (e[k] || "") + "</p>";
    const input = (id, label, value, attrs) => '<div class="field"><label class="field__label" for="' + id + '">' + label + "</label>" +
      '<input class="input" id="' + id + '" value="' + esc(value) + '" ' + (attrs || "") + ">" + err(id) + "</div>";
    const area = (id, label, value, attrs) => '<div class="field"><label class="field__label" for="' + id + '">' + label + "</label>" +
      '<textarea class="textarea" id="' + id + '" ' + (attrs || "") + ">" + esc(value) + "</textarea></div>";
    const checks = (name, values, labelFn, selected, swatch) => '<div class="admin-checks">' + values.map(v =>
      '<label class="admin-check"><input type="checkbox" name="' + name + '" value="' + v + '"' + (selected.includes(v) ? " checked" : "") + ">" +
        (swatch ? '<span class="dot" style="background: var(--swatch-' + v + ')"></span>' : "") + "<span>" + labelFn(v) + "</span></label>").join("") + "</div>";
    const photos = photosOf(d);
    const max = LP.config.uploadImage.maxPerProduct;
    const armedDelete = state.confirm === "delete-" + d.id;

    return '<div class="admin-sheet__head">' +
        '<h2 class="h3">' + t(isNew ? "adminNewProduct" : "adminEditProduct") + "</h2>" +
        '<button class="icon-btn" type="button" data-close-sheet aria-label="' + t("close") + '">' + LP.icons.close + "</button>" +
      "</div>" +
      '<form class="admin-sheet__body admin-form" id="product-form" novalidate>' +
        '<section class="admin-block"><h3 class="admin-block__title">' + t("adminPhotos") + "</h3>" +
          '<div class="admin-photos">' + photos.map((src, i) =>
            '<figure><img src="' + LP.thumb(src) + '" alt="" width="600" height="800">' +
              (d.origin !== "base" ? '<button class="icon-btn" type="button" data-remove-photo="' + i + '" aria-label="' + t("adminRemovePhoto") + '">' + LP.icons.close + "</button>" : "") +
            "</figure>").join("") +
            (d.origin !== "base" && photos.length < max
              ? '<label class="admin-photos__add">' + LP.icons.plus + "<span>" + t("adminAddPhotos") + '</span><input type="file" accept="image/*" multiple data-photo-input class="sr-only"></label>'
              : "") +
          "</div>" +
          '<p class="field__hint">' + (d.origin === "base" ? t("adminPhotosFixed") : t("adminPhotosHint", { n: max })) + "</p>" + err("photos") +
        "</section>" +
        '<section class="admin-block admin-form__grid">' +
          input("p-name-ar", t("adminNameAr"), d.name.ar, 'dir="rtl" lang="ar" maxlength="80" required') +
          input("p-name-en", t("adminNameEn"), d.name.en, 'dir="ltr" lang="en" maxlength="80" required') +
          area("p-desc-ar", t("adminDescAr"), d.desc.ar, 'dir="rtl" lang="ar" maxlength="400"') +
          area("p-desc-en", t("adminDescEn"), d.desc.en, 'dir="ltr" lang="en" maxlength="400"') +
          input("p-price", t("adminPrice"), d.price, 'type="number" inputmode="decimal" min="0" step="0.5" dir="ltr" required') +
          '<div class="field"><label class="field__label" for="p-category">' + t("adminCategory") + '</label><select class="select" id="p-category">' +
            Object.keys(LP.labels.categories).map(c => '<option value="' + c + '"' + (d.category === c ? " selected" : "") + ">" + LP.label("categories", c) + "</option>").join("") + "</select></div>" +
          '<div class="field"><label class="field__label" for="p-collection">' + t("filterCollection") + '</label><select class="select" id="p-collection">' +
            Object.keys(LP.labels.collections).map(c => '<option value="' + c + '"' + (d.collection === c ? " selected" : "") + ">" + LP.label("collections", c) + "</option>").join("") + "</select></div>" +
        "</section>" +
        '<section class="admin-block"><h3 class="admin-block__title">' + t("adminColors") + "</h3>" +
          checks("colors", Object.keys(LP.labels.colors), c => LP.label("colors", c), d.colors, true) + err("colors") +
        "</section>" +
        '<section class="admin-block"><h3 class="admin-block__title">' + t("adminSizes") + "</h3>" +
          checks("sizes", Object.keys(LP.labels.sizes), s => LP.label("sizes", s), d.sizes) + err("sizes") +
        "</section>" +
        '<section class="admin-block"><h3 class="admin-block__title">' + t("adminBadges") + "</h3>" +
          checks("badges", ["new", "bestseller", "exclusive"], b => t({ new: "badgeNew", bestseller: "badgeBestseller", exclusive: "badgeExclusive" }[b]), d.badges || []) +
        "</section>" +
        '<section class="admin-block">' +
          '<label class="switch switch--wide"><input type="checkbox" id="p-soldout"' + (d.soldOut ? " checked" : "") + '><span class="switch__track" aria-hidden="true"></span><span><strong>' + t("soldOut") + "</strong><small>" + t("adminSoldOutHint") + "</small></span></label>" +
          '<label class="switch switch--wide"><input type="checkbox" id="p-hidden"' + (d.hidden ? " checked" : "") + '><span class="switch__track" aria-hidden="true"></span><span><strong>' + t("adminHidden") + "</strong><small>" + t("adminHiddenHint") + "</small></span></label>" +
        "</section>" +
        '<p class="field__error" id="product-error" role="alert">' + (e.form || "") + "</p>" +
        '<div class="admin-form__actions">' +
          '<button class="btn btn--primary" type="submit">' + t("adminSave") + "</button>" +
          '<button class="btn btn--secondary" type="button" data-close-sheet>' + t("adminCancel") + "</button>" +
          (d.origin === "base" && d.edited ? '<button class="link" type="button" data-reset-product="' + d.id + '">' + t("adminReset") + "</button>" : "") +
          (d.origin === "added" ? '<button class="btn btn--danger" type="button" data-delete-product="' + d.id + '">' + t(armedDelete ? "adminConfirmDelete" : "adminDelete") + "</button>" : "") +
        "</div>" +
      "</form>";
  }

  /* ---------- Reviews ---------- */
  function reviewsHtml() {
    const statusKey = { pending: "adminReviewPending", approved: "adminReviewApproved", hidden: "adminReviewHidden" };
    const statusCls = { pending: "review", approved: "delivered", hidden: "cancelled" };
    const list = reviews.map(r => {
      const item = r.item || {};
      const armed = state.confirm === "delete-review-" + r.id;
      return '<li class="admin-review">' +
        '<img src="' + LP.thumb(LP.orderItemImage(item)) + '" alt="" width="600" height="800" loading="lazy">' +
        '<div class="admin-review__body">' +
          '<div class="admin-review__top">' + LP.stars(r.rating) +
            '<span class="status status--' + statusCls[r.status] + '">' + t(statusKey[r.status]) + "</span></div>" +
          (r.text ? '<p class="admin-review__text">' + esc(r.text) + "</p>" : "") +
          '<p class="admin-review__meta"><bdi>' + esc(r.name) + "</bdi> · " + esc((item.name && (item.name[LP.lang] || item.name.ar)) || "") + " · " +
            '<button class="link" type="button" data-open-order="' + r.orderNumber + '">' + t("adminFromOrder", { n: r.orderNumber }) + "</button> · " +
            LP.formatDate(r.createdAt) + "</p>" +
          '<div class="admin-review__actions">' +
            (r.status !== "approved" ? '<button class="btn btn--primary" type="button" data-review-status="approved" data-review-id="' + r.id + '">' + t("adminApprove") + "</button>" : "") +
            (r.status !== "hidden" ? '<button class="btn btn--secondary" type="button" data-review-status="hidden" data-review-id="' + r.id + '">' + t("adminHide") + "</button>" : "") +
            '<button class="btn btn--danger" type="button" data-delete-review="' + r.id + '">' + t(armed ? "adminConfirmDelete" : "adminDeleteReview") + "</button>" +
          "</div>" +
        "</div></li>";
    }).join("");
    return '<h1 class="sr-only">' + t("adminReviews") + "</h1>" +
      (reviews.length
        ? '<ul class="admin-reviews">' + list + "</ul>"
        : '<div class="empty">' + LP.icons.star + '<p class="h3">' + t("adminNoReviews") + '</p><p class="text-secondary">' + t("adminNoReviewsText") + "</p></div>");
  }

  /* ---------- Delivery fees ---------- */
  function deliveryHtml() {
    const fees = settings.deliveryFees;
    return '<h1 class="sr-only">' + t("adminDelivery") + "</h1>" +
      '<form class="admin-card admin-fees" id="fees-form" novalidate>' +
        '<h2 class="h3">' + t("adminFeesTitle") + "</h2>" +
        '<p class="field__hint">' + t("adminFeesHint") + "</p>" +
        '<label class="admin-fee admin-fee--free"><span>' + t("adminFreeOver") + '<small class="field__hint">' + t("adminFreeOverHint") + "</small></span>" +
          '<span class="admin-fee__input"><input class="input" type="number" inputmode="decimal" min="0" step="1" dir="ltr" name="freeDeliveryOver" value="' + settings.freeDeliveryOver + '"><span>' + LP.config.currency[LP.lang] + "</span></span></label>" +
        '<div class="admin-fees__list">' + LP.config.cities.map(c =>
          '<label class="admin-fee"><span>' + LP.label("cities", c) + "</span>" +
            '<span class="admin-fee__input"><input class="input" type="number" inputmode="decimal" min="0" step="0.5" dir="ltr" name="' + c + '" value="' + fees[c] + '"><span>' + LP.config.currency[LP.lang] + "</span></span></label>").join("") +
        "</div>" +
        '<button class="btn btn--primary" type="submit">' + t("adminSaveFees") + "</button>" +
      "</form>";
  }

  /* ---------- Render ---------- */
  function renderSheet() {
    const el = sheet();
    if (!state.sheet) { if (el.open) LP.closeDialog(el); return; }
    if (state.sheet.type === "order") {
      const o = orders.find(x => x.number === state.sheet.number);
      if (!o) { state.sheet = null; LP.closeDialog(el); return; }
      el.innerHTML = orderSheetHtml(o);
    } else {
      el.innerHTML = productSheetHtml();
    }
    if (!el.open) LP.openDialog(el);
  }

  function render() {
    LP.applyStaticText();
    document.title = t("adminTitle") + " · " + LP.config.brand;
    const root = document.getElementById("admin-root");
    if (!A.isLoggedIn()) {
      root.innerHTML = loginHtml();
      state.sheet = null;
      renderSheet();
      bind();
      return;
    }
    if (!settings) { load().then(render); return; }
    const view = state.tab === "products" ? productsHtml() : state.tab === "reviews" ? reviewsHtml() : state.tab === "delivery" ? deliveryHtml() : ordersHtml();
    root.innerHTML = shellHtml(view);
    renderSheet();
    bind();
  }

  async function refresh() {
    await load();
    render();
  }

  // Re-render the list without losing the search box focus
  function renderKeepFocus(id) {
    const el = document.getElementById(id);
    const pos = el ? el.selectionStart : null;
    render();
    const again = document.getElementById(id);
    if (again) { again.focus(); if (pos !== null) again.setSelectionRange(pos, pos); }
  }

  function arm(key) {
    state.confirm = key;
    clearTimeout(confirmTimer);
    confirmTimer = setTimeout(() => { state.confirm = ""; renderSheet(); }, 4000);
  }

  /* ---------- Product form ---------- */
  function readForm() {
    const d = state.draft;
    const val = id => document.getElementById(id).value;
    const checked = name => [...document.querySelectorAll('#product-form input[name="' + name + '"]:checked')].map(i => i.value);
    d.name = { ar: val("p-name-ar").trim(), en: val("p-name-en").trim() };
    d.desc = { ar: val("p-desc-ar").trim(), en: val("p-desc-en").trim() };
    d.price = val("p-price");
    d.category = val("p-category");
    d.collection = val("p-collection");
    d.colors = checked("colors");
    d.sizes = checked("sizes");
    d.badges = checked("badges");
    d.soldOut = document.getElementById("p-soldout").checked;
    d.hidden = document.getElementById("p-hidden").checked;
  }

  function validateDraft() {
    const d = state.draft;
    const e = {};
    if (!d.name.ar) e["p-name-ar"] = t("required");
    if (!d.name.en) e["p-name-en"] = t("required");
    const price = Number(d.price);
    if (d.price === "" || !isFinite(price) || price <= 0) e["p-price"] = t("adminInvalidPrice");
    if (!d.colors.length) e.colors = t("adminPickColor");
    if (!d.sizes.length) e.sizes = t("adminPickSize");
    if (d.origin !== "base" && !photosOf(d).length) e.photos = t("adminNeedPhoto");
    state.errors = e;
    return !Object.keys(e).length;
  }

  // Uploaded photos for added products are stored under the first color
  function setPhotos(list) {
    const d = state.draft;
    const key = d.colors[0] || Object.keys(d.imageUrls || {})[0] || "black";
    d.imageUrls = list.length ? { [key]: list } : {};
    d.images = list.length ? { [key]: list.length } : {};
  }

  async function saveDraft() {
    readForm();
    if (!validateDraft()) { renderSheet(); return; }
    const d = state.draft;
    d.price = Math.round(Number(d.price) * 100) / 100;
    if (d.origin !== "base") setPhotos(photosOf(d));
    try {
      if (d.origin === "new") {
        const p = Object.assign({}, d);
        delete p.origin;
        await A.createProduct(p);
      } else {
        await A.saveProduct(d);
      }
      state.sheet = null;
      state.draft = null;
      await refresh();
      LP.toast("<span>" + t("adminSaved") + "</span>");
    } catch (err) {
      state.errors = { form: err.code === "storage-full" ? t("adminStorageFull") : t("orderFailed") };
      renderSheet();
    }
  }

  function shrinkImage(file) {
    const { width, height, quality } = LP.config.uploadImage;
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        // Cover-crop to the shop's 3:4 product shape
        const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image")); };
      img.src = url;
    });
  }

  /* ---------- Events ---------- */
  function bind() {
    if (bound) return;
    bound = true;
    const root = document;

    root.addEventListener("submit", async e => {
      if (e.target.matches("#login-form")) {
        e.preventDefault();
        const input = document.getElementById("a-code");
        if (await A.login(input.value)) { await refresh(); return; }
        input.setAttribute("aria-invalid", "true");
        document.getElementById("a-code-error").textContent = t("adminWrongCode");
        input.focus();
        return;
      }
      if (e.target.matches("#product-form")) { e.preventDefault(); saveDraft(); return; }
      if (e.target.matches("#fees-form")) {
        e.preventDefault();
        const fees = {};
        LP.config.cities.forEach(c => { fees[c] = e.target.elements[c].value; });
        try {
          settings = await A.saveSettings({ deliveryFees: fees, freeDeliveryOver: e.target.elements.freeDeliveryOver.value });
          render();
          LP.toast("<span>" + t("adminSaved") + "</span>");
        } catch (err) { LP.toast("<span>" + t("adminStorageFull") + "</span>"); }
      }
    });

    root.addEventListener("click", async e => {
      const tab = e.target.closest("[data-tab]");
      if (tab) {
        state.tab = tab.dataset.tab;
        history.replaceState(null, "", "#" + state.tab);
        render();
        return;
      }
      if (e.target.closest("[data-logout]")) { await A.logout(); render(); return; }

      const filter = e.target.closest("[data-filter]");
      if (filter) { state.status = state.status === filter.dataset.filter && filter.dataset.filter !== "all" ? "all" : filter.dataset.filter; render(); return; }

      const openOrder = e.target.closest("[data-open-order]");
      if (openOrder) { state.sheet = { type: "order", number: Number(openOrder.dataset.openOrder) }; state.confirm = ""; renderSheet(); return; }

      if (e.target.closest("[data-close-sheet]") || e.target === sheet()) { state.sheet = null; state.draft = null; state.errors = {}; renderSheet(); return; }

      const setStatus = e.target.closest("[data-set-status]");
      if (setStatus && state.sheet) {
        await A.setStatus(state.sheet.number, setStatus.dataset.setStatus);
        await refresh();
        return;
      }

      const cancel = e.target.closest("[data-cancel-order]");
      if (cancel) {
        const key = "cancel-" + cancel.dataset.cancelOrder;
        if (state.confirm !== key) { arm(key); renderSheet(); return; }
        state.confirm = "";
        await A.setStatus(Number(cancel.dataset.cancelOrder), "cancelled");
        await refresh();
        return;
      }

      const reviewStatus = e.target.closest("[data-review-status]");
      if (reviewStatus) {
        try {
          await A.setReviewStatus(reviewStatus.dataset.reviewId, reviewStatus.dataset.reviewStatus);
          await refresh();
          LP.toast("<span>" + t("adminSaved") + "</span>");
        } catch (err) { LP.toast("<span>" + t("adminStorageFull") + "</span>"); }
        return;
      }

      const delReview = e.target.closest("[data-delete-review]");
      if (delReview) {
        const key = "delete-review-" + delReview.dataset.deleteReview;
        if (state.confirm !== key) { state.confirm = key; clearTimeout(confirmTimer); confirmTimer = setTimeout(() => { state.confirm = ""; render(); }, 4000); render(); return; }
        state.confirm = "";
        await A.deleteReview(delReview.dataset.deleteReview);
        await refresh();
        return;
      }

      const note = e.target.closest("[data-save-note]");
      if (note) {
        await A.setNote(Number(note.dataset.saveNote), document.getElementById("order-note").value);
        await load();
        LP.toast("<span>" + t("adminSaved") + "</span>");
        return;
      }

      if (e.target.closest("[data-new-product]")) {
        state.draft = blankProduct();
        state.errors = {};
        state.sheet = { type: "product", id: null };
        renderSheet();
        return;
      }

      const edit = e.target.closest("[data-edit-product]");
      if (edit) {
        const p = products.find(x => x.id === edit.dataset.editProduct);
        if (!p) return;
        state.draft = JSON.parse(JSON.stringify(Object.assign({ desc: { ar: "", en: "" }, badges: [], soldOut: false, hidden: false }, p)));
        state.errors = {};
        state.confirm = "";
        state.sheet = { type: "product", id: p.id };
        renderSheet();
        return;
      }

      const removePhoto = e.target.closest("[data-remove-photo]");
      if (removePhoto && state.draft) {
        readForm();
        const list = photosOf(state.draft).slice();
        list.splice(Number(removePhoto.dataset.removePhoto), 1);
        setPhotos(list);
        state.errors = {};
        renderSheet();
        return;
      }

      const reset = e.target.closest("[data-reset-product]");
      if (reset) {
        await A.resetProduct(reset.dataset.resetProduct);
        state.sheet = null;
        state.draft = null;
        await refresh();
        LP.toast("<span>" + t("adminSaved") + "</span>");
        return;
      }

      const del = e.target.closest("[data-delete-product]");
      if (del) {
        const key = "delete-" + del.dataset.deleteProduct;
        if (state.confirm !== key) { arm(key); renderSheet(); return; }
        state.confirm = "";
        await A.deleteProduct(del.dataset.deleteProduct);
        state.sheet = null;
        state.draft = null;
        await refresh();
      }
    });

    root.addEventListener("change", async e => {
      if (e.target.matches("[data-status-select]") && state.sheet) {
        await A.setStatus(state.sheet.number, e.target.value);
        await refresh();
        return;
      }
      if (e.target.matches("[data-sold-out]")) {
        const p = products.find(x => x.id === e.target.dataset.soldOut);
        if (!p) return;
        try {
          await A.saveProduct(Object.assign({}, p, { soldOut: e.target.checked }));
          await refresh();
          LP.toast("<span>" + t("adminSaved") + "</span>");
        } catch (err) { LP.toast("<span>" + t("adminStorageFull") + "</span>"); }
        return;
      }
      if (e.target.matches("#product-cat")) { state.productCat = e.target.value; render(); return; }
      if (e.target.matches("[data-photo-input]") && state.draft) {
        readForm();
        const max = LP.config.uploadImage.maxPerProduct;
        const list = photosOf(state.draft).slice();
        for (const file of [...e.target.files].slice(0, max - list.length)) {
          try { list.push(await shrinkImage(file)); } catch (err) { /* not an image — skip it */ }
        }
        setPhotos(list);
        state.errors = {};
        renderSheet();
      }
    });

    root.addEventListener("input", e => {
      if (e.target.matches("#order-search")) { state.q = e.target.value; renderKeepFocus("order-search"); return; }
      if (e.target.matches("#product-search")) { state.productQ = e.target.value; renderKeepFocus("product-search"); }
    });

    // Back/forward or a link to #orders, #products, #reviews or #delivery switches the tab
    window.addEventListener("hashchange", () => {
      const tab = location.hash.slice(1);
      if (TABS.includes(tab) && tab !== state.tab) { state.tab = tab; render(); }
    });

    // Escape closes the sheet through the dialog's own cancel event
    sheet().addEventListener("cancel", () => { state.sheet = null; state.draft = null; state.errors = {}; });

    // Orders placed in another tab of this browser show up without a reload
    window.addEventListener("storage", e => {
      if ([LP.config.storage.orders, LP.config.storage.catalog, LP.config.storage.settings, LP.config.storage.reviews].includes(e.key) && A.isLoggedIn()) refresh();
    });
  }

  LP.page = { id: "admin", standalone: true, render };
})();
