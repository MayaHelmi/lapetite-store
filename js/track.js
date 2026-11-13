/* =========================================================
   Track your order: look up an order by its number + the
   phone used at checkout, and list orders placed on this device.
   ========================================================= */
(function () {
  let mine = [];
  let bound = false;

  function render() {
    LP.applyStaticText();
    const t = LP.t;
    const box = document.getElementById("my-orders");
    box.hidden = !mine.length;
    document.getElementById("my-orders-list").innerHTML = mine.map(o => {
      const count = o.items.reduce((n, i) => n + i.qty, 0);
      return '<li><a class="my-order" href="order.html?t=' + encodeURIComponent(o.token) + '">' +
        '<span class="my-order__main"><strong>' + t("orderTitle", { n: o.number }) + "</strong>" +
          '<span class="text-secondary">' + LP.formatDate(o.createdAt, false) + " · " + LP.piecesLabel(count) + " · " + LP.formatPrice(o.total) + "</span></span>" +
        '<span class="status status--' + o.status + '">' + LP.statusLabel(o.status) + "</span>" +
      "</a></li>";
    }).join("");
    bind();
  }

  function bind() {
    if (bound) return;
    bound = true;
    document.getElementById("track-form").addEventListener("submit", async e => {
      e.preventDefault();
      const number = document.getElementById("t-number");
      const phone = document.getElementById("t-phone");
      const error = document.getElementById("track-error");
      error.textContent = "";
      [number, phone].forEach(i => i.setAttribute("aria-invalid", "false"));
      if (!number.value.trim()) { number.setAttribute("aria-invalid", "true"); number.focus(); error.textContent = LP.t("required"); return; }
      if (!phone.value.trim()) { phone.setAttribute("aria-invalid", "true"); phone.focus(); error.textContent = LP.t("required"); return; }
      const token = await LP.api.findOrder(number.value, phone.value);
      if (token) location.href = "order.html?t=" + encodeURIComponent(token);
      else error.textContent = LP.t("trackNotFound");
    });
  }

  LP.page = { id: "track", render };

  LP.api.myOrders().then(list => {
    mine = list;
    if (document.readyState !== "loading") render();
  });
})();
