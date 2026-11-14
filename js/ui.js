/* =========================================================
   Shared UI: header, menu drawer, footer, product card
   (color swatches, quick view), quick view dialog,
   fly-to-bag, toast, message helper, language.
   Each page sets LP.page = { id, render() }.
   ========================================================= */
window.LP = window.LP || {};

// Star rating, e.g. 4 → ★★★★☆ (read out as "4 out of 5 stars")
LP.stars = n => '<span class="stars" role="img" aria-label="' + LP.t("starsLabel", { n: Math.round(n * 10) / 10 }) + '">' +
  [1, 2, 3, 4, 5].map(i => (i <= Math.round(n) ? LP.icons.star.replace('class="icon star"', 'class="icon star is-on"') : LP.icons.star)).join("") + "</span>";

// "@lapetite_byheba", kept left-to-right and as typed (inside Arabic text and uppercase buttons)
LP.handle = () => '<span class="handle" dir="ltr">@' + LP.config.instagramHandle + "</span>";

LP.esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

LP.icons = {
  search: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  bag: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  home: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11 12 4l8 7v9H4z"/><path d="M10 20v-5h4v5"/></svg>',
  menu: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
  close: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  arrow: '<svg class="icon icon--flip" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  // Instagram's own glyph in its colours (an image file, so it keeps its gradient anywhere)
  instagram: '<img class="icon icon--logo" src="' + LP.config.brandImagePath + LP.config.instagramLogo + '" alt="" width="24" height="24">',
  whatsapp: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/><path d="M9 9.5c.3 2 2.5 4.2 4.5 4.5l1-1.2 2 .9c-.3 1.2-1.3 1.8-2.4 1.6C11 14.7 9.3 13 8.7 10.9c-.2-1.1.4-2.1 1.6-2.4l.9 2z"/></svg>',
  pin: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6-5.7-6-11a6 6 0 0 1 12 0c0 5.3-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg>',
  truck: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>',
  spark: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/></svg>',
  leaf: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19 13 11"/></svg>',
  camera: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  ruler: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15 15 3l6 6L9 21z"/><path d="M7 11l2 2M10 8l2 2M13 5l2 2"/></svg>',
  check: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>',
  chevron: '<svg class="icon icon--flip" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
  info: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.5v.5"/></svg>',
  help: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6M12 16.8v.4"/></svg>',
  star: '<svg class="icon star" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"/></svg>',
  gift: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13"/><path d="M12 7c-1-2.5-4.5-3.5-4.5-1.3C7.5 7 10 7 12 7zm0 0c1-2.5 4.5-3.5 4.5-1.3C16.5 7 14 7 12 7z"/></svg>',
  receipt: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>',
  plus: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  phone: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h3l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z"/></svg>',
  logout: '<svg class="icon icon--flip" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10"/></svg>',
  filter: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
  crescent: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 3.5a8.5 8.5 0 1 0 5 15.4A7 7 0 0 1 15.5 3.5z"/></svg>'
};

LP.page = LP.page || { id: "", render() {} };
LP.reducedMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Shell ---------- */
LP.renderShell = function () {
  const t = LP.t;
  const pageId = LP.page.id;
  const params = new URLSearchParams(location.search);
  const announceClosed = LP.storage.get(LP.config.storage.announce, false);
  const current = (id, test) => (pageId === id && (test === undefined || test) ? ' aria-current="page"' : "");

  const navStart =
    '<li><a class="nav__link" href="shop.html"' + current("shop") + ">" + t("shop") + "</a></li>" +
    '<li><a class="nav__link" href="about.html"' + current("about") + ">" + t("navAbout") + "</a></li>";
  // Desktop has no menu button, so every page the menu lists is up here too
  const navEnd =
    '<li><a class="nav__link" href="track.html"' + (pageId === "track" || pageId === "order" ? ' aria-current="page"' : "") + ">" + t("navTrack") + "</a></li>" +
    '<li><a class="nav__link" href="help.html"' + current("help") + ">" + t("navHelp") + "</a></li>" +
    '<li><a class="nav__link" href="contact.html"' + current("contact") + ">" + t("navContact") + "</a></li>";

  // The bag icon appears twice: in the desktop bar and in the phone corner
  const bagLink = '<a class="icon-btn" href="bag.html" aria-label="' + t("bag") + '" data-bag-target data-open-bag aria-haspopup="dialog">' + LP.icons.bag + '<span class="count-badge" data-bag-count hidden></span></a>';

  const head = document.getElementById("site-header");
  head.className = "site-head" + (LP.page.overlayHeader ? " site-head--overlay" : "");
  head.innerHTML =
    '<a class="skip-link" href="#main">' + t("skip") + "</a>" +
    '<div class="announce"' + (announceClosed ? " hidden" : "") + ">" +
      '<div class="container announce__inner"><span class="announce__text"><span class="announce__msg">' + LP.announceText() + "</span></span>" +
      '<button class="announce__close" type="button" data-close-announce aria-label="' + t("close") + '">' + LP.icons.close + "</button></div>" +
    "</div>" +
    '<header class="header"><div class="container header__inner">' +
      // Phones and tablets: menu + language in the top-left corner (same in both languages)
      '<div class="header__corner header__corner--left">' +
        '<button class="icon-btn" type="button" data-open-menu aria-label="' + t("menu") + '" aria-controls="menu-drawer">' + LP.icons.menu + "</button>" +
        '<button class="lang-btn" type="button" data-lang-toggle aria-label="' + t("langToggleLabel") + '">' + t("langToggle") + "</button>" +
      "</div>" +
      // Desktop navigation
      '<div class="header__start">' +
        '<nav class="nav" aria-label="' + t("shop") + '"><ul class="nav__list">' + navStart + "</ul></nav>" +
      "</div>" +
      '<a class="wordmark" href="index.html" aria-label="' + LP.config.brand + '">' + LP.config.brand + "<small>" + t("tagline") + "</small></a>" +
      '<div class="header__end">' +
        '<nav class="nav" aria-label="' + t("menuInfo") + '"><ul class="nav__list">' + navEnd + "</ul></nav>" +
        '<a class="icon-btn only-desktop" href="shop.html?focus=search" aria-label="' + t("search") + '">' + LP.icons.search + "</a>" +
        '<button class="lang-btn" type="button" data-lang-toggle aria-label="' + t("langToggleLabel") + '">' + t("langToggle") + "</button>" +
        bagLink +
      "</div>" +
      // Phones and tablets: search + bag in the top-right corner, bag at the edge
      '<div class="header__corner header__corner--right">' +
        '<a class="icon-btn" href="shop.html?focus=search" aria-label="' + t("search") + '">' + LP.icons.search + "</a>" +
        bagLink +
      "</div>" +
    "</div></header>" +
    LP.renderDrawer();

  const cats = Object.keys(LP.labels.categories);
  document.getElementById("site-footer").innerHTML =
    '<footer class="footer"><div class="container">' +
      '<div class="footer__grid">' +
        '<div class="footer__brand"><a class="wordmark" href="index.html">' + LP.config.brand + "<small>" + t("tagline") + "</small></a>" +
          "<p>" + t("footerAbout") + "</p>" +
          '<ul class="footer__links"><li><a href="' + LP.config.instagramUrl + '" target="_blank" rel="noopener">' + LP.icons.instagram + LP.handle() + "</a></li></ul>" +
        "</div>" +
        '<div><p class="footer__title">' + t("footerShop") + '</p><ul class="footer__links">' +
          cats.map(c => '<li><a href="shop.html?cat=' + c + '">' + LP.label("categories", c) + "</a></li>").join("") +
        "</ul></div>" +
        '<div><p class="footer__title">' + t("footerHelp") + '</p><ul class="footer__links">' +
          '<li><a href="track.html">' + t("navTrack") + "</a></li>" +
          '<li><a href="help.html">' + t("footerFaq") + "</a></li>" +
        "</ul></div>" +
        '<div><p class="footer__title">' + t("footerBrand") + '</p><ul class="footer__links">' +
          '<li><a href="about.html">' + t("navAbout") + "</a></li>" +
          '<li><a href="contact.html">' + t("navContact") + "</a></li>" +
        "</ul></div>" +
      "</div>" +
      '<div class="footer__bottom"><p>' + t("footerRights", { year: new Date().getFullYear() }) + "</p></div>" +
    "</div></footer>";

  LP.toastEl();   // in the page before its first message, so screen readers announce it
  if (!document.getElementById("quick-view")) {
    const qv = document.createElement("dialog");
    qv.id = "quick-view";
    qv.className = "qv";
    document.body.appendChild(qv);
  }

  LP.updateBagCount(false);

  // Delivery fees can be changed in the admin panel
  if (LP.api && !LP._feesLoaded) {
    LP._feesLoaded = true;
    LP.api.getSettings().then(s => {
      LP.setDeliveryFees(s.deliveryFees, s.freeDeliveryOver);
      document.querySelectorAll(".announce__msg").forEach(el => { el.textContent = LP.announceText(); });
      document.dispatchEvent(new CustomEvent("lp:fees"));
    });
  }
};

// Phone/tablet menu. The page she's on is marked (aria-current="page"); on a product page,
// that product's category is marked as the section she's in (aria-current="true").
LP.renderDrawer = function () {
  const t = LP.t;
  const pageId = LP.page.id;
  const params = new URLSearchParams(location.search);
  const cats = Object.keys(LP.labels.categories);
  const product = pageId === "product" && LP.getProduct ? LP.getProduct(params.get("id")) : null;
  const mark = (isPage, isSection) => (isPage ? ' aria-current="page"' : isSection ? ' aria-current="true"' : "");

  const shopLink = (href, label, isPage, isSection) =>
    '<a class="drawer__link" href="' + href + '"' + mark(isPage, isSection) + "><span>" + label + "</span>" + LP.icons.chevron + "</a>";
  const infoLink = (href, icon, label, ids) =>
    '<a class="drawer__link drawer__link--small" href="' + href + '"' + mark(ids.includes(pageId)) + ">" + LP.icons[icon] + "<span>" + label + "</span></a>";

  return '<dialog class="drawer" id="menu-drawer" aria-label="' + t("menu") + '">' +
    '<div class="drawer__head"><a class="wordmark" href="index.html">' + LP.config.brand + "<small>" + t("tagline") + "</small></a>" +
      '<button class="icon-btn" type="button" data-close-menu aria-label="' + t("close") + '">' + LP.icons.close + "</button></div>" +
    '<nav class="drawer__body" aria-label="' + t("menu") + '">' +
      '<div class="drawer__group"><p class="eyebrow">' + t("menuShop") + "</p>" +
        shopLink("shop.html", t("shopAll"), pageId === "shop" && !params.get("cat")) +
        cats.map(c => shopLink("shop.html?cat=" + c, LP.label("categories", c), pageId === "shop" && params.get("cat") === c, product && product.category === c)).join("") +
      "</div>" +
      '<div class="drawer__group"><p class="eyebrow">' + t("menuInfo") + "</p>" +
        infoLink("track.html", "truck", t("navTrack"), ["track", "order"]) +
        infoLink("help.html", "help", t("navHelp"), ["help"]) +
        infoLink("about.html", "info", t("navAbout"), ["about"]) +
        infoLink("contact.html", "instagram", t("navContact"), ["contact"]) +
      "</div>" +
    "</nav>" +
  "</dialog>";
};

LP.updateBagCount = function (bump) {
  const n = LP.bag.count();
  document.querySelectorAll("[data-bag-count]").forEach(el => {
    el.textContent = n;
    el.hidden = n === 0;
    if (bump) LP.bump(el);
  });
};

LP.bump = function (el) {
  el.classList.remove("is-bumping");
  void el.offsetWidth;
  el.classList.add("is-bumping");
};

/* ---------- Static text in the page HTML ---------- */
LP.applyStaticText = function () {
  document.documentElement.lang = LP.lang;
  document.documentElement.dir = LP.lang === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = LP.t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => { el.placeholder = LP.t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll("[data-i18n-aria]").forEach(el => { el.setAttribute("aria-label", LP.t(el.dataset.i18nAria)); });
  document.querySelectorAll("[data-i18n-content]").forEach(el => { el.content = LP.t(el.dataset.i18nContent); });
  const title = document.querySelector("[data-page-title]");
  if (title) document.title = LP.t(title.dataset.pageTitle) + " · " + LP.config.brand;
};

/* ---------- For search engines ---------- */
LP.setDescription = function (text) {
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.content = text;
};
// The one address a page is indexed under (no colour, filter or sort parameters); returns it in full
LP.setCanonical = function (path) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = new URL(path, location.href).href;
  return link.href;
};
// Structured data (schema.org): lets Google show the price, stock and rating in its results
LP.setSchema = function (data) {
  let el = document.getElementById("schema");
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = "schema";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(Object.assign({ "@context": "https://schema.org" }, data));
};

/* Pick the current language from a { ar, en } object */
LP.tx = obj => (obj ? obj[LP.lang] || obj.ar : "");

/* ---------- Product card ---------- */
// level: "h2" where the cards sit straight under the page title (shop); "h3" inside a titled section
LP.card = function (p, level) {
  const h = level === "h2" ? "h2" : "h3";
  const color = LP.firstImageColor(p);
  const imgs = LP.imagesFor(p, color);
  const name = LP.esc(p.name[LP.lang]);
  const badgeMap = { new: ["badgeNew", ""], bestseller: ["badgeBestseller", " badge--accent"], exclusive: ["badgeExclusive", " badge--accent"] };
  const badges = (p.soldOut ? '<span class="badge badge--soldout">' + LP.t("soldOut") + "</span>" : "") +
    p.badges.filter(b => badgeMap[b]).map(b => '<span class="badge' + badgeMap[b][1] + '">' + LP.t(badgeMap[b][0]) + "</span>").join("");
  const shown = p.colors.slice(0, 4);
  const extra = p.colors.length - shown.length;
  const swatches = shown.map(c =>
    '<button class="swatch-btn" type="button" data-swatch="' + c + '" aria-pressed="' + (c === color) + '" aria-label="' + LP.t("showColor", { c: LP.label("colors", c) }) + '" title="' + LP.label("colors", c) + '">' +
      '<span class="dot" style="background: var(--swatch-' + c + ')"></span></button>').join("") +
    (extra > 0 ? "<span>" + LP.t("moreColors", { n: extra }) + "</span>" : "");

  return '<article class="card' + (p.soldOut ? " is-sold-out" : "") + '" data-id="' + p.id + '" data-color="' + color + '">' +
    '<div class="card__media">' +
      (badges ? '<div class="card__badges">' + badges + "</div>" : "") +
      '<img class="card__img" ' + LP.imgAttrs(imgs[0], "card") + ' alt="' + name + '" loading="lazy" decoding="async" width="900" height="1200">' +
      (LP.canHover ? '<img class="card__img" ' + LP.imgAttrs(imgs[1] || imgs[0], "card") + ' alt="" loading="lazy" decoding="async" width="900" height="1200" aria-hidden="true"' + (imgs[1] ? "" : " hidden") + ">" : "") +
      '<button class="btn btn--light card__quick" type="button" data-quick="' + p.id + '">' + LP.t("quickView") + "</button>" +
    "</div>" +
    '<div class="card__body">' +
      "<" + h + ' class="card__name"><a href="product.html?id=' + p.id + "&color=" + color + '">' + name + "</a></" + h + ">" +
      '<div class="card__meta"><span class="card__price">' + LP.formatPrice(p.price) + '</span><span class="card__dots" role="group" aria-label="' + LP.t("colorLabel") + '">' + swatches + "</span></div>" +
    "</div>" +
  "</article>";
};

LP.setCardColor = function (card, color) {
  const p = LP.getProduct(card.dataset.id);
  if (!p || card.dataset.color === color) return;
  const imgs = LP.imagesFor(p, color);
  const [main, alt] = card.querySelectorAll(".card__img");
  LP.setImage(main, imgs[0]);
  if (alt) {
    LP.setImage(alt, imgs[1] || imgs[0]);
    alt.hidden = !imgs[1];
  }
  card.dataset.color = color;
  card.querySelector(".card__name a").href = "product.html?id=" + p.id + "&color=" + color;
  card.querySelectorAll("[data-swatch]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.swatch === color)));
};

/* ---------- Fly a product photo into the bag icon ---------- */
// then: runs when the photo lands (used to open the bag drawer)
LP.flyToBag = function (src, rect, then) {
  const target = [...document.querySelectorAll("[data-bag-target]")].find(el => el.getBoundingClientRect().width > 0);
  const done = () => { LP.updateBagCount(true); if (then) then(); };
  if (!target || !rect || !rect.width || LP.reducedMotion() || !Element.prototype.animate) { done(); return; }
  const t = target.getBoundingClientRect();
  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  img.className = "fly";
  Object.assign(img.style, { left: rect.left + "px", top: rect.top + "px", width: rect.width + "px", height: rect.height + "px" });
  document.body.appendChild(img);
  const dx = t.left + t.width / 2 - (rect.left + rect.width / 2);
  const dy = t.top + t.height / 2 - (rect.top + rect.height / 2);
  const scale = Math.max(0.06, t.width / rect.width);
  const anim = img.animate([
    { transform: "translate(0, 0) scale(1)", opacity: 1 },
    { transform: "translate(" + dx * 0.4 + "px, " + (dy * 0.4 - 40) + "px) scale(0.45)", opacity: 0.95, offset: 0.45 },
    { transform: "translate(" + dx + "px, " + dy + "px) scale(" + scale + ")", opacity: 0.2 }
  ], { duration: LP.config.effects.flyDuration, easing: "cubic-bezier(0.5, 0, 0.3, 1)" });
  anim.onfinish = () => { img.remove(); done(); };
};

/* ---------- Quick view ---------- */
LP.quickView = {
  state: null,
  open(id, color, sourceCard) {
    const p = LP.getProduct(id);
    if (!p) return;
    this.state = { id, color: color || LP.firstImageColor(p), size: p.sizes.length === 1 ? p.sizes[0] : "", qty: 1, img: 0, source: sourceCard };
    this.render();
    const qv = document.getElementById("quick-view");
    LP.openDialog(qv);
    // Origin-aware: the dialog grows from the middle of the card that opened it
    const from = sourceCard && sourceCard.getBoundingClientRect();
    const box = qv.getBoundingClientRect();
    qv.style.setProperty("--qv-origin", from && box.width ? (from.left + from.width / 2 - box.left) + "px " + (from.top + from.height / 2 - box.top) + "px" : "50% 50%");
  },
  render() {
    const s = this.state;
    const p = LP.getProduct(s.id);
    const t = LP.t;
    const imgs = LP.imagesFor(p, s.color);
    const name = LP.esc(p.name[LP.lang]);
    document.getElementById("quick-view").innerHTML =
      '<button class="icon-btn qv__close" type="button" data-qv-close aria-label="' + t("close") + '">' + LP.icons.close + "</button>" +
      '<div class="qv__grid">' +
        '<div class="qv__media">' +
          '<img class="qv__img" id="qv-img" ' + LP.imgAttrs(imgs[s.img], "quick") + ' alt="' + name + '" width="900" height="1200">' +
          (imgs.length > 1 ? '<div class="qv__thumbs">' + imgs.map((src, i) =>
            '<button type="button" data-qv-img="' + i + '" aria-current="' + (i === s.img) + '" aria-label="' + t("image") + " " + (i + 1) + '"><img src="' + LP.thumb(src) + '" alt="" width="900" height="1200"></button>').join("") + "</div>" : "") +
        "</div>" +
        '<form class="qv__body" id="qv-form" novalidate>' +
          '<div class="buybox__title"><p class="eyebrow">' + LP.label("collections", p.collection) + '</p><h2 class="h2">' + name + '</h2><p class="buybox__price">' + LP.formatPrice(p.price) + "</p></div>" +
          '<fieldset class="buybox__group"><legend class="buybox__label"><span>' + t("colorLabel") + "</span><strong>" + LP.label("colors", s.color) + "</strong></legend>" +
            '<div class="options">' + p.colors.map(c =>
              '<label class="option option--swatch" title="' + LP.label("colors", c) + '"><input type="radio" name="qv-color" value="' + c + '"' + (c === s.color ? " checked" : "") + '><span style="--swatch: var(--swatch-' + c + ')"><span class="sr-only">' + LP.label("colors", c) + "</span></span></label>").join("") + "</div>" +
          "</fieldset>" +
          '<fieldset class="buybox__group"><legend class="buybox__label"><span>' + t("sizeLabel") + "</span><strong>" + (s.size ? LP.label("sizes", s.size) : "") + "</strong></legend>" +
            '<div class="options" id="qv-sizes">' + p.sizes.map(z =>
              '<label class="option option--size"><input type="radio" name="qv-size" value="' + z + '"' + (z === s.size ? " checked" : "") + "><span>" + LP.label("sizes", z) + "</span></label>").join("") + "</div>" +
            '<p class="field__error" id="qv-size-error" role="alert"></p>' +
          "</fieldset>" +
          '<button class="btn btn--primary btn--block" type="submit"' + (p.soldOut ? " disabled" : "") + ">" + t(p.soldOut ? "soldOut" : "addToBag") + "</button>" +
          '<a class="link" href="product.html?id=' + p.id + "&color=" + s.color + '">' + t("viewDetails") + LP.icons.arrow + "</a>" +
        "</form>" +
      "</div>";
  },
  close() { LP.closeDialog(document.getElementById("quick-view")); },
  add() {
    const s = this.state;
    const p = LP.getProduct(s.id);
    if (!p || p.soldOut) return;
    if (!s.size) {
      document.getElementById("qv-size-error").textContent = LP.t("chooseSize");
      const first = document.querySelector("#qv-sizes input");
      if (first) first.focus();
      return;
    }
    const img = document.getElementById("qv-img");
    const rect = img.getBoundingClientRect();
    const src = img.currentSrc || img.src;
    LP.bag.add(s.id, s.color, s.size, s.qty);
    this.close();
    LP.flyToBag(src, rect, LP.cart ? LP.cart.open : null);
    if (!LP.cart) LP.toast("<span>" + LP.t("addedToBag") + '</span><a href="bag.html">' + LP.t("viewBag") + "</a>");
  }
};

/* ---------- Toast ---------- */
LP.toastEl = function () {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  return el;
};
LP.toast = function (html) {
  const el = LP.toastEl();
  el.innerHTML = html;
  el.classList.add("is-visible");
  clearTimeout(LP._toastTimer);
  LP._toastTimer = setTimeout(LP.hideToast, LP.config.effects.toastDuration);
};
LP.hideToast = () => LP.toastEl().classList.remove("is-visible");

/* ---------- Copy text (used by checkout and contact) ---------- */
LP.copyText = async function (text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    ta.remove();
    return ok;
  }
};

/* ---------- Dialog helpers ---------- */
LP.openDialog = el => {
  LP.swipeToClose(el);
  if (typeof el.showModal === "function") el.showModal(); else el.setAttribute("open", "");
  // Focus the dialog itself, not its close button: Tab then moves to the first control
  if (!el.hasAttribute("tabindex")) el.tabIndex = -1;
  el.focus();
};
LP.closeDialog = el => { if (typeof el.close === "function") el.close(); else el.removeAttribute("open"); };

/* ---------- Swipe a sheet closed (touch screens) ----------
   Sheets say in CSS which way they slide out (--sheet-x / --sheet-y). Dragging that way follows
   the finger; past LP.config.effects.swipeClose of the sheet, or with a quick flick, it closes
   (like Escape, so pages hear "cancel"), otherwise it springs back. Sliders, fields and sideways
   scrollers keep their own drags, and a sheet that slides down only follows once its content is
   scrolled to the top. */
LP.swipeToClose = function (sheet) {
  if (sheet._swipe) return;
  sheet._swipe = true;
  const fx = LP.config.effects;
  let drag = null;

  // Is something between the finger and the sheet already using this direction?
  const busy = (el, axis) => {
    for (; el && el !== sheet; el = el.parentElement) {
      const cs = getComputedStyle(el);
      if (axis === "x" && /auto|scroll/.test(cs.overflowX) && el.scrollWidth > el.clientWidth) return true;
      if (axis === "y" && /auto|scroll/.test(cs.overflowY) && el.scrollTop > 0) return true;
    }
    return false;
  };
  const move = px => {
    sheet.style.transform = drag.axis === "x" ? "translateX(" + px + "px)" : "translateY(" + px + "px)";
  };

  sheet.addEventListener("touchstart", e => {
    drag = null;
    if (e.touches.length !== 1 || e.target.closest("input, select, textarea")) return;
    const cs = getComputedStyle(sheet);
    const x = parseFloat(cs.getPropertyValue("--sheet-x")) || 0;
    const y = parseFloat(cs.getPropertyValue("--sheet-y")) || 0;
    if (!x && !y) return;
    const axis = x ? "x" : "y";
    if (busy(e.target, axis)) return;
    const t = e.touches[0];
    drag = { axis, dir: x || y, x: t.clientX, y: t.clientY, at: e.timeStamp, on: false, offset: 0, speed: 0 };
  }, { passive: true });

  sheet.addEventListener("touchmove", e => {
    if (!drag) return;
    const t = e.touches[0];
    const dx = t.clientX - drag.x;
    const dy = t.clientY - drag.y;
    const along = (drag.axis === "x" ? dx : dy) * drag.dir;
    const across = Math.abs(drag.axis === "x" ? dy : dx);
    if (!drag.on) {
      if (Math.hypot(dx, dy) < fx.swipeStart) return;
      // Scrolling, or pulling the other way: leave it to the page
      if (along <= across || !e.cancelable) { drag = null; return; }
      drag.on = true;
      sheet.style.transition = "none";
    }
    e.preventDefault();
    const offset = Math.max(0, along);
    drag.speed = (offset - drag.offset) / Math.max(1, e.timeStamp - drag.at);
    drag.offset = offset;
    drag.at = e.timeStamp;
    move(offset * drag.dir);
  }, { passive: false });

  const end = () => {
    const d = drag;
    drag = null;
    if (!d || !d.on) return;
    const size = d.axis === "x" ? sheet.offsetWidth : sheet.offsetHeight;
    const close = d.offset > size * fx.swipeClose || d.speed > fx.swipeFlick;
    // Hand back to the CSS transition: it carries on from where the finger let go
    sheet.style.transition = "";
    sheet.style.transform = "";
    if (close && sheet.dispatchEvent(new Event("cancel", { cancelable: true }))) LP.closeDialog(sheet);
  };
  sheet.addEventListener("touchend", end);
  sheet.addEventListener("touchcancel", () => { if (drag) drag.offset = drag.speed = 0; end(); });
};

/* ---------- First-visit language popup ---------- */
LP.langPicker = function () {
  if (LP.langChosen || document.getElementById("lang-picker")) return;
  const ar = LP.strings.ar;
  const en = LP.strings.en;
  const dlg = document.createElement("dialog");
  dlg.id = "lang-picker";
  dlg.className = "lang-pick";
  dlg.setAttribute("aria-labelledby", "lang-pick-title");
  dlg.innerHTML =
    '<img class="lang-pick__img" ' + LP.imgAttrs(LP.config.langPickerImage, "half") + ' alt="" width="1200" height="1600">' +
    '<div class="lang-pick__body">' +
      '<p class="wordmark">' + LP.config.brand + "<small>" + ar.tagline + "</small></p>" +
      '<h2 class="lang-pick__title" id="lang-pick-title">' +
        '<span lang="ar" dir="rtl">' + ar.langPickTitle + "</span>" +
        '<span lang="en" dir="ltr">' + en.langPickTitle + "</span>" +
      "</h2>" +
      '<div class="lang-pick__options">' +
        '<button class="btn btn--primary" type="button" data-pick-lang="ar" lang="ar" dir="rtl">' + ar.langPickArabic + "</button>" +
        '<button class="btn btn--secondary" type="button" data-pick-lang="en" lang="en" dir="ltr">' + en.langPickEnglish + "</button>" +
      "</div>" +
    "</div>";
  document.body.appendChild(dlg);

  const choose = lang => {
    LP.closeDialog(dlg);
    dlg.remove();
    if (lang === LP.lang) {
      LP.langChosen = true;
      LP.storage.set(LP.config.storage.lang, lang);
    } else {
      LP.setLang(lang);
    }
  };
  dlg.addEventListener("click", e => {
    const btn = e.target.closest("[data-pick-lang]");
    if (btn) choose(btn.dataset.pickLang);
  });
  // Escape keeps the current language (Arabic by default)
  dlg.addEventListener("cancel", e => { e.preventDefault(); choose(LP.lang); });
  LP.openDialog(dlg);
};

/* ---------- Header on scroll ----------
   --head-p goes 0 → 1 over --header-shrink-distance (the home header shrinks with it);
   is-scrolled once it reaches 1 (glass); is-past-hero once the hero photo has gone by. */
LP.headerScroll = function () {
  const head = document.getElementById("site-header");
  const hero = document.querySelector(".hero");
  const distance = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-shrink-distance")) || 1;
  LP._headUpdate = function () {
    const p = Math.min(window.scrollY / distance, 1);
    head.style.setProperty("--head-p", p.toFixed(3));
    head.classList.toggle("is-scrolled", p >= 1);
    const bar = head.querySelector(".header");
    if (hero && bar) head.classList.toggle("is-past-hero", hero.getBoundingClientRect().bottom <= bar.getBoundingClientRect().bottom);
  };
  if (!LP._headBound) {
    LP._headBound = true;
    window.addEventListener("scroll", () => LP._headUpdate(), { passive: true });
    window.addEventListener("resize", () => LP._headUpdate());
  }
  LP._headUpdate();
};

/* ---------- Page to page ----------
   With cross-page view transitions on (effects.css), the tapped card's photo carries the
   "product-photo" name, so it grows into the product page's first photo. Arriving from a
   product page, that piece's card (when it's on screen) takes the name so the photo shrinks back into it. */
LP.markPhoto = function (img) {
  document.querySelectorAll(".card__img").forEach(i => { i.style.viewTransitionName = ""; });
  if (img) img.style.viewTransitionName = "product-photo";
};
// The photo showing on a card (the second one while hovered)
const cardPhoto = card => [...card.querySelectorAll(".card__img")].reverse().find(i => !i.hidden && Number(getComputedStyle(i).opacity) > 0.5);

document.addEventListener("click", e => {
  const link = e.target.closest(".card a[href^='product.html']");
  if (link && !e.metaKey && !e.ctrlKey && !e.shiftKey) LP.markPhoto(cardPhoto(link.closest(".card")));
});
window.addEventListener("pagereveal", e => {
  if (!e.viewTransition) return;
  // The browser may skip a transition (e.g. a slow page); that's fine, so don't report it as an error
  [e.viewTransition.ready, e.viewTransition.finished, e.viewTransition.updateCallbackDone].forEach(pr => pr && pr.catch(() => {}));
  const from = window.navigation && navigation.activation && navigation.activation.from;
  const id = from && /product\.html/.test(from.url) ? new URL(from.url).searchParams.get("id") : "";
  const card = id && document.querySelector('.card[data-id="' + CSS.escape(id) + '"]');
  const r = card && card.getBoundingClientRect();
  LP.markPhoto(r && r.bottom > 0 && r.top < innerHeight ? cardPhoto(card) : null);
});

/* ---------- Open the next page instantly ----------
   Chrome builds a page in the background once a link to it is hovered or pressed, so the tap
   shows it straight away. Not for links that open the bag drawer, jump within a page, focus the
   search box, open the admin or leave the site. */
if (HTMLScriptElement.supports && HTMLScriptElement.supports("speculationrules")) {
  const rules = document.createElement("script");
  rules.type = "speculationrules";
  rules.textContent = JSON.stringify({
    prerender: [{
      where: { and: [
        { selector_matches: "a[href*='.html']" },
        { not: { selector_matches: "[target], [download], [data-open-bag], [href*='#'], [href*='focus='], [href*='admin']" } }
      ] },
      eagerness: "moderate"
    }]
  });
  document.head.appendChild(rules);
}
// A page built ahead of the tap may be behind (language or bag changed since): refresh it as it appears
document.addEventListener("prerenderingchange", () => {
  LP.lang = LP.storage.get(LP.config.storage.lang, LP.config.defaultLang);
  LP.langChosen = LP.storage.get(LP.config.storage.lang, null) !== null;
  const picker = document.getElementById("lang-picker");
  if (picker && LP.langChosen) { LP.closeDialog(picker); picker.remove(); }
  LP.renderAll();
});

/* ---------- Boot ---------- */
LP.renderAll = function () {
  LP.applyStaticText();
  // The admin panel has its own layout: no store header, footer or language popup
  if (LP.page.standalone) { LP.page.render(); return; }
  LP.renderShell();
  // Pages index under their own address (the home page as the folder); product and shop set theirs
  LP.setCanonical(location.pathname.replace(/index\.html$/, ""));
  LP.headerScroll();
  LP.page.render();
  if (LP.effects) LP.effects.init();
  LP.langPicker();
};

document.addEventListener("click", e => {
  if (e.target.closest("[data-lang-toggle]")) {
    LP.setLang(LP.lang === "ar" ? "en" : "ar");
    return;
  }
  if (e.target.closest("[data-close-announce]")) {
    LP.storage.set(LP.config.storage.announce, true);
    const bar = document.querySelector(".announce");
    if (bar) bar.hidden = true;
    return;
  }
  if (e.target.closest("[data-open-menu]")) {
    LP.openDialog(document.getElementById("menu-drawer"));
    return;
  }
  const drawer = document.getElementById("menu-drawer");
  if (drawer && (e.target.closest("[data-close-menu]") || e.target === drawer)) {
    LP.closeDialog(drawer);
    return;
  }

  // Card color swatch (tap)
  const sw = e.target.closest("[data-swatch]");
  if (sw) { LP.setCardColor(sw.closest(".card"), sw.dataset.swatch); return; }

  // Quick view
  const quick = e.target.closest("[data-quick]");
  if (quick) {
    const card = quick.closest(".card");
    LP.quickView.open(quick.dataset.quick, card && card.dataset.color, card);
    return;
  }
  const qv = document.getElementById("quick-view");
  if (qv && (e.target.closest("[data-qv-close]") || e.target === qv)) { LP.quickView.close(); return; }
  const thumb = e.target.closest("[data-qv-img]");
  if (thumb) { LP.quickView.state.img = Number(thumb.dataset.qvImg); LP.quickView.render(); }
});

// Hovering a swatch previews that color's photo
document.addEventListener("mouseover", e => {
  const sw = e.target.closest && e.target.closest("[data-swatch]");
  if (sw) LP.setCardColor(sw.closest(".card"), sw.dataset.swatch);
});

// Quick view: hovering a small photo shows it; hovering a colour previews that colour until the pointer leaves
LP.quickView.show = function (color, index) {
  const s = this.state;
  LP.setImage(document.getElementById("qv-img"), LP.imagesFor(LP.getProduct(s.id), color || s.color)[index === undefined ? s.img : index], "quick");
};
document.addEventListener("mouseover", e => {
  if (!e.target.closest || !e.target.closest("#quick-view")) return;
  const thumb = e.target.closest("[data-qv-img]");
  if (thumb) {
    LP.quickView.state.img = Number(thumb.dataset.qvImg);
    LP.quickView.show();
    document.querySelectorAll("[data-qv-img]").forEach(b => b.setAttribute("aria-current", String(b === thumb)));
    return;
  }
  const swatch = e.target.closest(".option--swatch");
  if (swatch) LP.quickView.show(swatch.querySelector("input").value, 0);
});
document.addEventListener("mouseout", e => {
  if (e.target.closest && e.target.closest("#quick-view .option--swatch")) LP.quickView.show();
});

document.addEventListener("change", e => {
  if (!e.target.closest("#qv-form")) return;
  const s = LP.quickView.state;
  if (e.target.name === "qv-color") { s.color = e.target.value; s.img = 0; LP.quickView.render(); }
  if (e.target.name === "qv-size") {
    s.size = e.target.value;
    e.target.closest("fieldset").querySelector("legend strong").textContent = LP.label("sizes", s.size);
    document.getElementById("qv-size-error").textContent = "";
  }
});

document.addEventListener("submit", e => {
  if (!e.target.matches("#qv-form")) return;
  e.preventDefault();
  LP.quickView.add();
});

document.addEventListener("lp:lang", LP.renderAll);
document.addEventListener("lp:bag", () => LP.updateBagCount(false));
document.addEventListener("DOMContentLoaded", LP.renderAll);
