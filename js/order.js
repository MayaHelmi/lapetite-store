/* =========================================================
   Order page: thank-you message (right after checkout),
   tracking steps, items, details, delivery info and invoice.
   Opened with ?t=<secret token>; &placed=1 right after ordering.
   Once delivered, the customer can rate each piece here.
   ========================================================= */
(function () {
  const params = new URLSearchParams(location.search);
  const token = params.get("t") || "";
  const placed = params.get("placed") === "1";
  let order = null;
  let loaded = false;
  let bound = false;
  let reviewed = [];          // product ids already rated from this order
  const thanked = new Set();  // rated just now: show the thank-you line

  function row(label, value, cls) {
    return '<div class="order-row' + (cls ? " " + cls : "") + '"><span>' + label + "</span><span>" + value + "</span></div>";
  }

  function trackerHtml(o) {
    if (o.status === "cancelled") {
      return '<p class="order-cancelled">' + LP.icons.close + "<span>" + LP.statusText("cancelled") + "</span></p>";
    }
    const steps = LP.config.orderSteps;
    const current = steps.indexOf(o.status);
    const reachedAt = s => {
      const h = o.history.filter(x => x.status === s).pop();
      return h ? LP.formatDay(h.at) : "";
    };
    const statusLine = placed && o.status === "review" ? "" : '<p class="order-status-text">' + LP.statusText(o.status) + "</p>";
    return '<ol class="tracker">' + steps.map((s, i) => {
      const state = i < current ? "is-done" : i === current ? "is-current" : "";
      return '<li class="tracker__step ' + state + '"' + (i === current ? ' aria-current="step"' : "") + ">" +
        '<span class="tracker__dot">' + (i <= current ? LP.icons.check : "") + "</span>" +
        '<span class="tracker__label">' + LP.statusLabel(s) + "</span>" +
        (i <= current ? '<span class="tracker__date">' + reachedAt(s) + "</span>" : "") +
      "</li>";
    }).join("") + "</ol>" + statusLine;
  }

  // Star picker: five radios; the chosen number and the ones before it light up
  function starPicker(id) {
    return '<fieldset class="rate-stars" data-stars>' +
      '<legend class="sr-only">' + LP.t("reviewStars") + "</legend>" +
      [1, 2, 3, 4, 5].map(n =>
        '<label><input type="radio" name="rating" value="' + n + '"><span class="sr-only">' + LP.t("starsLabel", { n }) + "</span>" + LP.icons.star + "</label>").join("") +
    "</fieldset>";
  }

  function reviewsHtml(o) {
    if (o.status !== "delivered") return "";
    const t = LP.t;
    const seen = new Set();
    const items = o.items.filter(i => !seen.has(i.id) && seen.add(i.id)).map(item => {
      const name = LP.esc(item.name[LP.lang] || item.name.ar);
      const done = reviewed.includes(item.id);
      return '<li class="rate-item">' +
        '<img src="' + LP.thumb(LP.orderItemImage(item)) + '" alt="" width="600" height="800" loading="lazy">' +
        '<div class="rate-item__body"><p class="order-item__name">' + name + "</p>" +
          (done
            ? '<p class="rate-done">' + LP.icons.check + "<span>" + t(thanked.has(item.id) ? "reviewThanks" : "reviewDone") + "</span></p>"
            : '<form class="rate-form" data-review="' + item.id + '" novalidate>' + starPicker(item.id) +
                '<label class="sr-only" for="rate-' + item.id + '">' + t("reviewText") + "</label>" +
                '<textarea class="input" id="rate-' + item.id + '" name="text" rows="2" maxlength="' + LP.config.reviews.maxText + '" placeholder="' + t("reviewText") + '"></textarea>' +
                '<p class="field__error" role="alert"></p>' +
                '<button class="btn btn--secondary" type="submit">' + t("reviewSend") + "</button>" +
              "</form>") +
        "</div></li>";
    }).join("");
    return '<section class="order-card" aria-labelledby="rate-title">' +
      '<h2 class="order-card__title" id="rate-title">' + LP.icons.star + "<span>" + t("reviewRateTitle") + "</span></h2>" +
      '<p class="text-secondary">' + t("reviewRateLead") + "</p>" +
      '<ul class="rate-items">' + items + "</ul>" +
    "</section>";
  }

  /* ---------- Add to this order (post-purchase offer, while under review) ---------- */
  // Picked from what she bought: same collections first, then the same categories
  function addonPicks(o) {
    const bought = new Set(o.items.map(i => i.id));
    const ok = p => !bought.has(p.id) && !p.soldOut;
    const collections = new Set(o.items.map(i => (LP.getProduct(i.id) || {}).collection));
    const categories = new Set(o.items.map(i => (LP.getProduct(i.id) || {}).category));
    const first = LP.products.filter(p => ok(p) && collections.has(p.collection));
    const more = LP.products.filter(p => ok(p) && !collections.has(p.collection) && categories.has(p.category));
    return first.concat(more).slice(0, 3);
  }

  function addonHtml(o) {
    if (o.status !== "review") return "";
    const picks = addonPicks(o);
    if (!picks.length) return "";
    const t = LP.t;
    const items = picks.map(p => {
      const color = LP.firstImageColor(p);
      const select = (name, values, labels, selected) => values.length > 1
        ? '<label class="sr-only" for="addon-' + name + "-" + p.id + '">' + t(name === "size" ? "sizeLabel" : "colorLabel") + "</label>" +
          '<select class="select" id="addon-' + name + "-" + p.id + '" name="' + name + '">' +
            (name === "size" ? '<option value="">' + t("sizeLabel") + "</option>" : "") +
            values.map(v => '<option value="' + v + '"' + (v === selected ? " selected" : "") + ">" + LP.label(labels, v) + "</option>").join("") +
          "</select>"
        : '<input type="hidden" name="' + name + '" value="' + values[0] + '">';
      return '<li class="addon">' +
        '<a href="product.html?id=' + p.id + "&color=" + color + '"><img src="' + LP.thumb(LP.imagesFor(p, color)[0]) + '" alt="" width="600" height="800" loading="lazy"></a>' +
        '<form class="addon__body" data-addon="' + p.id + '" novalidate>' +
          '<p class="order-item__name">' + LP.esc(p.name[LP.lang]) + "</p>" +
          '<p class="addon__price">' + LP.formatPrice(p.price) + "</p>" +
          '<div class="addon__pick">' + select("color", p.colors.filter(c => p.images[c]), "colors", color) + select("size", p.sizes, "sizes", "") + "</div>" +
          '<p class="field__error" role="alert"></p>' +
          '<button class="btn btn--secondary" type="submit">' + LP.icons.plus + "<span>" + t("addonAdd") + "</span></button>" +
        "</form></li>";
    }).join("");
    return '<section class="order-card" aria-labelledby="addon-title">' +
      '<h2 class="order-card__title" id="addon-title">' + LP.icons.plus + "<span>" + t("addonTitle") + "</span></h2>" +
      '<p class="text-secondary">' + t("addonLead") + "</p>" +
      (o.deliveryFee > 0 ? LP.freeDeliveryProgress(o.subtotal) : "") +
      '<ul class="addons">' + items + "</ul>" +
    "</section>";
  }

  async function addToOrder(form) {
    const err = form.querySelector(".field__error");
    const size = form.elements.size.value;
    if (!size) { err.textContent = LP.t("chooseSize"); form.elements.size.focus(); return; }
    const btn = form.querySelector("[type=submit]");
    btn.disabled = true;
    try {
      order = await LP.api.addToOrder(token, { id: form.dataset.addon, color: form.elements.color.value, size });
      render();
      LP.toast("<span>" + LP.t("addonAdded") + "</span>");
    } catch (e) {
      err.textContent = LP.t("addonFailed");
      btn.disabled = false;
    }
  }

  function render() {
    LP.applyStaticText();
    const t = LP.t;
    const root = document.getElementById("order-root");
    if (!loaded) return;
    root.removeAttribute("aria-busy");

    if (!order) {
      document.title = t("orderNotFound") + " · " + LP.config.brand;
      root.innerHTML = '<div class="empty">' + LP.icons.search +
        '<p class="h3">' + t("orderNotFound") + '</p><p class="text-secondary">' + t("orderNotFoundText") + "</p>" +
        '<a class="btn btn--primary" href="track.html">' + t("navTrack") + "</a></div>";
      return;
    }

    const o = order;
    const c = o.customer;
    document.title = t("orderTitle", { n: o.number }) + " · " + LP.config.brand;

    const head = placed && o.status === "review"
      ? '<header class="order-hero order-hero--thanks">' +
          '<span class="order-hero__icon">' + LP.icons.check + "</span>" +
          '<h1 class="h2">' + t("orderThanksTitle") + "</h1>" +
          "<p>" + t("orderThanksText") + "</p>" +
          '<p class="order-hero__number">' + t("orderTitle", { n: o.number }) + "</p>" +
        "</header>"
      : '<header class="order-hero">' +
          '<p class="eyebrow">' + t("trackTitle") + "</p>" +
          '<h1 class="h2">' + t("orderTitle", { n: o.number }) + "</h1>" +
          '<span class="status status--' + o.status + '">' + LP.statusLabel(o.status) + "</span>" +
        "</header>";

    const items = o.items.map(item => {
      const name = LP.esc(item.name[LP.lang] || item.name.ar);
      return '<li class="order-item">' +
        '<img src="' + LP.thumb(LP.orderItemImage(item)) + '" alt="" width="900" height="1200" loading="lazy">' +
        '<div class="order-item__body"><p class="order-item__name">' + name + "</p>" +
          '<p class="order-item__meta">' + LP.label("colors", item.color) + " · " + t("sizeLabel") + " " + LP.label("sizes", item.size) + " · " + t("qtyShort", { n: item.qty }) + "</p></div>" +
        '<strong class="order-item__price">' + LP.formatPrice(item.price * item.qty) + "</strong>" +
      "</li>";
    }).join("");

    root.innerHTML = head +
      '<section class="order-card" aria-labelledby="track-title">' +
        '<h2 class="order-card__title" id="track-title">' + LP.icons.truck + "<span>" + t("trackTitle") + "</span></h2>" +
        trackerHtml(o) +
      "</section>" +
      '<section class="order-card" aria-labelledby="items-title">' +
        '<h2 class="order-card__title" id="items-title">' + LP.icons.bag + "<span>" + t("orderDetails") + "</span></h2>" +
        '<ul class="order-items">' + items + "</ul>" +
        '<div class="order-rows">' +
          row(t("orderDate"), LP.formatDate(o.createdAt)) +
          row(t("paymentTitle"), t("paymentCod")) +
        "</div>" +
      "</section>" +
      addonHtml(o) +
      reviewsHtml(o) +
      '<section class="order-card" aria-labelledby="customer-title">' +
        '<h2 class="order-card__title" id="customer-title">' + LP.icons.pin + "<span>" + t("yourDetails") + "</span></h2>" +
        '<div class="order-rows">' +
          row(t("name"), LP.esc(c.name)) +
          row(t("phone"), '<span dir="ltr">' + LP.esc(c.phone) + "</span>") +
          row(t("city"), LP.label("cities", c.city)) +
          row(t("address"), LP.esc(c.address)) +
          (c.notes ? row(t("notes"), LP.esc(c.notes)) : "") +
        "</div>" +
      "</section>" +
      '<section class="order-card" aria-labelledby="invoice-title">' +
        '<h2 class="order-card__title" id="invoice-title">' + LP.icons.receipt + "<span>" + t("invoiceSummary") + "</span></h2>" +
        '<div class="order-rows">' +
          row(t("subtotal"), LP.formatPrice(o.subtotal)) +
          row(t("delivery"), o.deliveryFee ? LP.formatPrice(o.deliveryFee) : t("freeDelivery")) +
          row(t("total"), LP.formatPrice(o.total), "order-row--total") +
        "</div>" +
      "</section>" +
      '<div class="order-link">' +
        "<p>" + t("saveLinkText") + "</p>" +
        '<button class="link" type="button" data-copy-link>' + t("copyLink") + "</button>" +
      "</div>" +
      '<div class="order-actions">' +
        '<a class="btn btn--primary" href="shop.html">' + t("continueShopping") + "</a>" +
        '<button class="btn btn--secondary" type="button" data-print>' + t("printInvoice") + "</button>" +
        '<a class="link" href="' + LP.config.instagramDm + '" target="_blank" rel="noopener">' + LP.icons.instagram + "<span>" + t("askAboutOrder") + "</span></a>" +
      "</div>";
    bind();
  }

  async function sendReview(form) {
    const err = form.querySelector(".field__error");
    const rating = form.querySelector('input[name="rating"]:checked');
    if (!rating) { err.textContent = LP.t("reviewPickStars"); form.querySelector("input").focus(); return; }
    const btn = form.querySelector("[type=submit]");
    btn.disabled = true;
    btn.textContent = LP.t("reviewSending");
    try {
      await LP.api.addReview({ token, productId: form.dataset.review, rating: rating.value, text: form.elements.text.value });
      reviewed.push(form.dataset.review);
      thanked.add(form.dataset.review);
      render();
    } catch (e) {
      if (e.code === "duplicate") { reviewed.push(form.dataset.review); render(); return; }
      err.textContent = LP.t("reviewFailed");
      btn.disabled = false;
      btn.textContent = LP.t("reviewSend");
    }
  }

  function bind() {
    if (bound) return;
    bound = true;
    document.addEventListener("submit", e => {
      const addon = e.target.closest("[data-addon]");
      if (addon) { e.preventDefault(); addToOrder(addon); return; }
      const form = e.target.closest("[data-review]");
      if (!form) return;
      e.preventDefault();
      sendReview(form);
    });
    // Light up the chosen star and the ones before it
    document.addEventListener("change", e => {
      const picker = e.target.closest("[data-stars]");
      if (!picker) return;
      const n = Number(e.target.value);
      picker.querySelectorAll("label").forEach((l, i) => l.classList.toggle("is-on", i < n));
      picker.closest("form").querySelector(".field__error").textContent = "";
    });
    document.addEventListener("click", async e => {
      if (e.target.closest("[data-print]")) { window.print(); return; }
      if (e.target.closest("[data-copy-link]")) {
        // Share the plain link, without the "just placed" flag
        const url = location.origin + location.pathname + "?t=" + encodeURIComponent(token);
        if (await LP.copyText(url)) LP.toast("<span>" + LP.t("linkCopied") + "</span>");
      }
    });
  }

  LP.page = { id: "order", render };

  Promise.all([LP.api.getOrder(token), LP.api.orderReviews(token)]).then(([o, done]) => {
    order = o;
    reviewed = done;
    loaded = true;
    if (document.readyState !== "loading") render();
  });
})();
