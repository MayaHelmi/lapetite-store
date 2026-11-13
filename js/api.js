/* =========================================================
   Data layer — DEMO BACKEND
   Orders, product edits and settings are saved in this browser
   (localStorage), so checkout, order tracking and the admin panel
   all work without a server.

   Every function is async on purpose: for launch, replace the
   bodies with fetch() calls to the real API (e.g. Cloudflare
   Functions + D1) and the pages keep working unchanged.

   Demo limits: orders only exist in the browser they were placed
   in (open admin.html in the same browser to see them), and the
   admin passcode lives in config.js. A few sample orders are
   added on the first visit so the admin panel isn't empty.
   ========================================================= */
window.LP = window.LP || {};

(function () {
  const S = LP.config.storage;
  const read = (key, fallback) => LP.storage.get(key, fallback);
  const write = (key, value) => LP.storage.set(key, value);
  const clone = obj => JSON.parse(JSON.stringify(obj));
  const now = () => new Date().toISOString();
  const statuses = LP.config.orderSteps.concat("cancelled");

  // Saving can fail when the browser's storage is full (large photos) — report it instead of failing silently
  function writeStrict(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { throw Object.assign(new Error("storage-full"), { code: "storage-full" }); }
  }

  function fail(code, extra) { throw Object.assign(new Error(code), { code }, extra || {}); }

  /* ---------- Catalog: products.js + Heba's edits ---------- */
  const base = clone(LP.products);   // the catalog as shipped, so edits can be reset
  const editable = ["name", "desc", "price", "category", "collection", "colors", "sizes", "badges", "soldOut", "hidden"];

  function catalogState() { return read(S.catalog, { patches: {}, added: [] }); }

  // Products Heba added come first (newest), then the shipped catalog with her edits applied
  function fullCatalog() {
    const st = catalogState();
    return st.added.map(p => Object.assign(clone(p), { origin: "added" }))
      .concat(base.map(p => Object.assign(clone(p), st.patches[p.id] || {}, { origin: "base", edited: !!st.patches[p.id] })));
  }

  // The shop only sees visible products
  LP.applyCatalog = function () { LP.products = fullCatalog().filter(p => !p.hidden); };
  LP.applyCatalog();

  /* ---------- Helpers ---------- */
  LP.normPhone = phone => {
    let d = LP.latinDigits(phone).replace(/[^\d]/g, "");
    if (d.startsWith("00962")) d = d.slice(5);
    else if (d.startsWith("962")) d = d.slice(3);
    if (d.startsWith("7")) d = "0" + d;
    return d;
  };
  LP.validPhone = phone => /^07[789]\d{7}$/.test(LP.normPhone(phone));

  const newToken = LP.uid;

  const orders = () => read(S.orders, []);
  function publicView(order) {
    const o = clone(order);
    delete o.adminNote;
    return o;
  }

  function settings() {
    const saved = read(S.settings, {});
    return {
      deliveryFees: Object.assign({}, LP.config.deliveryFees, saved.deliveryFees || {}),
      freeDeliveryOver: saved.freeDeliveryOver !== undefined ? Number(saved.freeDeliveryOver) || 0 : LP.config.freeDeliveryOver
    };
  }

  // The fee an order pays in a governorate (free at or above the threshold)
  function feeFor(subtotal, city, s) {
    return LP.deliveryFeeFor(subtotal, Number(s.deliveryFees[city]) || 0, s.freeDeliveryOver);
  }

  function slug(text) {
    return String(text || "").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 40) || "product";
  }

  /* ---------- Sample orders (demo only, added once per browser) ---------- */
  const sampleOrders = [
    { status: "review", hoursAgo: 0.7, name: "سارة الخطيب", phone: "0790000101", city: "amman", address: "عبدون، شارع القاهرة، عمارة ١٢، الطابق الثاني", notes: "الرجاء الاتصال قبل التوصيل",
      items: [["autumn-tracksuit", "black", "1", 1], ["autumn-blouse", "cream", "1", 1]] },
    { status: "confirmed", hoursAgo: 26, name: "لين حداد", phone: "0780000102", city: "irbid", address: "شارع الجامعة، قرب دوار القبة",
      items: [["black-embroidered-abaya", "black", "free", 1]] },
    { status: "preparing", hoursAgo: 50, name: "رهف العلي", phone: "0770000103", city: "zarqa", address: "الزرقاء الجديدة، شارع ٣٦، بناية ٤", note: "طلبت تغليف هدية",
      items: [["trench-coat", "beige", "2", 1], ["wool-collar-blouse", "beige", "2", 1]] },
    { status: "shipping", hoursAgo: 75, name: "دانة منصور", phone: "0790000104", city: "aqaba", address: "المنطقة العاشرة، قرب مسجد الشريف حسين",
      items: [["belted-jacket", "burgundy", "1", 1]] },
    { status: "delivered", hoursAgo: 146, name: "نور قاسم", phone: "0790000105", city: "amman", address: "خلدا، شارع عامر بن مالك، فيلا ٧",
      items: [["eid-belted-suit", "cream", "1", 1], ["linen-set", "cream", "1", 2]] }
  ];

  function seedSampleOrders() {
    if (read(S.demoSeeded, false)) return;
    const catalog = fullCatalog();
    const set = settings();
    const start = LP.config.orderNumberStart;
    const seeds = sampleOrders.slice().reverse().map((s, i) => {
      const lines = s.items.map(([id, color, size, qty]) => {
        const p = catalog.find(x => x.id === id);
        return p && { id, name: clone(p.name), color, size, qty, price: Number(p.price), image: LP.imagesFor(p, color)[0] };
      }).filter(Boolean);
      const created = Date.now() - s.hoursAgo * 3600000;
      const reached = LP.config.orderSteps.slice(0, LP.config.orderSteps.indexOf(s.status) + 1);
      const gap = (s.hoursAgo * 3600000) / (reached.length + 1);
      const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
      const fee = feeFor(subtotal, s.city, set);
      return {
        number: start + i,
        token: newToken(),
        createdAt: new Date(created).toISOString(),
        status: s.status,
        history: reached.map((st, k) => ({ status: st, at: new Date(created + k * gap).toISOString() })),
        items: lines,
        subtotal,
        deliveryFee: fee,
        total: subtotal + fee,
        payment: LP.config.payment,
        customer: { name: s.name, phone: s.phone, city: s.city, address: s.address, notes: s.notes || "", location: null },
        lang: "ar",
        adminNote: s.note || ""
      };
    });
    // Orders already placed in this browser keep their order, numbered after the samples
    const existing = orders().sort((a, b) => a.number - b.number);
    existing.forEach((o, i) => { o.number = start + seeds.length + i; });
    try {
      writeStrict(S.orders, existing.reverse().concat(seeds.reverse()));
      write(S.demoSeeded, true);
    } catch (e) { /* storage full: skip the samples */ }
  }
  seedSampleOrders();

  /* ---------- Public API (shop + customers) ---------- */
  LP.api = {
    async getSettings() { return settings(); },

    /* items: [{ id, color, size, qty }], customer: { name, phone, city, address, notes, location }
       key: one id per checkout attempt. Sending the same key again (a double tap, or a retry after
       the connection dropped) returns the order already placed instead of placing a second one. */
    async createOrder({ items, customer, lang, key }) {
      const placed = key && orders().find(o => o.key === key);
      if (placed) return publicView(placed);
      const catalog = fullCatalog();
      const problems = [];
      const lines = [];
      (items || []).forEach(item => {
        const p = catalog.find(x => x.id === item.id);
        if (!p || p.hidden) { problems.push({ id: item.id, reason: "unavailable" }); return; }
        if (p.soldOut) { problems.push({ id: item.id, reason: "soldOut" }); return; }
        if (!p.colors.includes(item.color) || !p.sizes.includes(item.size)) { problems.push({ id: item.id, reason: "unavailable" }); return; }
        const qty = Math.max(1, Math.min(LP.config.maxQty, Math.floor(Number(item.qty) || 1)));
        const image = LP.imagesFor(p, item.color)[0];
        // Prices always come from the catalog, never from the bag
        lines.push({ id: p.id, name: clone(p.name), color: item.color, size: item.size, qty, price: Number(p.price), image: image.startsWith("data:") ? "" : image });
      });
      if (problems.length) fail("items", { problems });
      if (!lines.length) fail("empty");

      const c = customer || {};
      if (!String(c.name || "").trim() || !LP.validPhone(c.phone) || !LP.config.cities.includes(c.city) || !String(c.address || "").trim()) fail("customer");

      const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
      const fee = feeFor(subtotal, c.city, settings());
      const list = orders();
      const number = list.reduce((max, o) => Math.max(max, o.number), LP.config.orderNumberStart - 1) + 1;
      const order = {
        number,
        token: newToken(),
        key: key ? String(key).slice(0, 64) : "",
        createdAt: now(),
        status: "review",
        history: [{ status: "review", at: now() }],
        items: lines,
        subtotal,
        deliveryFee: fee,
        total: subtotal + fee,
        payment: LP.config.payment,
        customer: {
          name: String(c.name).trim().slice(0, 80),
          phone: LP.normPhone(c.phone),
          city: c.city,
          address: String(c.address).trim().slice(0, 200),
          notes: String(c.notes || "").trim().slice(0, 500),
          location: c.location && isFinite(c.location.lat) && isFinite(c.location.lng) ? { lat: Number(c.location.lat), lng: Number(c.location.lng) } : null
        },
        lang: lang === "en" ? "en" : "ar",
        adminNote: ""
      };
      list.unshift(order);
      writeStrict(S.orders, list);
      const mine = read(S.myOrders, []).filter(t => t !== order.token);
      mine.unshift(order.token);
      write(S.myOrders, mine.slice(0, 20));
      return publicView(order);
    },

    // The order page: the secret token in the link is the only key
    async getOrder(token) {
      const o = orders().find(x => x.token === token);
      return o ? publicView(o) : null;
    },

    // "Track your order": order number + the phone used at checkout
    async findOrder(number, phone) {
      const n = Number(LP.latinDigits(number).replace(/[^\d]/g, ""));
      const ph = LP.normPhone(phone);
      const o = orders().find(x => x.number === n && x.customer.phone === ph);
      return o ? o.token : null;
    },

    // Orders placed from this device
    async myOrders() {
      const all = orders();
      return read(S.myOrders, []).map(t => all.find(o => o.token === t)).filter(Boolean).map(publicView);
    }
  };

  /* ---------- Admin API ---------- */
  LP.api.admin = {
    async login(passcode) {
      if (String(passcode || "").trim() !== LP.config.adminDemoPasscode) return false;
      write(S.adminSession, { until: Date.now() + 12 * 60 * 60 * 1000 });
      return true;
    },
    isLoggedIn() {
      const s = read(S.adminSession, null);
      return !!(s && s.until > Date.now());
    },
    async logout() { write(S.adminSession, null); },

    async listOrders() { return orders(); },

    async setStatus(number, status) {
      if (!statuses.includes(status)) fail("status");
      const list = orders();
      const o = list.find(x => x.number === number);
      if (!o) fail("not-found");
      if (o.status === status) return o;
      o.status = status;
      o.history.push({ status, at: now() });
      writeStrict(S.orders, list);
      return o;
    },

    async setNote(number, note) {
      const list = orders();
      const o = list.find(x => x.number === number);
      if (!o) fail("not-found");
      o.adminNote = String(note || "").slice(0, 1000);
      writeStrict(S.orders, list);
      return o;
    },

    async listProducts() { return fullCatalog(); },

    async saveProduct(product) {
      const st = catalogState();
      if (product.origin === "added") {
        const i = st.added.findIndex(p => p.id === product.id);
        if (i < 0) fail("not-found");
        const p = clone(product);
        delete p.origin;
        delete p.edited;
        st.added[i] = p;
      } else {
        const orig = base.find(p => p.id === product.id);
        if (!orig) fail("not-found");
        const patch = {};
        editable.forEach(k => {
          if (product[k] !== undefined && JSON.stringify(product[k]) !== JSON.stringify(orig[k] === undefined ? (k === "soldOut" || k === "hidden" ? false : orig[k]) : orig[k])) patch[k] = clone(product[k]);
        });
        if (Object.keys(patch).length) st.patches[product.id] = patch;
        else delete st.patches[product.id];
      }
      writeStrict(S.catalog, st);
      LP.applyCatalog();
    },

    async createProduct(product) {
      const st = catalogState();
      const taken = new Set(fullCatalog().map(p => p.id));
      const baseId = slug(product.name && product.name.en);
      let id = baseId;
      for (let n = 2; taken.has(id); n++) id = baseId + "-" + n;
      const p = clone(product);
      delete p.origin;
      delete p.edited;
      p.id = id;
      st.added.unshift(p);
      writeStrict(S.catalog, st);
      LP.applyCatalog();
      return id;
    },

    async deleteProduct(id) {
      const st = catalogState();
      st.added = st.added.filter(p => p.id !== id);
      writeStrict(S.catalog, st);
      LP.applyCatalog();
    },

    async resetProduct(id) {
      const st = catalogState();
      delete st.patches[id];
      writeStrict(S.catalog, st);
      LP.applyCatalog();
    },

    async getSettings() { return settings(); },

    async saveSettings(next) {
      const current = settings();
      const money = (v, fallback) => (v !== "" && isFinite(Number(v)) && Number(v) >= 0 ? Math.round(Number(v) * 100) / 100 : fallback);
      const fees = {};
      LP.config.cities.forEach(c => { fees[c] = money(next.deliveryFees[c], current.deliveryFees[c]); });
      writeStrict(S.settings, { deliveryFees: fees, freeDeliveryOver: money(next.freeDeliveryOver, current.freeDeliveryOver) });
      return settings();
    }
  };

  /* ---------- Reviews: customers rate pieces from a delivered order; Heba approves them ---------- */
  const reviews = () => read(S.reviews, []);
  // "Sara Ahmad" → "Sara A."
  const shortName = full => {
    const parts = String(full || "").trim().split(/\s+/);
    return parts[0] + (parts[1] ? " " + parts[1].charAt(0) + "." : "");
  };
  const publicReview = r => ({ id: r.id, productId: r.productId, name: r.name, rating: r.rating, text: r.text, createdAt: r.createdAt, item: r.item });
  const newestFirst = (a, b) => b.createdAt.localeCompare(a.createdAt);

  Object.assign(LP.api, {
    // Approved reviews: one piece's, or the whole shop's when no id is given
    async getReviews(productId) {
      return reviews().filter(r => r.status === "approved" && (!productId || r.productId === productId)).sort(newestFirst).map(publicReview);
    },

    // The pieces of this order that were already reviewed
    async orderReviews(token) {
      const o = orders().find(x => x.token === token);
      return o ? reviews().filter(r => r.orderNumber === o.number).map(r => r.productId) : [];
    },

    // While the order is under review she can add pieces to it (same delivery; free once over the threshold)
    async addToOrder(token, item) {
      const list = orders();
      const o = list.find(x => x.token === token);
      if (!o || o.status !== "review") fail("not-allowed");
      const p = fullCatalog().find(x => x.id === item.id);
      if (!p || p.hidden || p.soldOut || !p.colors.includes(item.color) || !p.sizes.includes(item.size)) fail("unavailable");
      const same = o.items.find(l => l.id === p.id && l.color === item.color && l.size === item.size);
      if (same) same.qty = Math.min(LP.config.maxQty, same.qty + 1);
      else {
        const image = LP.imagesFor(p, item.color)[0];
        o.items.push({ id: p.id, name: clone(p.name), color: item.color, size: item.size, qty: 1, price: Number(p.price), image: image.startsWith("data:") ? "" : image, addedAt: now() });
      }
      o.subtotal = o.items.reduce((sum, l) => sum + l.price * l.qty, 0);
      o.deliveryFee = LP.deliveryFeeFor(o.subtotal, o.deliveryFee, settings().freeDeliveryOver);
      o.total = o.subtotal + o.deliveryFee;
      writeStrict(S.orders, list);
      return publicView(o);
    },

    async addReview({ token, productId, rating, text }) {
      const o = orders().find(x => x.token === token);
      if (!o || o.status !== "delivered") fail("not-allowed");
      const line = o.items.find(i => i.id === productId);
      if (!line) fail("not-allowed");
      const stars = Math.round(Number(rating));
      if (!(stars >= 1 && stars <= 5)) fail("rating");
      const list = reviews();
      if (list.some(r => r.orderNumber === o.number && r.productId === productId)) fail("duplicate");
      const review = {
        id: newToken().slice(0, 12),
        productId,
        orderNumber: o.number,
        name: shortName(o.customer.name),
        rating: stars,
        text: String(text || "").trim().slice(0, LP.config.reviews.maxText),
        createdAt: now(),
        status: "pending",
        item: { id: line.id, name: clone(line.name), color: line.color, image: line.image, price: line.price }
      };
      list.unshift(review);
      writeStrict(S.reviews, list);
      return publicReview(review);
    }
  });

  Object.assign(LP.api.admin, {
    async listReviews() { return reviews().sort(newestFirst); },
    async setReviewStatus(id, status) {
      if (!["pending", "approved", "hidden"].includes(status)) fail("status");
      const list = reviews();
      const r = list.find(x => x.id === id);
      if (!r) fail("not-found");
      r.status = status;
      writeStrict(S.reviews, list);
    },
    async deleteReview(id) { writeStrict(S.reviews, reviews().filter(r => r.id !== id)); }
  });

  // An order line's photo: saved path, or the product's current photo (for photos uploaded in the admin)
  LP.orderItemImage = function (item) {
    if (item.image) return item.image;
    const p = fullCatalog().find(x => x.id === item.id);
    return p ? LP.imagesFor(p, item.color)[0] : "";
  };
})();
