/* =========================================================
   Product page: gallery with hover zoom, color + size pickers,
   size guide + size advisor, add to bag (with fly
   animation), buy now, sticky add-to-bag on mobile, details /
   delivery / exchanges, reviews, related
   ========================================================= */
(function () {
  const params = new URLSearchParams(location.search);
  const product = LP.getProduct(params.get("id"));
  const state = {
    color: product ? (product.colors.includes(params.get("color")) ? params.get("color") : LP.firstImageColor(product)) : "",
    size: product && product.sizes.length === 1 ? product.sizes[0] : ""
  };
  let bound = false;
  let reviews = { own: [], shop: [] };

  function renderNotFound() {
    document.getElementById("main").innerHTML =
      '<div class="empty">' + LP.icons.search + '<p class="h3">' + LP.t("noResults") + '</p><a class="btn btn--primary" href="shop.html">' + LP.t("shop") + "</a></div>";
  }

  function renderGallery() {
    const imgs = LP.imagesFor(product, state.color);
    const name = LP.esc(product.name[LP.lang]);
    const track = document.getElementById("track");
    track.setAttribute("aria-label", name);
    // Photos after the first wait until it has loaded, so the first one shows sooner
    track.innerHTML = imgs.map((src, i) =>
      '<figure class="zoom" data-zoom><img ' + (i ? 'data-src="' + src + '" sizes="' + LP.config.images.sizes.gallery + '"' + LP.toneAttr(src) : LP.imgAttrs(src, "gallery")) + ' alt="' + name + " — " + LP.label("colors", state.color) + " " + (i + 1) + '" width="900" height="1200"' + (i ? ' loading="lazy"' : ' fetchpriority="high"') + ' data-index="' + i + '"></figure>').join("");
    const first = track.querySelector("img");
    const loadRest = () => track.querySelectorAll("img[data-src]").forEach(img => {
      LP.setImage(img, img.dataset.src);
      img.removeAttribute("data-src");
    });
    if (first.complete) loadRest();
    else {
      first.addEventListener("load", loadRest, { once: true });
      first.addEventListener("error", loadRest, { once: true });
    }
    document.getElementById("thumbs").innerHTML = imgs.map((src, i) =>
      '<button type="button" data-thumb="' + i + '" aria-label="' + LP.t("image") + " " + (i + 1) + '"' + (i === 0 ? ' aria-current="true"' : "") + '><img src="' + LP.thumb(src) + '" alt="" width="900" height="1200" loading="lazy"></button>').join("");
    document.getElementById("dots").innerHTML = imgs.length > 1 ? imgs.map((_, i) => "<span" + (i === 0 ? ' class="is-active"' : "") + "></span>").join("") : "";
    track.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }

  function renderOptions() {
    document.getElementById("p-colors").innerHTML = product.colors.map(c =>
      '<label class="option option--swatch" title="' + LP.label("colors", c) + '">' +
        '<input type="radio" name="color" value="' + c + '"' + (c === state.color ? " checked" : "") + ">" +
        '<span style="--swatch: var(--swatch-' + c + ')"><span class="sr-only">' + LP.label("colors", c) + "</span></span>" +
      "</label>").join("");
    document.getElementById("p-color-name").textContent = LP.label("colors", state.color);

    document.getElementById("p-sizes").innerHTML = product.sizes.map(s =>
      '<label class="option option--size"><input type="radio" name="size" value="' + s + '"' + (s === state.size ? " checked" : "") + "><span>" + LP.label("sizes", s) + "</span></label>").join("");
    document.getElementById("p-size-name").textContent = state.size ? LP.label("sizes", state.size) : "";
    // Size guide + size advisor need this piece's sizes in the size chart
    const fitBtn = document.getElementById("fit-open");
    fitBtn.hidden = !LP.fit.available(product);
    document.getElementById("size-guide-link").hidden = fitBtn.hidden;
    fitBtn.innerHTML = LP.icons.ruler + "<span>" + LP.t("fitOpen") + "</span>";
    document.getElementById("sticky-name").textContent = product.name[LP.lang];
  }

  /* ---------- Details, delivery, exchanges ---------- */
  function renderInfo() {
    const t = LP.t;
    const list = items => items.join(LP.lang === "ar" ? "، " : ", ");
    const spec = [
      [t("specCollection"), LP.label("collections", product.collection)],
      [t("specCategory"), LP.label("categories", product.category)],
      [t("specColors"), list(product.colors.map(c => LP.label("colors", c)))],
      [t("specSizes"), list(product.sizes.map(s => LP.label("sizes", s)))]
    ];
    document.getElementById("p-details").innerHTML = "<p>" + LP.esc(product.desc[LP.lang]) + "</p>" +
      '<dl class="spec">' + spec.map(([k, v]) => "<div><dt>" + k + "</dt><dd>" + v + "</dd></div>").join("") + "</dl>";

    const policy = LP.content.policies;
    const free = LP.freeDeliveryText();
    document.getElementById("p-delivery").innerHTML =
      "<p>" + LP.esc(LP.fillFees(LP.tx(policy.delivery))) + (free ? " " + free + "." : "") + "</p>" +
      "<p>" + LP.tx(policy.payment) + "</p>";
    document.getElementById("p-exchange").innerHTML =
      "<p>" + LP.tx(policy.exchange) + '</p><a class="link" href="help.html">' + t("readFaq") + "</a>";

    // Offer line above the buttons: free delivery, or the delivery price when the offer is off
    document.getElementById("buy-note").innerHTML = free
      ? LP.icons.gift + "<span>" + free + "</span>"
      : LP.icons.truck + "<span>" + LP.announceText() + "</span>";
  }

  /* ---------- Reviews ---------- */
  function reviewCard(r, withItem) {
    const t = LP.t;
    const item = r.item;
    return '<article class="review-card">' +
      LP.stars(r.rating) +
      (r.text ? '<p class="review-card__text">' + LP.esc(r.text) + "</p>" : "") +
      '<p class="review-card__name"><bdi>' + LP.esc(r.name) + '</bdi> · <time datetime="' + r.createdAt + '">' + LP.formatDate(r.createdAt, false) + "</time></p>" +
      (withItem && item ? '<a class="review-card__item" href="product.html?id=' + item.id + "&color=" + item.color + '">' +
        '<img src="' + LP.thumb(LP.orderItemImage(item)) + '" alt="" width="600" height="800" loading="lazy">' +
        "<span><small>" + t("reviewBought") + "</small>" + LP.esc(item.name[LP.lang] || item.name.ar) + "<strong>" + LP.formatPrice(item.price) + "</strong></span></a>" : "") +
    "</article>";
  }

  function renderReviews() {
    const t = LP.t;
    const section = document.getElementById("reviews");
    const link = document.getElementById("p-rating");
    const own = reviews.own;
    // This piece's reviews; when it has none yet, the shop's latest
    const list = own.length ? own : reviews.shop;
    const count = n => (n === 1 ? t("reviewsCountOne") : t("reviewsCount", { n }));
    if (own.length) {
      const avg = own.reduce((s, r) => s + r.rating, 0) / own.length;
      link.innerHTML = LP.stars(avg) + "<span>" + count(own.length) + "</span>";
      link.hidden = false;
    } else link.hidden = true;
    if (!list.length) { section.hidden = true; return; }
    section.hidden = false;
    section.innerHTML = '<div class="section-head"><div class="reviews__head">' +
        '<h2 class="h2" id="reviews-title">' + t(own.length ? "reviewsTitle" : "reviewsStore") + "</h2>" +
        (own.length ? '<p class="reviews__summary">' + link.innerHTML + "</p>" : "") +
      "</div></div>" +
      '<div class="rail reviews__rail">' + list.slice(0, 12).map(r => reviewCard(r, !own.length)).join("") + "</div>";
  }

  // For search engines: one address per piece (not one per colour), with its price, stock and rating
  function renderSchema() {
    const url = LP.setCanonical("product.html?id=" + product.id);
    const abs = path => new URL(path, location.href).href;
    const own = reviews.own;
    const item = (position, name, href) => ({ "@type": "ListItem", position, name, item: abs(href) });
    LP.setSchema({ "@graph": [
      Object.assign({
        "@type": "Product",
        name: product.name[LP.lang],
        description: product.desc[LP.lang],
        sku: product.id,
        image: LP.imagesFor(product, LP.firstImageColor(product)).filter(src => !src.startsWith("data:")).map(abs),
        brand: { "@type": "Brand", name: LP.config.brand + " " + LP.t("tagline") },
        offers: {
          "@type": "Offer",
          url,
          price: Number(product.price).toFixed(LP.config.priceDecimals),
          priceCurrency: LP.config.currency.en,
          availability: "https://schema.org/" + (product.soldOut ? "OutOfStock" : "InStock"),
          itemCondition: "https://schema.org/NewCondition"
        }
      }, own.length ? { aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: (own.reduce((sum, r) => sum + r.rating, 0) / own.length).toFixed(1),
        reviewCount: own.length
      } } : {}),
      { "@type": "BreadcrumbList", itemListElement: [
        item(1, LP.t("home"), "./"),
        item(2, LP.label("categories", product.category), "shop.html?cat=" + product.category),
        item(3, product.name[LP.lang], "product.html?id=" + product.id)
      ] }
    ] });
  }

  async function loadReviews() {
    const [own, shop] = await Promise.all([LP.api.getReviews(product.id), LP.api.getReviews()]);
    reviews = { own, shop };
    renderReviews();
    renderSchema();
  }

  function render() {
    const t = LP.t;
    LP.applyStaticText();
    if (!product) { renderNotFound(); return; }
    const name = product.name[LP.lang];
    document.title = name + " · " + LP.config.brand;
    LP.setDescription(t("metaProduct", { name, price: LP.formatPrice(product.price), desc: product.desc[LP.lang] }));
    renderSchema();

    document.getElementById("breadcrumb").innerHTML =
      '<li><a href="index.html">' + t("home") + '</a></li><li><a href="shop.html?cat=' + product.category + '">' + LP.label("categories", product.category) + '</a></li><li aria-current="page">' + LP.esc(name) + "</li>";

    document.getElementById("p-collection").textContent = LP.label("collections", product.collection);
    document.getElementById("p-name").textContent = name;
    document.getElementById("p-price").textContent = LP.formatPrice(product.price);
    document.getElementById("sticky-price").textContent = LP.formatPrice(product.price);
    renderQty();

    const stock = document.getElementById("p-stock");
    stock.classList.toggle("is-out", !!product.soldOut);
    stock.innerHTML = '<i class="stock__dot"></i>' + t(product.soldOut ? "soldOut" : "inStock");

    renderInfo();
    renderReviews();
    renderGallery();
    renderOptions();

    // Sold out (set by Heba in the admin panel): still shown, can't be added
    if (product.soldOut) {
      [document.querySelector("#main-cta [type=submit]"), document.getElementById("sticky-add"), document.getElementById("buy-now")].forEach(btn => {
        btn.disabled = true;
        btn.textContent = t("soldOut");
      });
    }

    const related = LP.products.filter(p => p.id !== product.id && p.category === product.category && !p.soldOut)
      .concat(LP.products.filter(p => p.id !== product.id && p.category !== product.category && p.collection === product.collection))
      .slice(0, 4);
    document.getElementById("also").innerHTML = related.map(LP.card).join("");

    bind();
  }

  // The photo showing most in the photo area (it scrolls sideways on phones, down on desktop)
  function visibleImage() {
    const track = document.getElementById("track");
    const box = track.getBoundingClientRect();
    const shown = img => {
      const r = img.getBoundingClientRect();
      return Math.max(0, Math.min(r.right, box.right) - Math.max(r.left, box.left)) * Math.max(0, Math.min(r.bottom, box.bottom) - Math.max(r.top, box.top));
    };
    return [...track.querySelectorAll("img")].reduce((best, img) => (shown(img) > shown(best) ? img : best));
  }

  // Bring a photo up in the photo area (not the page)
  function showPhoto(index, instant) {
    const track = document.getElementById("track");
    const img = track.querySelector('img[data-index="' + index + '"]');
    if (!img) return;
    const box = track.getBoundingClientRect();
    const r = img.getBoundingClientRect();
    track.scrollTo({ top: track.scrollTop + r.top - box.top, left: track.scrollLeft + r.left - box.left, behavior: instant || LP.reducedMotion() ? "instant" : "smooth" });
  }

  // Hovering a colour shows it on the photo in view until the pointer leaves (a click chooses it)
  let previewed = null;
  function endPreview() {
    if (previewed) LP.setImage(previewed.img, previewed.src, "gallery");
    previewed = null;
  }
  function previewColor(color) {
    endPreview();
    if (color === state.color) return;
    const img = visibleImage();
    previewed = { img, src: img.getAttribute("src") };
    LP.setImage(img, LP.imagesFor(product, color)[0], "gallery");
  }

  function selectSize(size) {
    const input = document.querySelector('#p-sizes input[value="' + size + '"]');
    if (!input) return;
    input.checked = true;
    state.size = size;
    document.getElementById("p-size-name").textContent = LP.label("sizes", size);
    document.getElementById("size-error").textContent = "";
    renderQty();
  }

  // A size must be picked first; points her to the sizes when it isn't
  function sizeReady() {
    const err = document.getElementById("size-error");
    if (state.size) { err.textContent = ""; return true; }
    err.textContent = LP.t("chooseSize");
    document.getElementById("p-sizes").scrollIntoView({ behavior: "smooth", block: "center" });
    const first = document.querySelector("#p-sizes input");
    if (first) first.focus({ preventScroll: true });
    return false;
  }

  // Where the chosen colour and size sits in the bag (-1 when it isn't there)
  function bagIndex() {
    return LP.bag.items().findIndex(i => i.id === product.id && i.color === state.color && i.size === state.size);
  }

  // The quantity stepper appears once this colour and size is in the bag, and shows how many are in it
  function renderQty() {
    const item = LP.bag.items()[bagIndex()];
    document.getElementById("p-qty-box").hidden = !item;
    if (item) document.getElementById("p-qty").textContent = item.qty;
  }

  // Buy now: into the bag (unless it's already there) and straight to checkout
  function buyNow() {
    if (product.soldOut || !sizeReady()) return;
    if (bagIndex() < 0) LP.bag.add(product.id, state.color, state.size, 1);
    location.href = "bag.html";
  }

  function addToBag() {
    if (product.soldOut || !sizeReady()) return;
    LP.bag.add(product.id, state.color, state.size, 1);
    const img = visibleImage();
    LP.flyToBag(img.currentSrc || img.src, img.getBoundingClientRect(), LP.cart.open);
  }

  function bind() {
    if (bound) return;
    bound = true;

    document.getElementById("buybox").addEventListener("change", e => {
      if (e.target.name === "color") {
        state.color = e.target.value;
        document.getElementById("p-color-name").textContent = LP.label("colors", state.color);
        previewed = null;   // the photos are redrawn for the chosen colour
        renderGallery();
        const q = new URLSearchParams(location.search);
        q.set("color", state.color);
        history.replaceState(null, "", location.pathname + "?" + q.toString());
        renderQty();
      }
      if (e.target.name === "size") {
        state.size = e.target.value;
        document.getElementById("p-size-name").textContent = LP.label("sizes", state.size);
        document.getElementById("size-error").textContent = "";
        renderQty();
      }
    });

    document.getElementById("buybox").addEventListener("submit", e => { e.preventDefault(); addToBag(); });

    document.getElementById("buy-now").addEventListener("click", buyNow);

    // Size help: "Find my size" and the size chart are two views of one panel; the size it finds can go straight to the bag
    const fitActions = { add: size => { selectSize(size); addToBag(); } };
    document.getElementById("fit-open").addEventListener("click", () => LP.fit.open(product, fitActions));
    document.getElementById("size-guide-link").addEventListener("click", () => LP.fit.open(product, fitActions, "chart"));
    document.getElementById("sticky-add").addEventListener("click", addToBag);

    document.addEventListener("click", e => {
      const step = e.target.closest("[data-qty]");
      if (step) {
        // Changes the bag itself; stepping down from 1 takes the piece out (and hides the stepper)
        const i = bagIndex();
        if (i >= 0) LP.bag.setQty(i, LP.bag.items()[i].qty + Number(step.dataset.qty));
      }
      const thumb = e.target.closest("[data-thumb]");
      if (thumb) showPhoto(thumb.dataset.thumb);
    });

    // With a mouse: hovering a small photo brings it up, hovering a colour previews it
    document.getElementById("thumbs").addEventListener("mouseover", e => {
      const thumb = e.target.closest("[data-thumb]");
      if (thumb) showPhoto(thumb.dataset.thumb, true);
    });
    const colors = document.getElementById("p-colors");
    colors.addEventListener("mouseover", e => {
      const option = e.target.closest(".option--swatch");
      if (option) previewColor(option.querySelector("input").value);
    });
    colors.addEventListener("mouseout", e => { if (e.target.closest(".option--swatch")) endPreview(); });

    // Hover zoom (desktop only): magnify where the pointer is
    const canZoom = () => window.matchMedia("(hover: hover) and (min-width: 1100px)").matches;
    const track = document.getElementById("track");
    track.addEventListener("mousemove", e => {
      const fig = e.target.closest("[data-zoom]");
      if (!fig || !canZoom()) return;
      const r = fig.getBoundingClientRect();
      const img = fig.querySelector("img");
      img.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + "% " + ((e.clientY - r.top) / r.height * 100) + "%";
      fig.classList.add("is-zoomed");
    });
    track.addEventListener("mouseout", e => {
      const fig = e.target.closest("[data-zoom]");
      if (fig && !fig.contains(e.relatedTarget)) fig.classList.remove("is-zoomed");
    });

    // Which photo is showing: phones scroll them sideways (dots), desktop scrolls them down in their own area (small photos)
    track.addEventListener("scroll", () => {
      const box = track.getBoundingClientRect();
      const offsets = [...track.children].map(fig => {
        const r = fig.getBoundingClientRect();
        return Math.abs(r.left - box.left) + Math.abs(r.top - box.top);
      });
      const atEnd = track.scrollTop > 0 && track.scrollTop + track.clientHeight >= track.scrollHeight - 1;
      const i = atEnd ? offsets.length - 1 : offsets.indexOf(Math.min(...offsets));
      document.querySelectorAll("#dots span").forEach((d, n) => d.classList.toggle("is-active", n === i));
      document.querySelectorAll("[data-thumb]").forEach((b, n) => {
        b.setAttribute("aria-current", String(n === i));
        if (n === i && b.offsetParent) b.scrollIntoView({ block: "nearest" });
      });
    }, { passive: true });

    const sticky = document.getElementById("sticky-buy");
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        const show = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        sticky.classList.toggle("is-visible", show);
        sticky.setAttribute("aria-hidden", String(!show));
        document.getElementById("sticky-add").tabIndex = show ? 0 : -1;
      }).observe(document.getElementById("main-cta"));
    }
  }

  // Delivery fees load from the settings after the first render
  document.addEventListener("lp:fees", () => { if (product) renderInfo(); });
  // The bag changed (here or in the bag drawer): keep the stepper in step with it
  document.addEventListener("lp:bag", () => { if (product) renderQty(); });
  if (product) {
    loadReviews();
    LP.whenShown(() => LP.recent.add(product.id));
  }

  LP.page = { id: "product", render };
})();
