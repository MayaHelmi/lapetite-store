/* =========================================================
   State: language + shopping bag (saved in localStorage)
   ========================================================= */
window.LP = window.LP || {};

LP.storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }
};

/* ---------- Language ---------- */
LP.langChosen = LP.storage.get(LP.config.storage.lang, null) !== null;
LP.lang = LP.storage.get(LP.config.storage.lang, LP.config.defaultLang);

LP.t = function (key, vars) {
  const dict = LP.strings[LP.lang] || LP.strings.ar;
  let s = dict[key] !== undefined ? dict[key] : (LP.strings.en[key] || key);
  if (vars) Object.keys(vars).forEach(k => { s = s.replace("{" + k + "}", vars[k]); });
  return s;
};

LP.label = function (group, key) {
  const item = LP.labels[group] && LP.labels[group][key];
  return item ? item[LP.lang] : key;
};

/* ---------- Changes within a page ----------
   A change that would otherwise pop (another language, the photos of another colour, new shop results)
   cross-fades instead, where the browser can do it and the visitor hasn't asked for less motion. */
LP.swap = function (update) {
  if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { update(); return; }
  const root = document.documentElement;
  root.classList.add("is-swapping");
  document.startViewTransition(update).finished.finally(() => root.classList.remove("is-swapping"));
};

LP.setLang = function (lang) {
  LP.langChosen = true;
  LP.lang = lang;
  LP.storage.set(LP.config.storage.lang, lang);
  LP.swap(() => document.dispatchEvent(new CustomEvent("lp:lang")));
};

/* ---------- Products ---------- */
LP.getProduct = id => LP.products.find(p => p.id === id);

LP.imagesFor = function (product, color) {
  const c = product.images[color] ? color : Object.keys(product.images)[0];
  // Products added in the admin panel carry their uploaded photos
  if (product.imageUrls && product.imageUrls[c]) return product.imageUrls[c].slice();
  const n = product.images[c];
  return Array.from({ length: n }, (_, i) => LP.config.productImagePath + product.id + "-" + c + "-" + (i + 1) + ".webp");
};

/* ---------- Responsive photos ---------- */
// The 600px copy in sm/ (shipped photos only; photos uploaded in the admin have none)
LP.smallImage = function (src) {
  src = String(src || "");
  const dir = [LP.config.productImagePath, LP.config.brandImagePath]
    .find(d => src.startsWith(d) && src.indexOf("/", d.length) < 0);
  return dir ? dir + LP.config.images.smallDir + src.slice(dir.length) : "";
};
LP.srcsetFor = function (src) {
  const small = LP.smallImage(src);
  if (!small) return "";
  const w = LP.config.images;
  return small + " " + w.smallWidth + "w, " + src + " " + (src.startsWith(LP.config.brandImagePath) ? w.brandWidth : w.productWidth) + "w";
};
// The photo's own two tones (tones.js), shown behind it while it loads
LP.toneOf = function (src) {
  const m = /([^/]+)\.\w+$/.exec(String(src || ""));
  const tone = m && LP.tones && LP.tones[m[1]];
  return tone ? { a: "#" + tone.slice(0, 6), b: "#" + tone.slice(6, 12) } : null;
};
// extra: one more style to carry on the same attribute (the photo's focus point on the home page)
LP.toneAttr = function (src, extra) {
  const tone = LP.toneOf(src);
  const styles = (tone ? ["--tone-a: " + tone.a, "--tone-b: " + tone.b] : []).concat(extra || []);
  return styles.length ? ' style="' + styles.join("; ") + '"' : "";
};
// src + srcset + sizes for an <img>; kind is a key of LP.config.images.sizes
LP.imgAttrs = function (src, kind, extra) {
  const set = LP.srcsetFor(src);
  return 'src="' + src + '"' + (set ? ' srcset="' + set + '" sizes="' + LP.config.images.sizes[kind] + '"' : "") + LP.toneAttr(src, extra);
};
// Swap the photo of an <img> that's already on the page
LP.setImage = function (img, src, kind) {
  const set = LP.srcsetFor(src);
  const tone = LP.toneOf(src);
  if (kind) img.sizes = LP.config.images.sizes[kind];
  if (set) img.srcset = set; else img.removeAttribute("srcset");
  if (tone) { img.style.setProperty("--tone-a", tone.a); img.style.setProperty("--tone-b", tone.b); }
  img.src = src;
};
// Thumbnails always use the small copy
LP.thumb = src => LP.smallImage(src) || src;
// Touch screens never show the hover photo on cards, so they don't load it
LP.canHover = !!(window.matchMedia && window.matchMedia("(hover: hover)").matches);

LP.firstImageColor = product => (product.colors.find(c => product.images[c]) || Object.keys(product.images)[0]);

LP.formatPrice = function (value) {
  const n = Number(value).toFixed(LP.config.priceDecimals);
  return LP.lang === "ar" ? n + " " + LP.config.currency.ar : LP.config.currency.en + " " + n;
};

/* ---------- Orders: status names + dates ---------- */
LP.statusKey = status => status.charAt(0).toUpperCase() + status.slice(1);
LP.statusLabel = status => LP.t("status" + LP.statusKey(status));
LP.statusText = status => LP.t("statusText" + LP.statusKey(status));
LP.formatDate = function (iso, withTime) {
  const opts = withTime === false ? { dateStyle: "medium" } : { dateStyle: "medium", timeStyle: "short" };
  return new Intl.DateTimeFormat(LP.lang === "ar" ? "ar-JO-u-nu-latn" : "en-GB", opts).format(new Date(iso));
};
// Delivery fees + the free-delivery threshold (replaced by the admin settings once they load — see LP.renderAll)
LP.setDeliveryFees = function (fees, freeOver) {
  LP.deliveryFees = Object.assign({}, fees);
  LP.freeDeliveryOver = Number(freeOver === undefined ? LP.config.freeDeliveryOver : freeOver) || 0;
  const others = Object.keys(fees).filter(k => k !== "amman").map(k => fees[k]);
  LP.deliveryFrom = Math.min.apply(null, Object.values(fees));
  LP.deliveryOthers = others.length ? Math.min.apply(null, others) : LP.deliveryFrom;
};
LP.setDeliveryFees(LP.config.deliveryFees, LP.config.freeDeliveryOver);
// The fee an order pays: free at or above the threshold
LP.deliveryFeeFor = (subtotal, fee, freeOver) => (freeOver > 0 && subtotal >= freeOver ? 0 : fee);
LP.announceText = () => (LP.freeDeliveryOver > 0
  ? LP.t("announceFree", { free: LP.formatPrice(LP.freeDeliveryOver) })
  : LP.t("announce", { fee: LP.formatPrice(LP.deliveryFrom) }));
// "Free delivery on orders over 60.00 JD", or "" when the offer is off
LP.freeDeliveryText = () => (LP.freeDeliveryOver > 0 ? LP.t("offerFree", { amount: LP.formatPrice(LP.freeDeliveryOver) }) : "");
// Fills {amman} and {others} in content text with the current fees
LP.fillFees = text => text
  .replace("{amman}", LP.formatPrice(LP.deliveryFees.amman))
  .replace("{others}", LP.formatPrice(LP.deliveryOthers));
// "{n} pieces", with the singular for one
LP.piecesLabel = n => (n === 1 ? LP.t("resultsCountOne") : LP.t("resultsCount", { n }));
// Day + month only, for tight spots like the tracking steps
LP.formatDay = iso => new Intl.DateTimeFormat(LP.lang === "ar" ? "ar-JO-u-nu-latn" : "en-GB", { day: "numeric", month: "numeric" }).format(new Date(iso));

// A random id (order tokens, checkout attempt keys)
LP.uid = function () {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
};

// Run once the visitor actually sees the page (not while the browser prerenders it ahead of a tap)
LP.whenShown = fn => (document.prerendering ? document.addEventListener("prerenderingchange", fn, { once: true }) : fn());

/* ---------- Recently viewed (newest first; shown in the bag drawer) ---------- */
LP.recent = {
  list() { return LP.storage.get(LP.config.storage.recent, []); },
  add(id) { LP.storage.set(LP.config.storage.recent, [id].concat(this.list().filter(x => x !== id)).slice(0, 12)); }
};

/* ---------- Forgiving input ---------- */
// "٠٧٩١٢٣٤٥٦٧" → "0791234567" (Arabic and Persian digits typed on an Arabic keyboard)
LP.latinDigits = s => String(s || "")
  .replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x660))
  .replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x6F0));
// Search text: lower case, Arabic letter variants folded (أ إ آ → ا, ة → ه, ى → ي), no tashkeel or tatweel
LP.searchText = s => LP.latinDigits(s).toLowerCase()
  .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
  .replace(/[أإآ]/g, "ا")
  .replace(/ة/g, "ه")
  .replace(/ى/g, "ي");

/* ---------- Bag ---------- */
LP.bag = {
  items() { return LP.storage.get(LP.config.storage.bag, []); },
  save(items) {
    LP.storage.set(LP.config.storage.bag, items);
    document.dispatchEvent(new CustomEvent("lp:bag"));
  },
  key: (id, color, size) => id + "|" + color + "|" + size,
  add(id, color, size, qty) {
    const items = this.items();
    const k = this.key(id, color, size);
    const found = items.find(i => this.key(i.id, i.color, i.size) === k);
    if (found) found.qty = Math.min(LP.config.maxQty, found.qty + qty);
    else items.push({ id, color, size, qty: Math.min(LP.config.maxQty, qty) });
    this.save(items);
  },
  setQty(index, qty) {
    const items = this.items();
    if (!items[index]) return;
    if (qty <= 0) return this.remove(index);
    items[index].qty = Math.min(LP.config.maxQty, qty);
    this.save(items);
    return null;
  },
  // Returns what was removed, so it can be put back (undo)
  remove(index) {
    const items = this.items();
    const gone = items.splice(index, 1)[0];
    this.save(items);
    return gone ? { item: gone, index } : null;
  },
  restore(removed) {
    if (!removed) return;
    const items = this.items();
    const k = this.key(removed.item.id, removed.item.color, removed.item.size);
    const found = items.find(i => this.key(i.id, i.color, i.size) === k);
    if (found) found.qty = Math.min(LP.config.maxQty, found.qty + removed.item.qty);
    else items.splice(Math.min(removed.index, items.length), 0, removed.item);
    this.save(items);
  },
  clear() { this.save([]); },
  count() { return this.items().reduce((a, i) => a + i.qty, 0); },
  subtotal() {
    return this.items().reduce((a, i) => {
      const p = LP.getProduct(i.id);
      return a + (p ? p.price * i.qty : 0);
    }, 0);
  }
};
