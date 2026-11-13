/* =========================================================
   Bag drawer: slides in after "Add to bag" and from the bag
   icon in the header.
   • Progress towards free delivery
   • The pieces, with quantity and remove
   • "Pairs with": pieces from the same collections (or the
     ones she viewed recently)
   • A solid checkout button with the total in it
   The full bag page (bag.html) is still the checkout.
   ========================================================= */
(function () {
  let dialog = null;
  let removed = null;   // the piece just removed, kept in its place with an Undo button

  /* ---------- Pieces ---------- */
  // "Linen set removed from your bag · Undo", in the spot the piece was
  LP.removedRow = function (r, className, undoAttr) {
    const p = LP.getProduct(r.item.id);
    return '<li class="' + className + ' is-removed"><p>' + LP.t("removedItem", { name: p ? LP.esc(p.name[LP.lang]) : LP.t("itemUnavailable") }) + "</p>" +
      '<button class="link" type="button" ' + undoAttr + ">" + LP.t("undo") + "</button></li>";
  };
  const withRemoved = (rows, className, undoAttr) => {
    if (removed) rows.splice(Math.min(removed.index, rows.length), 0, LP.removedRow(removed, className, undoAttr));
    return rows.join("");
  };
  // Free-delivery progress: how much is left, and how full the bar is
  LP.freeDeliveryProgress = function (subtotal) {
    const over = LP.freeDeliveryOver;
    if (!(over > 0)) return "";
    const done = subtotal >= over;
    const pct = Math.min(100, Math.round(subtotal / over * 100));
    return '<div class="cart-progress' + (done ? " is-done" : "") + '">' +
      "<p>" + (done ? LP.icons.check + "<span>" + LP.t("freeDeliveryUnlocked") + "</span>"
        : LP.icons.truck + "<span>" + LP.t("freeDeliveryHint", { amount: LP.formatPrice(over - subtotal) }) + "</span>") + "</p>" +
      '<span class="cart-progress__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" aria-label="' + LP.freeDeliveryText() + '"><i style="--p: ' + pct + '%"></i></span>' +
    "</div>";
  };

  function itemsHtml(items) {
    const t = LP.t;
    return items.map((item, i) => {
      const p = LP.getProduct(item.id);
      if (!p) {
        return '<li class="cart-item"><span class="cart-item__ph"></span><div class="cart-item__body"><p class="cart-item__issue">' + t("itemUnavailable") + "</p>" +
          '<button class="link" type="button" data-cart-remove="' + i + '">' + t("remove") + "</button></div></li>";
      }
      const href = "product.html?id=" + p.id + "&color=" + item.color;
      return '<li class="cart-item">' +
        '<a href="' + href + '"><img src="' + LP.thumb(LP.imagesFor(p, item.color)[0]) + '" alt="" width="600" height="800" loading="lazy"></a>' +
        '<div class="cart-item__body">' +
          '<div class="cart-item__top"><a class="cart-item__name" href="' + href + '">' + LP.esc(p.name[LP.lang]) + "</a>" +
            "<strong>" + LP.formatPrice(p.price * item.qty) + "</strong></div>" +
          '<p class="cart-item__meta">' + LP.label("colors", item.color) + " · " + t("sizeLabel") + " " + LP.label("sizes", item.size) + "</p>" +
          (p.soldOut ? '<p class="cart-item__issue">' + t("soldOut") + "</p>" : "") +
          '<div class="cart-item__bottom">' +
            '<div class="qty qty--small" aria-label="' + t("qtyLabel") + '">' +
              '<button type="button" data-cart-step="' + i + '" data-delta="-1" aria-label="' + t("decrease") + '">−</button>' +
              "<output>" + item.qty + "</output>" +
              '<button type="button" data-cart-step="' + i + '" data-delta="1" aria-label="' + t("increase") + '">+</button>' +
            "</div>" +
            '<button class="link cart-item__remove" type="button" data-cart-remove="' + i + '">' + t("remove") + "</button>" +
          "</div>" +
        "</div></li>";
    });
  }

  // Pieces from the same collections as the bag; when there are none, the ones she viewed recently
  function suggestions(items) {
    const inBag = new Set(items.map(i => i.id));
    const collections = new Set(items.map(i => (LP.getProduct(i.id) || {}).collection).filter(Boolean));
    const ok = p => p && !inBag.has(p.id) && !p.soldOut;
    const pairs = LP.products.filter(p => ok(p) && collections.has(p.collection)).slice(0, 6);
    if (pairs.length) return { key: "cartPairs", list: pairs };
    return { key: "cartRecent", list: LP.recent.list().map(LP.getProduct).filter(ok).slice(0, 6) };
  }

  function suggestionsHtml(items) {
    const s = suggestions(items);
    if (!s.list.length) return "";
    return '<section class="cart-pairs" aria-labelledby="cart-pairs-title">' +
      '<h3 class="eyebrow" id="cart-pairs-title">' + LP.t(s.key) + "</h3>" +
      '<div class="cart-pairs__rail">' + s.list.map(p => {
        const color = LP.firstImageColor(p);
        return '<a class="cart-pair" href="product.html?id=' + p.id + "&color=" + color + '">' +
          '<img src="' + LP.thumb(LP.imagesFor(p, color)[0]) + '" alt="" width="600" height="800" loading="lazy">' +
          '<span class="cart-pair__name">' + LP.esc(p.name[LP.lang]) + "</span>" +
          '<span class="cart-pair__price">' + LP.formatPrice(p.price) + "</span></a>";
      }).join("") + "</div></section>";
  }

  /* ---------- Render ---------- */
  function render() {
    if (!dialog) return;
    const t = LP.t;
    const items = LP.bag.items();
    const count = LP.bag.count();
    const subtotal = LP.bag.subtotal();
    const head = '<header class="cart__head">' +
        '<h2 class="h3" id="cart-title">' + t("cartTitle") + (count ? ' <span class="cart__count">(' + count + ")</span>" : "") + "</h2>" +
        '<button class="icon-btn" type="button" data-cart-close aria-label="' + t("close") + '">' + LP.icons.close + "</button>" +
      "</header>";
    if (!items.length) {
      dialog.innerHTML = '<div class="cart__panel">' + head +
        '<div class="cart__body cart__body--empty">' +
          (removed ? '<ul class="cart-items">' + withRemoved([], "cart-item", "data-cart-undo") + "</ul>" : "") +
          '<div class="empty">' + LP.icons.bag +
          '<p class="h3">' + t("bagEmpty") + '</p><p class="text-secondary">' + t("bagEmptyText") + "</p>" +
          '<a class="btn btn--primary" href="shop.html">' + t("heroCta") + "</a></div>" +
          suggestionsHtml(items) +
        "</div></div>";
      return;
    }
    dialog.innerHTML = '<div class="cart__panel">' + head +
      '<div class="cart__body">' +
        LP.freeDeliveryProgress(subtotal) +
        '<ul class="cart-items">' + withRemoved(itemsHtml(items), "cart-item", "data-cart-undo") + "</ul>" +
        suggestionsHtml(items) +
      "</div>" +
      '<footer class="cart__foot">' +
        '<a class="btn btn--primary btn--block" href="bag.html#checkout">' + t("cartCheckout", { total: LP.formatPrice(subtotal) }) + "</a>" +
        '<p class="cart__note">' + t(LP.freeDeliveryOver > 0 && subtotal >= LP.freeDeliveryOver ? "paymentCod" : "cartNote") + "</p>" +
        '<button class="link" type="button" data-cart-close>' + t("continueShopping") + "</button>" +
      "</footer></div>";
  }

  function build() {
    dialog = document.createElement("dialog");
    dialog.className = "cart";
    dialog.id = "cart-drawer";
    dialog.setAttribute("aria-labelledby", "cart-title");
    document.body.appendChild(dialog);
    dialog.addEventListener("click", e => {
      if (e.target === dialog || e.target.closest("[data-cart-close]")) { LP.closeDialog(dialog); return; }
      // Removing a piece (or stepping down from 1) can be undone right there, instead of asking first.
      // A new change ends the last undo offer.
      const step = e.target.closest("[data-cart-step]");
      if (step) {
        const i = Number(step.dataset.cartStep);
        const item = LP.bag.items()[i];
        if (!item) return;
        removed = null;
        removed = LP.bag.setQty(i, item.qty + Number(step.dataset.delta));
        if (removed) render();
        return;
      }
      const remove = e.target.closest("[data-cart-remove]");
      if (remove) {
        removed = null;
        removed = LP.bag.remove(Number(remove.dataset.cartRemove));
        render();
        const undo = dialog.querySelector("[data-cart-undo]");
        if (undo) undo.focus();
        return;
      }
      if (e.target.closest("[data-cart-undo]")) {
        const r = removed;
        removed = null;
        LP.bag.restore(r);
        const back = dialog.querySelectorAll("[data-cart-remove]")[r.index];
        if (back) back.focus();
      }
    });
    // The undo offer ends when the drawer closes
    dialog.addEventListener("close", () => { removed = null; });
    // Quantity or bag changed anywhere: refresh while open
    document.addEventListener("lp:bag", () => { if (dialog.open) render(); });
    document.addEventListener("lp:lang", render);
    document.addEventListener("lp:fees", render);
  }

  LP.cart = {
    open() {
      if (!dialog) build();
      render();
      if (!dialog.open) LP.openDialog(dialog);
    }
  };

  // The bag icon in the header opens the drawer (the bag page itself keeps the link)
  document.addEventListener("click", e => {
    const link = e.target.closest("[data-open-bag]");
    if (!link || LP.page && LP.page.id === "bag" || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    LP.cart.open();
  });
})();
