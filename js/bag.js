/* =========================================================
   Bag page: items, quantities, summary with delivery fee,
   delivery details, cash on delivery, and placing the order.
   The order is saved through LP.api and the customer lands on
   their order page, where they can track it.
   ========================================================= */
(function () {
  const form = { name: "", phone: "", city: "", address: "", notes: "" };
  let fees = Object.assign({}, LP.config.deliveryFees);
  let problems = {};      // product id → "soldOut" | "unavailable", from the last attempt
  let removed = null;     // the piece just removed (undo)
  let placing = false;
  let orderKey = "";      // same key for every try of this checkout, so a retry can't place it twice
  let bound = false;

  function itemIssue(item) {
    const p = LP.getProduct(item.id);
    if (!p) return "unavailable";
    if (p.soldOut) return "soldOut";
    return problems[item.id] || "";
  }

  function itemsHtml(items) {
    const rows = items.map((item, i) => {
      const p = LP.getProduct(item.id);
      const issue = itemIssue(item);
      const remove = '<button class="bag-item__remove" type="button" data-remove="' + i + '">' + LP.t("remove") + "</button>";
      if (!p) {
        return '<li class="bag-item bag-item--issue"><div class="bag-item__ph"></div><div class="bag-item__body">' +
          '<p class="bag-item__issue">' + LP.t("itemUnavailable") + "</p>" + remove + "</div></li>";
      }
      const img = LP.imagesFor(p, item.color)[0];
      const href = "product.html?id=" + p.id + "&color=" + item.color;
      return '<li class="bag-item' + (issue ? " bag-item--issue" : "") + '">' +
        '<a href="' + href + '"><img src="' + LP.thumb(img) + '" alt="" width="900" height="1200" loading="lazy"></a>' +
        '<div class="bag-item__body">' +
          '<div class="bag-item__top"><a class="h3" href="' + href + '">' + LP.esc(p.name[LP.lang]) + "</a>" +
          "<strong>" + LP.formatPrice(p.price * item.qty) + "</strong></div>" +
          '<p class="bag-item__meta">' + LP.label("colors", item.color) + " · " + LP.t("sizeLabel") + " " + LP.label("sizes", item.size) + "</p>" +
          (issue ? '<p class="bag-item__issue">' + LP.t(issue === "soldOut" ? "soldOut" : "itemUnavailable") + "</p>" : "") +
          '<div class="bag-item__bottom">' +
            '<div class="qty" aria-label="' + LP.t("qtyLabel") + '">' +
              '<button type="button" data-step="' + i + '" data-delta="-1" aria-label="' + LP.t("decrease") + '">−</button>' +
              "<output>" + item.qty + "</output>" +
              '<button type="button" data-step="' + i + '" data-delta="1" aria-label="' + LP.t("increase") + '">+</button>' +
            "</div>" + remove +
          "</div>" +
        "</div>" +
      "</li>";
    });
    // The piece just removed stays in its spot with an Undo button
    if (removed) rows.splice(Math.min(removed.index, rows.length), 0, LP.removedRow(removed, "bag-item", "data-undo"));
    return rows.join("");
  }

  function field(id, labelKey, input, hintKey) {
    return '<div class="field"><label class="field__label" for="' + id + '">' + LP.t(labelKey) + "</label>" + input +
      (hintKey ? '<p class="field__hint">' + LP.t(hintKey) + "</p>" : "") +
      '<p class="field__error" id="' + id + '-error"></p></div>';
  }

  function formHtml() {
    const cities = LP.config.cities.map(c => '<option value="' + c + '"' + (form.city === c ? " selected" : "") + ">" + LP.label("cities", c) + "</option>").join("");
    return '<form class="order-form" id="order-form" novalidate>' +
      '<h2 class="h3">' + LP.t("yourDetails") + "</h2>" +
      field("f-name", "name", '<input class="input" id="f-name" name="name" autocomplete="name" required maxlength="80" value="' + LP.esc(form.name) + '">') +
      field("f-phone", "phone", '<input class="input" id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required dir="ltr" value="' + LP.esc(form.phone) + '">', "phoneHint") +
      field("f-city", "city", '<select class="select" id="f-city" name="city" autocomplete="address-level1" required><option value="">' + LP.t("chooseCity") + "</option>" + cities + "</select>") +
      field("f-address", "address", '<input class="input" id="f-address" name="address" autocomplete="street-address" required maxlength="200" placeholder="' + LP.t("addressPlaceholder") + '" value="' + LP.esc(form.address) + '">') +
      field("f-notes", "notes", '<textarea class="textarea" id="f-notes" name="notes" maxlength="500">' + LP.esc(form.notes) + "</textarea>") +
      '<fieldset class="pay"><legend class="field__label">' + LP.t("paymentTitle") + "</legend>" +
        '<label class="pay__option"><input type="radio" name="payment" value="cod" checked><span><strong>' + LP.t("paymentCod") + "</strong>" + LP.t("paymentCodText") + "</span></label>" +
      "</fieldset>" +
      '<p class="field__error" id="order-error" role="alert"></p>' +
      '<button class="btn btn--primary btn--block" type="submit" id="place-order"' + (placing ? " disabled" : "") + ">" + placeLabel() + "</button>" +
    "</form>";
  }

  function totals() {
    const subtotal = LP.bag.subtotal();
    const freeOver = LP.freeDeliveryOver;
    const free = freeOver > 0 && subtotal >= freeOver;
    const fee = free ? 0 : form.city ? LP.deliveryFeeFor(subtotal, Number(fees[form.city]) || 0, freeOver) : null;
    return { subtotal, fee, free, total: subtotal + (fee || 0) };
  }

  // "Place order · 87.00 JD" once the total is known
  function placeLabel() {
    if (placing) return LP.t("placingOrder");
    const s = totals();
    return LP.t("placeOrder") + (s.fee === null ? "" : " · " + LP.formatPrice(s.total));
  }

  function summaryRowsHtml() {
    const s = totals();
    const feeCell = s.free ? '<span class="summary__free">' + LP.t("freeDelivery") + "</span>"
      : s.fee === null ? '<span class="text-secondary">' + LP.t("chooseCity") + "</span>"
      : "<span>" + LP.formatPrice(s.fee) + "</span>";
    return LP.freeDeliveryProgress(s.subtotal) +
      '<div class="summary__row"><span>' + LP.t("subtotal") + "</span><span>" + LP.formatPrice(s.subtotal) + "</span></div>" +
      '<div class="summary__row"><span>' + LP.t("delivery") + "</span>" + feeCell + "</div>" +
      '<div class="summary__row summary__row--total"><span>' + LP.t("total") + "</span><span>" + LP.formatPrice(s.total) + "</span></div>";
  }

  function updateSummary() {
    const rows = document.getElementById("summary-rows");
    if (rows) rows.innerHTML = summaryRowsHtml();
    const btn = document.getElementById("place-order");
    if (btn) btn.textContent = placeLabel();
  }

  function render() {
    LP.applyStaticText();
    const items = LP.bag.items();
    const root = document.getElementById("bag-root");

    if (!items.length) {
      root.innerHTML = (removed ? '<ul class="bag-items">' + itemsHtml(items) + "</ul>" : "") +
        '<div class="empty">' + LP.icons.bag +
        '<p class="h3">' + LP.t("bagEmpty") + '</p><p class="text-secondary">' + LP.t("bagEmptyText") + "</p>" +
        '<a class="btn btn--primary" href="shop.html">' + LP.t("heroCta") + "</a></div>";
      bind();
      return;
    }

    root.innerHTML = '<div class="bag">' +
      '<ul class="bag-items">' + itemsHtml(items) + "</ul>" +
      '<aside class="summary">' +
        '<div class="summary__rows" id="summary-rows">' + summaryRowsHtml() + "</div>" +
        formHtml() +
      "</aside>" +
    "</div>";
    bind();
  }

  function validate() {
    let ok = true;
    const set = (id, msg) => {
      const input = document.getElementById(id);
      document.getElementById(id + "-error").textContent = msg || "";
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      if (msg && ok) { input.focus(); ok = false; }
    };
    set("f-name", form.name.trim() ? "" : LP.t("required"));
    set("f-phone", !form.phone.trim() ? LP.t("required") : (LP.validPhone(form.phone) ? "" : LP.t("invalidPhone")));
    set("f-city", form.city ? "" : LP.t("required"));
    set("f-address", form.address.trim() ? "" : LP.t("required"));
    return ok;
  }

  function showOrderError(msg) {
    const el = document.getElementById("order-error");
    if (el) el.textContent = msg;
  }

  async function placeOrder() {
    if (placing) return;
    const items = LP.bag.items();
    if (items.some(itemIssue)) { showOrderError(LP.t("removeUnavailable")); return; }
    if (!validate()) return;
    placing = true;
    const btn = document.getElementById("place-order");
    btn.disabled = true;
    btn.textContent = LP.t("placingOrder");
    orderKey = orderKey || LP.uid();
    try {
      const order = await LP.api.createOrder({
        items,
        customer: { name: form.name, phone: form.phone, city: form.city, address: form.address, notes: form.notes },
        lang: LP.lang,
        key: orderKey
      });
      LP.bag.clear();
      location.href = "order.html?t=" + encodeURIComponent(order.token) + "&placed=1";
    } catch (err) {
      placing = false;
      if (err.code === "items") {
        problems = {};
        err.problems.forEach(p => { problems[p.id] = p.reason; });
        render();
        showOrderError(LP.t("removeUnavailable"));
      } else {
        btn.disabled = false;
        btn.textContent = LP.t("placeOrder");
        showOrderError(LP.t("orderFailed"));
      }
    }
  }

  function bind() {
    if (bound) return;
    bound = true;

    document.addEventListener("click", e => {
      // Removing a piece (or stepping down from 1) can be undone right there, instead of asking first
      const step = e.target.closest("[data-step]");
      if (step) {
        const i = Number(step.dataset.step);
        const item = LP.bag.items()[i];
        if (item) removed = LP.bag.setQty(i, item.qty + Number(step.dataset.delta));
        render();
        return;
      }
      const rm = e.target.closest("[data-remove]");
      if (rm) {
        const item = LP.bag.items()[Number(rm.dataset.remove)];
        if (item) delete problems[item.id];
        removed = LP.bag.remove(Number(rm.dataset.remove));
        render();
        const undo = document.querySelector("[data-undo]");
        if (undo) undo.focus();
        return;
      }
      if (e.target.closest("[data-undo]")) {
        const r = removed;
        removed = null;
        LP.bag.restore(r);
        render();
        const back = document.querySelectorAll("[data-remove]")[r.index];
        if (back) back.focus();
        return;
      }
    });

    document.addEventListener("input", e => {
      if (!e.target.closest("#order-form")) return;
      if (e.target.name in form) form[e.target.name] = e.target.value;
    });
    document.addEventListener("change", e => {
      if (!e.target.closest("#order-form")) return;
      if (e.target.name in form) form[e.target.name] = e.target.value;
      if (e.target.name === "city") updateSummary();
    });
    document.addEventListener("submit", e => {
      if (!e.target.matches("#order-form")) return;
      e.preventDefault();
      placeOrder();
    });
  }

  LP.page = { id: "bag", render };

  // Delivery fees can be changed by Heba in the admin panel
  LP.api.getSettings().then(s => { fees = s.deliveryFees; updateSummary(); });
  document.addEventListener("lp:fees", updateSummary);

  // From the bag drawer's checkout button: go straight to the delivery details
  if (location.hash === "#checkout") {
    window.addEventListener("load", () => {
      const f = document.getElementById("order-form");
      if (f) f.scrollIntoView({ behavior: "smooth", block: "start" });
    }, { once: true });
  }
})();
