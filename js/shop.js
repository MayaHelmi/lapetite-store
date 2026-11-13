/* =========================================================
   Shop page: category chips, filters, search, sort, pages
   State lives in the URL so filtered views can be shared.
   ========================================================= */
(function () {
  const params = new URLSearchParams(location.search);
  const state = {
    cat: params.get("cat") || "",
    collection: params.get("collection") || "",
    color: params.get("color") || "",
    size: params.get("size") || "",
    sort: ["new", "priceAsc", "priceDesc"].includes(params.get("sort")) ? params.get("sort") : "new",
    q: params.get("q") || "",
    page: Math.max(1, parseInt(params.get("page"), 10) || 1)
  };
  let focusSearch = params.get("focus") === "search";
  let panelOpen = false;
  let bound = false;

  const unique = arr => Array.from(new Set(arr));
  const allCats = Object.keys(LP.labels.categories);
  const allCollections = Object.keys(LP.labels.collections);
  const allColors = unique(LP.products.flatMap(p => p.colors));
  const allSizes = ["1", "2", "free"];

  // push: a new history entry (changing page), so Back returns to the previous page
  function syncUrl(push) {
    const q = new URLSearchParams();
    ["cat", "collection", "color", "size", "q"].forEach(k => { if (state[k]) q.set(k, state[k]); });
    if (state.sort !== "new") q.set("sort", state.sort);
    if (state.page > 1) q.set("page", state.page);
    const url = location.pathname + (q.toString() ? "?" + q.toString() : "");
    if (push) history.pushState(null, "", url);
    else history.replaceState(null, "", url);
    setCanonical();
  }

  // Search engines index each category and each of its pages once, whatever filters or sort are on
  function setCanonical() {
    const q = new URLSearchParams();
    if (state.cat) q.set("cat", state.cat);
    if (state.page > 1) q.set("page", state.page);
    LP.setCanonical("shop.html" + (q.toString() ? "?" + q.toString() : ""));
  }

  function filtered() {
    const term = LP.searchText(state.q.trim());
    // Searches names, descriptions, category and colors in both languages, forgiving Arabic spelling
    const haystack = p => LP.searchText([p.name.ar, p.name.en, p.desc.ar, p.desc.en, LP.labels.categories[p.category].ar, LP.labels.categories[p.category].en]
      .concat(p.colors.map(c => LP.labels.colors[c].ar + " " + LP.labels.colors[c].en)).join(" "));
    let list = LP.products.filter(p =>
      (!state.cat || p.category === state.cat) &&
      (!state.collection || p.collection === state.collection) &&
      (!state.color || p.colors.includes(state.color)) &&
      (!state.size || p.sizes.includes(state.size)) &&
      (!term || haystack(p).includes(term))
    );
    // Products are listed newest first in products.js
    if (state.sort === "priceAsc") list = list.slice().sort((a, b) => a.price - b.price);
    else if (state.sort === "priceDesc") list = list.slice().sort((a, b) => b.price - a.price);
    // Sold-out pieces stay visible, after everything that can be ordered
    return list.filter(p => !p.soldOut).concat(list.filter(p => p.soldOut));
  }

  function activeFilterCount() {
    return ["collection", "color", "size"].filter(k => state[k]).length;
  }

  function options(select, values, labelFn, current, anyKey) {
    select.innerHTML = '<option value="">' + LP.t(anyKey) + ": " + LP.t("any") + "</option>" +
      values.map(v => '<option value="' + v + '"' + (v === current ? " selected" : "") + ">" + LP.t(anyKey) + ": " + labelFn(v) + "</option>").join("");
  }

  function renderControls() {
    const t = LP.t;
    document.getElementById("shop-title").textContent =
      state.cat ? LP.label("categories", state.cat)
      : state.collection ? LP.label("collections", state.collection)
      : t("allProducts");

    const chips = [["", t("any")]].concat(allCats.map(c => [c, LP.label("categories", c)]));
    const chipWrap = document.getElementById("category-chips");
    chipWrap.setAttribute("aria-label", t("shop"));
    chipWrap.innerHTML = chips.map(([v, label]) =>
      '<button class="chip" type="button" data-cat="' + v + '" aria-pressed="' + (state.cat === v) + '">' + label + "</button>").join("");

    const n = activeFilterCount();
    const toggle = document.getElementById("filters-toggle");
    toggle.innerHTML = LP.icons.filter + "<span>" + t("filters") + "</span>" + (n ? '<span class="count-badge">' + n + "</span>" : "");
    toggle.setAttribute("aria-expanded", String(panelOpen));
    document.querySelector(".filters").classList.toggle("is-open", panelOpen);

    options(document.getElementById("f-collection"), allCollections, v => LP.label("collections", v), state.collection, "filterCollection");
    options(document.getElementById("f-color"), allColors, v => LP.label("colors", v), state.color, "filterColor");
    options(document.getElementById("f-size"), allSizes, v => LP.label("sizes", v), state.size, "filterSize");

    const sorts = [["new", "sortNew"], ["priceAsc", "sortPriceAsc"], ["priceDesc", "sortPriceDesc"]];
    document.getElementById("f-sort").innerHTML = sorts.map(([v, k]) =>
      '<option value="' + v + '"' + (state.sort === v ? " selected" : "") + ">" + t("sortLabel") + ": " + t(k) + "</option>").join("");

    document.getElementById("search-input").value = state.q;
  }

  function renderApplied() {
    const t = LP.t;
    const applied = [];
    if (state.collection) applied.push(["collection", t("filterCollection") + ": " + LP.label("collections", state.collection)]);
    if (state.color) applied.push(["color", t("filterColor") + ": " + LP.label("colors", state.color)]);
    if (state.size) applied.push(["size", t("filterSize") + ": " + LP.label("sizes", state.size)]);
    if (state.q) applied.push(["q", t("search") + ": “" + LP.esc(state.q) + "”"]);
    const wrap = document.getElementById("applied");
    wrap.hidden = applied.length === 0;
    wrap.innerHTML = applied.map(([k, label]) =>
      '<button class="chip chip--small" type="button" data-clear="' + k + '" aria-label="' + t("removeFilter") + ": " + label + '">' + label + LP.icons.close + "</button>").join("") +
      (applied.length > 1 ? '<button class="link" type="button" data-clear="all">' + t("clearAll") + "</button>" : "");
  }

  // Page numbers to show: all of them when there are few, otherwise
  // the first, the last and the ones around the current page, with gaps ("…")
  function pageList(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [1];
    const from = Math.max(2, Math.min(current - 1, total - 3));
    const to = Math.min(total - 1, Math.max(current + 1, 4));
    if (from > 2) pages.push("gap");
    for (let n = from; n <= to; n++) pages.push(n);
    if (to < total - 1) pages.push("gap");
    pages.push(total);
    return pages;
  }

  function renderPager(total, pages) {
    const t = LP.t;
    const pager = document.getElementById("pager");
    pager.hidden = pages < 2;
    if (pages < 2) { pager.innerHTML = ""; return; }
    const size = LP.config.pageSize;
    const from = (state.page - 1) * size + 1;
    const to = Math.min(total, state.page * size);
    const arrow = (dir, target, label) =>
      '<button class="pager__btn pager__' + dir + '" type="button"' + (target ? ' data-page="' + target + '"' : " disabled") + ' aria-label="' + label + '">' + LP.icons.chevron + "</button>";
    pager.setAttribute("aria-label", t("pagerLabel"));
    pager.innerHTML =
      // the range stays "13–24" in Arabic too
      '<p class="pager__info">' + t("showing", { range: '<bdi dir="ltr">' + from + "–" + to + "</bdi>", total }) + "</p>" +
      '<div class="pager__row">' +
        arrow("prev", state.page > 1 ? state.page - 1 : 0, t("prevPage")) +
        '<ol class="pager__list">' + pageList(state.page, pages).map(n => n === "gap"
          ? '<li class="pager__gap" aria-hidden="true">…</li>'
          : '<li><button class="pager__btn" type="button" data-page="' + n + '" aria-label="' + t("pageN", { n }) + '"' + (n === state.page ? ' aria-current="page"' : "") + ">" + n + "</button></li>").join("") +
        "</ol>" +
        arrow("next", state.page < pages ? state.page + 1 : 0, t("nextPage")) +
      "</div>";
  }

  function renderGrid() {
    const t = LP.t;
    const list = filtered();
    const size = LP.config.pageSize;
    const pages = Math.max(1, Math.ceil(list.length / size));
    state.page = Math.min(state.page, pages);
    const visible = list.slice((state.page - 1) * size, state.page * size);
    document.getElementById("result-count").textContent = LP.piecesLabel(list.length);
    document.getElementById("filters-done").textContent = t("showResults", { n: list.length });
    document.getElementById("grid").innerHTML = visible.map(p => LP.card(p, "h2")).join("");

    document.getElementById("empty").innerHTML = list.length ? "" :
      '<div class="empty">' + LP.icons.search + '<p class="h3">' + t("noResults") + '</p><p class="text-secondary">' + t("noResultsText") + '</p><button class="btn btn--secondary" type="button" data-clear="all">' + t("clearAll") + "</button></div>";

    renderPager(list.length, pages);
  }

  // Back to the top of the results after changing page, just under the sticky header
  function toResults() {
    const header = document.querySelector(".header");
    const top = document.getElementById("results").getBoundingClientRect().top + scrollY - (header ? header.offsetHeight : 0);
    if (top < scrollY) scrollTo({ top: Math.max(0, top), behavior: LP.reducedMotion() ? "instant" : "smooth" });
  }

  function update() {
    state.page = 1;
    syncUrl();
    renderControls();
    renderApplied();
    renderGrid();
  }

  function setPanel(open) {
    panelOpen = open;
    document.querySelector(".filters").classList.toggle("is-open", open);
    document.getElementById("filters-toggle").setAttribute("aria-expanded", String(open));
  }

  function bind() {
    if (bound) return;
    bound = true;
    document.addEventListener("click", e => {
      if (e.target.closest("#filters-toggle")) { setPanel(!panelOpen); return; }
      if (e.target.closest("#filters-done")) {
        setPanel(false);
        document.getElementById("grid").scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const chip = e.target.closest("[data-cat]");
      if (chip) { state.cat = chip.dataset.cat; update(); return; }
      const clear = e.target.closest("[data-clear]");
      if (clear) {
        const k = clear.dataset.clear;
        if (k === "all") { state.collection = state.color = state.size = state.q = state.cat = ""; }
        else state[k] = "";
        update();
        return;
      }
      const pageBtn = e.target.closest("[data-page]");
      if (pageBtn) {
        const n = Number(pageBtn.dataset.page);
        if (n === state.page) return;
        state.page = n;
        syncUrl(true);
        renderGrid();
        toResults();
        // Keep keyboard focus on the pager (the buttons are re-drawn)
        const again = document.querySelector('#pager [data-page="' + n + '"][aria-current]') || document.querySelector("#pager .pager__next:not([disabled]), #pager .pager__prev:not([disabled])");
        if (again && pageBtn.matches(":focus-visible")) again.focus({ preventScroll: true });
      }
    });
    // Back/forward between pages
    window.addEventListener("popstate", () => {
      state.page = Math.max(1, parseInt(new URLSearchParams(location.search).get("page"), 10) || 1);
      renderGrid();
    });
    [["f-collection", "collection"], ["f-color", "color"], ["f-size", "size"], ["f-sort", "sort"]].forEach(([id, key]) => {
      document.getElementById(id).addEventListener("change", e => { state[key] = e.target.value || (key === "sort" ? "new" : ""); update(); });
    });
    let timer;
    document.getElementById("search-input").addEventListener("input", e => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        state.q = e.target.value;
        state.page = 1;
        syncUrl();
        renderApplied();
        renderGrid();
      }, 200);
    });
  }

  LP.page = {
    id: "shop",
    render() {
      LP.applyStaticText();
      document.title = (state.cat ? LP.label("categories", state.cat) : LP.t("shop")) + " · " + LP.config.brand;
      LP.setDescription(state.cat ? LP.t("metaShopCat", { cat: LP.label("categories", state.cat) }) : LP.t("metaShop"));
      setCanonical();
      bind();
      renderControls();
      renderApplied();
      renderGrid();
      if (focusSearch) {
        document.getElementById("search-input").focus();
        focusSearch = false;
      }
    }
  };
})();
