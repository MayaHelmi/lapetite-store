/* =========================================================
   Home page
   ========================================================= */
(function () {
  let openLook = -1;     // the collection card that's open; -1 = none, all cards the same size
  let looksBound = false;

  function setOpenLook(card) {
    const book = document.getElementById("lookbook");
    const cards = [...book.querySelectorAll(".look")];
    openLook = card ? cards.indexOf(card) : -1;
    cards.forEach((c, i) => c.classList.toggle("is-open", i === openLook));
    book.classList.toggle("has-open", openLook >= 0);
  }

  // Mouse: hovering opens a card; leaving the row brings them back to equal sizes.
  // Touch: the first tap opens a card, a tap on the open card follows the link, a tap elsewhere resets.
  function bindLooks() {
    if (looksBound) return;
    looksBound = true;
    const book = document.getElementById("lookbook");
    book.addEventListener("pointerover", e => {
      const card = e.target.closest(".look");
      if (card && e.pointerType === "mouse" && !card.classList.contains("is-open")) setOpenLook(card);
    });
    book.addEventListener("pointerleave", e => {
      if (e.pointerType === "mouse") setOpenLook(null);
    });
    book.addEventListener("focusout", e => {
      if (!book.contains(e.relatedTarget)) setOpenLook(null);
    });
    document.addEventListener("click", e => {
      if (openLook >= 0 && !e.target.closest("#lookbook")) setOpenLook(null);
    });
    // Keyboard focus opens a card (a tap also focuses the link, so only keyboard focus counts)
    book.addEventListener("focusin", e => {
      const card = e.target.closest(".look");
      let keyboard = false;
      try { keyboard = card && card.matches(":focus-visible"); } catch (err) { keyboard = false; }
      if (keyboard) setOpenLook(card);
    });
    book.addEventListener("click", e => {
      const card = e.target.closest(".look");
      if (card && !card.classList.contains("is-open")) {
        e.preventDefault();
        setOpenLook(card);
      }
    });
  }

  function renderHero(h) {
    // Three slots; each crossfades between two photos from the pool
    const pool = h.heroImages;
    const slots = 3;
    let html = "";
    for (let i = 0; i < slots; i++) {
      const pair = [pool[i], pool[i + slots]].filter(Boolean);
      // The second photo of each slot waits until the page has loaded (see loadLaterHeroPhotos)
      html += '<div class="hero__slot">' + pair.map((photo, k) => k === 0
        ? "<img " + LP.imgAttrs(photo.image, "hero", "--focus: " + photo.focus) + ' alt="" width="1200" height="1600" class="is-active"' + (i === 0 ? ' fetchpriority="high"' : ' loading="lazy"') + ">"
        : '<img data-src="' + photo.image + '" sizes="' + LP.config.images.sizes.hero + '"' + LP.toneAttr(photo.image, "--focus: " + photo.focus) + ' alt="" width="1200" height="1600" loading="lazy">').join("") + "</div>";
    }
    document.getElementById("hero-media").innerHTML = html;
    if (document.readyState === "complete") loadLaterHeroPhotos();
    else window.addEventListener("load", loadLaterHeroPhotos, { once: true });
  }

  function loadLaterHeroPhotos() {
    document.querySelectorAll(".hero__slot img[data-src]").forEach(img => {
      LP.setImage(img, img.dataset.src);
      img.removeAttribute("data-src");
    });
  }

  // Brand facts strip; the third fact is the flagship offer (free delivery) when it's on
  function renderFacts(h) {
    const t = LP.t;
    const facts = [
      t("heroFactDesigns", { n: LP.products.length }),
      t("heroFactCollections", { n: h.lookbook.length }),
      LP.freeDeliveryOver > 0 ? t("heroFactFree", { amount: LP.formatPrice(LP.freeDeliveryOver) }) : t("heroFactDelivery", { n: LP.config.cities.length })
    ];
    const factList = document.getElementById("hero-facts");
    factList.setAttribute("aria-label", t("heroFactsLabel"));
    factList.innerHTML = facts.map(f => '<li class="hero-facts__item">' + f + "</li>").join("");
  }
  document.addEventListener("lp:fees", () => renderFacts(LP.home));

  LP.page = {
    id: "home",
    overlayHeader: true,
    render() {
      const t = LP.t;
      const brand = LP.config.brandImagePath;
      document.title = t("homeTitle");
      LP.setSchema({
        "@type": "OnlineStore",
        name: LP.config.brand + " " + t("tagline"),
        description: t("metaHome"),
        url: new URL("./", location.href).href,
        logo: new URL(brand + "favicon.svg", location.href).href,
        sameAs: [LP.config.instagramUrl],
        areaServed: "JO"
      });
      const h = LP.home;
      const c = LP.content;

      renderHero(h);

      // Hero: shop button + brand facts strip (counts come from the catalog and settings)
      document.getElementById("hero-actions").innerHTML =
        '<a class="btn btn--light" href="shop.html"><span>' + t("heroCta") + "</span>" + LP.icons.arrow + "</a>";
      renderFacts(h);

      // New this season
      const fresh = LP.products.filter(p => h.newCollections.includes(p.collection)).slice(0, h.newCount);
      document.getElementById("new-products").innerHTML = fresh.map(LP.card).join("");

      // Collections: expanding cards
      const book = document.getElementById("lookbook");
      book.classList.toggle("has-open", openLook >= 0);
      book.style.setProperty("--look-n", h.lookbook.length);
      book.innerHTML = h.lookbook.map((item, i) => {
        const n = LP.products.filter(p => p.collection === item.key).length;
        return '<a class="look' + (i === openLook ? " is-open" : "") + '" href="shop.html?collection=' + item.key + '" style="--focus: ' + item.focus + '">' +
          "<img " + LP.imgAttrs(brand + item.image, "look") + ' alt="" loading="lazy" decoding="async" width="1200" height="1600">' +
          '<div class="look__copy">' +
            '<span class="look__index">' + LP.piecesLabel(n) + "</span>" +
            '<h3 class="look__title">' + LP.label("collections", item.key) + "</h3>" +
            '<p class="look__desc">' + LP.tx(c.collections[item.key]) + "</p>" +
            '<span class="look__more">' + t("exploreCollection") + LP.icons.arrow + "</span>" +
          "</div>" +
        "</a>";
      }).join("");
      bindLooks();

      // Categories: photo tiles, name + short line on a frosted strip
      document.getElementById("categories").innerHTML = h.categoryTiles.map(tile =>
        '<a class="tile" href="shop.html?cat=' + tile.key + '">' +
          '<img class="tile__img" ' + LP.imgAttrs(brand + tile.image, "tile") + ' alt="" loading="lazy" decoding="async" width="1200" height="1600">' +
          '<div class="tile__space"></div>' +
          '<div class="tile__strip"><h3 class="tile__title">' + LP.label("categories", tile.key) + "</h3></div>" +
        "</a>").join("");

      // About the brand + Instagram: her latest posts as the picture, story + points beside it
      document.getElementById("about-media").innerHTML = h.instagram
        .map(src => '<a href="' + LP.config.instagramUrl + '" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true"><img ' + LP.imgAttrs(src, "instagram") + ' alt="" loading="lazy" decoding="async" width="900" height="1200"></a>')
        .join("");
      document.getElementById("about-teaser-text").innerHTML = "<p>" + LP.tx(c.about.lead) + "</p>";
      document.getElementById("about-points").innerHTML = c.values.map((v, i) =>
        '<li class="points__item"><span class="points__num">' + String(i + 1).padStart(2, "0") + "</span>" +
          '<p class="points__title">' + LP.tx(v.title) + "</p>" +
          '<p class="points__text">' + LP.tx(v.text) + "</p></li>").join("");
      const ig = document.getElementById("ig-link");
      ig.href = LP.config.instagramUrl;
      ig.innerHTML = LP.icons.instagram + "<span>" + t("igCta") + "</span>";
    }
  };
})();
