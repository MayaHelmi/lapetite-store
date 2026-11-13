/* =========================================================
   Size guide + size advisor on the product page, in one panel
   with two tabs:
   • Size chart: a drawing of the piece + the measurements
   • Find my size:
     1. Height + weight, with a figure and a live estimate
     2. Body shape (bust, waist, hips) + how she likes it to fit
     3. The recommended size, with the reason for each area
   Model: LP.config.fit (demo numbers) + LP.content.sizeChart.
   Side panel on desktop, bottom sheet on phones.
   ========================================================= */
(function () {
  const cfg = LP.config.fit;
  const areas = ["bust", "waist", "hips"];
  const areaKeys = { bust: "fitBust", waist: "fitWaist", hips: "fitHips" };
  const shapes = ["narrower", "average", "fuller"];
  const shapeKeys = { narrower: "fitNarrower", average: "fitAverage", fuller: "fitFuller" };
  const prefs = ["fitted", "regular", "relaxed"];
  const prefKeys = { fitted: "fitFitted", regular: "fitRegular", relaxed: "fitRelaxed" };
  const stepKeys = ["fitStepMeasure", "fitStepShape", "fitStepResult"];

  let dialog = null;
  let product = null;
  let color = "";
  let actions = {};
  let step = 1;
  let tab = "find";    // "chart" | "find"

  // Answers are kept in this browser, so the next piece opens with them filled in
  const saved = LP.storage.get(LP.config.storage.fit, {});
  const answers = {
    height: clamp(Number(saved.height) || cfg.height.start, cfg.height),
    weight: clamp(Number(saved.weight) || cfg.weight.start, cfg.weight),
    shape: Object.assign({ bust: "average", waist: "average", hips: "average" }, saved.shape || {}),
    pref: prefs.includes(saved.pref) ? saved.pref : "regular"
  };

  function clamp(v, r) { return Math.min(r.max, Math.max(r.min, Math.round(v))); }
  function save() { LP.storage.set(LP.config.storage.fit, answers); }

  /* ---------- Model ---------- */
  const bmiOf = a => a.weight / Math.pow(a.height / 100, 2);

  // Estimated measurements + the ease she likes (a relaxed fit sizes up, a fitted one down)
  function bodyOf(a, shape, pref) {
    const bmi = bmiOf(a);
    const out = {};
    areas.forEach(k => {
      out[k] = cfg.base[k] + cfg.perBmi[k] * (bmi - cfg.base.bmi) + cfg.perCm[k] * (a.height - cfg.base.height) + cfg.shape[shape[k]] + cfg.preference[pref || "regular"];
    });
    return out;
  }

  // "88–96" → { min: 88, max: 96 }
  function rangeOf(text) {
    const n = String(text).split(/[–-]/).map(Number);
    return { min: n[0], max: n.length > 1 ? n[1] : n[0] };
  }

  // Where a measurement sits for a size: status + a 0–1 position on the bar
  // (the size's range is the middle half of the bar: roomy on one side, snug on the other)
  function fitArea(value, r) {
    const span = r.max - r.min || 1;
    const status = value > r.max ? "snug" : value < r.min ? "roomy" : "right";
    const at = 0.25 + 0.5 * (value - r.min) / span;
    return { status, at: Math.min(0.96, Math.max(0.04, at)) };
  }

  function lengthFit(height, length) {
    const diff = length - (height - cfg.ankleOffset);
    return diff > cfg.lengthTolerance.long ? "long" : diff < -cfg.lengthTolerance.short ? "short" : "right";
  }

  // The size rows this piece comes in, in chart order
  function rowsFor(p) {
    return LP.content.sizeChart.rows.filter(r => p.sizes.includes(r.size));
  }

  // How far a measurement is from a size's range: snug counts most, roomy less (modest cuts sit loose)
  function penalty(value, r) {
    const span = r.max - r.min || 1;
    if (value > r.max) return 10 + (value - r.max) / span;
    if (value < r.min) return (r.min - value) / span;
    return Math.abs((value - r.min) / span - 0.5) / 2;
  }

  // Best size: the lowest total penalty across bust, waist and hips
  function recommend(p, a, shape, pref) {
    const rows = rowsFor(p);
    if (!rows.length) return null;
    const body = bodyOf(a, shape, pref);
    const best = rows.map(row => {
      const parts = areas.map(k => Object.assign({ area: k }, fitArea(body[k], rangeOf(row.values[k]))));
      const score = areas.reduce((sum, k) => sum + penalty(body[k], rangeOf(row.values[k])), 0);
      return { size: row.size, row, parts, score };
    }).sort((x, y) => x.score - y.score)[0];
    const hasLength = cfg.lengthCategories.includes(p.category) && best.row.values.length;
    best.length = hasLength ? lengthFit(a.height, Number(best.row.values.length)) : null;
    return best;
  }

  const average = () => ({ bust: "average", waist: "average", hips: "average" });
  const sizeName = s => LP.label("sizes", s);
  // "size 1" for numbered sizes, "free size" for free size (mid-sentence; lower case only changes English)
  const sizePhrase = s => (/^\d+$/.test(s) ? LP.t("fitSizeN", { n: sizeName(s) }) : sizeName(s).toLowerCase());
  const capital = s => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------- Pieces ---------- */
  function figure() {
    // Simple line figure; it grows taller with height and wider with weight
    const fx = Math.sqrt(bmiOf(answers) / cfg.base.bmi);
    const fy = answers.height / cfg.base.height;
    return '<div class="fit-figure" aria-hidden="true" style="--fx: ' + fx.toFixed(3) + "; --fy: " + fy.toFixed(3) + '">' +
      '<svg viewBox="0 0 60 160" preserveAspectRatio="xMidYMax meet">' +
        '<ellipse cx="30" cy="15" rx="9" ry="10.5"/>' +
        '<path d="M21 25c3 4 15 4 18 0l8 10-2 36 7 85H8l7-85-2-36z"/>' +
        '<path d="M13 35l-3 38M47 35l3 38"/>' +
      "</svg></div>";
  }

  function slider(key) {
    const r = cfg[key];
    const t = LP.t;
    const label = t(key === "height" ? "fitHeight" : "fitWeight");
    const unit = t(key === "height" ? "fitCm" : "fitKg");
    const v = answers[key];
    return '<div class="fit-slider">' +
      '<label class="fit-slider__label" for="fit-' + key + '">' + label + "</label>" +
      '<p class="fit-slider__value"><output id="fit-' + key + '-out" for="fit-' + key + '">' + v + "</output> <span>" + unit + "</span></p>" +
      '<div class="fit-slider__row">' +
        '<button class="fit-nudge" type="button" data-fit-nudge="' + key + '" data-step="-1" aria-label="' + label + " · " + t("fitLess") + '">−</button>' +
        '<input class="fit-range" type="range" id="fit-' + key + '" name="' + key + '" min="' + r.min + '" max="' + r.max + '" step="' + r.step + '" value="' + v + '" style="--fill: ' + fill(key) + '%">' +
        '<button class="fit-nudge" type="button" data-fit-nudge="' + key + '" data-step="1" aria-label="' + label + " · " + t("fitMore") + '">+</button>' +
      "</div></div>";
  }

  function fill(key) {
    const r = cfg[key];
    return ((answers[key] - r.min) / (r.max - r.min) * 100).toFixed(1);
  }

  function head() {
    const t = LP.t;
    const img = LP.thumb(LP.imagesFor(product, color)[0]);
    const tabBtn = (id, key) =>
      '<button class="fit-tab" type="button" role="tab" id="fit-tab-' + id + '" aria-controls="fit-view" aria-selected="' + (tab === id) + '" tabindex="' + (tab === id ? 0 : -1) + '" data-fit-tab="' + id + '">' + t(key) + "</button>";
    return '<header class="fit__head">' +
        '<p class="eyebrow" id="fit-title">' + t("sizeGuide") + "</p>" +
        '<button class="icon-btn" type="button" data-fit-close aria-label="' + t("close") + '">' + LP.icons.close + "</button>" +
      "</header>" +
      '<div class="fit__product">' +
        '<img src="' + img + '" alt="" width="600" height="800">' +
        '<div><p class="fit__name">' + LP.esc(product.name[LP.lang]) + '</p><p class="fit__price">' + LP.formatPrice(product.price) + "</p></div>" +
      "</div>" +
      '<div class="fit-tabs" role="tablist" aria-labelledby="fit-title">' + tabBtn("chart", "fitTabChart") + tabBtn("find", "fitTabFind") + "</div>" +
      (tab === "find"
        ? '<div class="fit__progress" aria-hidden="true">' + [1, 2, 3].map(i => "<span" + (i <= step ? ' class="is-on"' : "") + "></span>").join("") + "</div>" +
          '<p class="fit__step">' + t("fitStep", { n: step, total: 3 }) + " · " + t(stepKeys[step - 1]) + "</p>"
        : "");
  }

  /* ---------- Size chart tab ---------- */
  // Line drawing of a long piece showing where each measurement is taken
  function garment() {
    const label = k => LP.esc(LP.tx(LP.content.measureLabels[k]));
    const across = (y, x1, x2, k) =>
      '<line class="fit-garment__mark" x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '"/>' +
      '<text x="' + (x1 + x2) / 2 + '" y="' + (y - 4) + '" text-anchor="middle">' + label(k) + "</text>";
    return '<figure class="fit-garment" aria-hidden="true"><svg viewBox="0 0 220 230">' +
      '<path class="fit-garment__line" d="M78 14c8 8 26 8 34 0l30 12 22 58-16 6-14-34 4 50 14 112H38l14-112 4-50-14 34-16-6 22-58z"/>' +
      across(54, 62, 128, "bust") +
      across(100, 64, 126, "waist") +
      across(140, 58, 132, "hips") +
      '<line class="fit-garment__mark" x1="180" y1="16" x2="180" y2="218"/>' +
      '<text x="186" y="121">' + label("length") + "</text>" +
    "</svg></figure>";
  }

  function chartView() {
    const t = LP.t;
    const c = LP.content;
    const cols = c.sizeChart.columns;
    const rows = rowsFor(product);
    const table = '<div class="table-wrap"><table class="table fit-table"><thead><tr><th scope="col">' + t("sizeColumn") + "</th>" +
        cols.map(k => '<th scope="col">' + LP.tx(c.measureLabels[k]) + "</th>").join("") + "</tr></thead><tbody>" +
        rows.map(r => '<tr><th scope="row">' + sizeName(r.size) + "</th>" +
          cols.map(k => '<td><bdi dir="ltr">' + (r.values[k] ? LP.esc(r.values[k]) : "—") + "</bdi></td>").join("") + "</tr>").join("") +
      "</tbody></table></div>";
    return '<div class="fit__body" id="fit-view" role="tabpanel" aria-labelledby="fit-tab-chart">' +
        '<h2 class="h3">' + t("fitTabChart") + "</h2>" +
        '<p class="fit__lead">' + t("fitChartLead") + "</p>" +
        garment() + table +
        (product.sizes.includes("free") ? '<p class="fit-note fit-note--start"><strong>' + t("freeSizeTitle") + "</strong> " + t("freeSizeText") + "</p>" : "") +
        '<h3 class="fit-subtitle">' + t("fitHowToMeasure") + "</h3>" +
        '<ul class="fit-measures">' + c.howToMeasure.map(m =>
          "<li><strong>" + LP.tx(c.measureLabels[m.key]) + "</strong><span>" + LP.tx(m.text) + "</span></li>").join("") + "</ul>" +
      "</div>" +
      '<footer class="fit__foot"><button class="btn btn--primary btn--block" type="button" data-fit-tab="find">' + LP.icons.ruler + "<span>" + t("fitNotSure") + "</span></button></footer>";
  }

  function stepMeasure() {
    const t = LP.t;
    const live = recommend(product, answers, average(), "regular");
    return '<div class="fit__body" id="fit-view" role="tabpanel" aria-labelledby="fit-tab-find">' +
        '<h2 class="h3">' + t("fitMeasureTitle") + "</h2>" +
        '<p class="fit__lead">' + t("fitMeasureLead") + "</p>" +
        '<div class="fit-measure">' + figure() + '<div class="fit-controls">' + slider("height") + slider("weight") + "</div></div>" +
        '<div class="fit-live"><div><p class="fit-live__label">' + t("fitLive") + '</p><p class="fit-live__hint">' + t("fitLiveHint") + "</p></div>" +
          '<strong id="fit-live" aria-live="polite">' + (live ? sizeName(live.size) : "—") + "</strong></div>" +
      "</div>" +
      '<footer class="fit__foot"><button class="btn btn--primary btn--block" type="button" data-fit-next><span>' + t("fitContinue") + "</span>" + LP.icons.arrow + "</button></footer>";
  }

  function stepShape() {
    const t = LP.t;
    const group = (name, legend, values, keys, current) => '<fieldset class="fit-shape"><legend>' + legend + "</legend>" +
      '<div class="fit-seg">' + values.map(v =>
        '<label><input type="radio" name="' + name + '" value="' + v + '"' + (current === v ? " checked" : "") + "><span>" + t(keys[v]) + "</span></label>").join("") +
      "</div></fieldset>";
    return '<div class="fit__body" id="fit-view" role="tabpanel" aria-labelledby="fit-tab-find">' +
        '<h2 class="h3">' + t("fitShapeTitle") + "</h2>" +
        '<p class="fit__lead">' + t("fitShapeLead") + "</p>" +
        areas.map(k => group("shape-" + k, t(areaKeys[k]), shapes, shapeKeys, answers.shape[k])).join("") +
        '<div class="fit-pref">' + group("pref", t("fitPrefTitle"), prefs, prefKeys, answers.pref) + "</div>" +
      "</div>" +
      '<footer class="fit__foot">' +
        '<button class="btn btn--primary btn--block" type="button" data-fit-next><span>' + t("fitContinue") + "</span>" + LP.icons.arrow + "</button>" +
        '<div class="fit__links"><button class="link" type="button" data-fit-back>' + t("fitBack") + "</button></div>" +
      "</footer>";
  }

  function stepResult() {
    const t = LP.t;
    const r = recommend(product, answers, answers.shape, answers.pref);
    const size = sizePhrase(r.size);
    const snug = r.parts.find(x => x.status === "snug");
    const why = capital(snug ? t("fitWhySnug", { size, area: t(areaKeys[snug.area]).toLowerCase() })
      : r.parts.every(x => x.status === "roomy") ? t("fitWhyRoomy", { size })
      : t("fitWhyRight", { size })) +
      (answers.pref !== "regular" ? " " + t("fitForPref", { pref: t(prefKeys[answers.pref]).toLowerCase() }) : "");
    const statusText = { right: "fitRight", roomy: "fitRoomy", snug: "fitSnug" };
    const lengthText = { right: "fitLengthRight", long: "fitLengthLong", short: "fitLengthShort" };

    const reasons = r.parts.map(x =>
      '<li class="fit-reason">' +
        '<span class="fit-reason__area">' + t(areaKeys[x.area]) + "</span>" +
        '<span class="fit-reason__status"><i class="fit-dot fit-dot--' + x.status + '"></i>' + t(statusText[x.status]) + "</span>" +
        '<span class="fit-bar" aria-hidden="true"><i style="--at: ' + (x.at * 100).toFixed(1) + '%"></i></span>' +
      "</li>").join("") +
      (r.length ? '<li class="fit-reason">' +
        '<span class="fit-reason__area">' + t("fitLength") + "</span>" +
        '<span class="fit-reason__status"><i class="fit-dot fit-dot--' + (r.length === "right" ? "right" : "roomy") + '"></i>' + t(lengthText[r.length]) + "</span>" +
      "</li>" : "");

    const sizes = product.sizes.map(s =>
      '<span class="fit-size' + (s === r.size ? " is-you" : "") + '">' +
        (s === r.size ? '<small>' + t("fitYou") + "</small>" : "") + sizeName(s) +
      "</span>").join("");

    return '<div class="fit__body" id="fit-view" role="tabpanel" aria-labelledby="fit-tab-find">' +
        '<h2 class="h3 fit__center">' + t("fitResultTitle") + "</h2>" +
        '<div class="fit-ring' + (/^\d+$/.test(r.size) ? "" : " fit-ring--word") + '"><strong>' + sizeName(r.size) + "</strong><span>" + t("fitBest") + "</span></div>" +
        '<p class="fit-why">' + why + "</p>" +
        '<ul class="fit-reasons">' + reasons + "</ul>" +
        '<p class="fit-note">' + t("fitNote") + "</p>" +
        '<div class="fit-sizes">' + sizes + "</div>" +
      "</div>" +
      '<footer class="fit__foot">' +
        (product.soldOut ? "" : '<button class="btn btn--primary btn--block" type="button" data-fit-add="' + r.size + '">' + t("fitAdd", { size }) + "</button>") +
        '<div class="fit__links">' +
          '<button class="link" type="button" data-fit-select="' + r.size + '">' + t("fitSelect", { size }) + "</button>" +
          '<button class="link" type="button" data-fit-edit>' + t("fitEdit") + "</button>" +
        "</div>" +
      "</footer>";
  }

  /* ---------- Render + events ---------- */
  function render() {
    if (!dialog || !product) return;
    const body = tab === "chart" ? chartView() : step === 1 ? stepMeasure() : step === 2 ? stepShape() : stepResult();
    dialog.innerHTML = '<div class="fit__panel">' + head() + body + "</div>";
    const scroller = dialog.querySelector(".fit__body");
    if (scroller) scroller.scrollTop = 0;
  }

  function go(n) {
    step = n;
    render();
    const focus = dialog.querySelector(".fit__body h2");
    if (focus) { focus.tabIndex = -1; focus.focus({ preventScroll: true }); }
  }

  // Slider moved: update the number, the bar fill, the figure and the live estimate in place
  function setMeasure(key, value) {
    answers[key] = clamp(value, cfg[key]);
    save();
    const input = dialog.querySelector("#fit-" + key);
    input.value = answers[key];
    input.style.setProperty("--fill", fill(key) + "%");
    dialog.querySelector("#fit-" + key + "-out").textContent = answers[key];
    const fig = dialog.querySelector(".fit-figure");
    fig.style.setProperty("--fx", Math.sqrt(bmiOf(answers) / cfg.base.bmi).toFixed(3));
    fig.style.setProperty("--fy", (answers.height / cfg.base.height).toFixed(3));
    const live = recommend(product, answers, average(), "regular");
    dialog.querySelector("#fit-live").textContent = live ? sizeName(live.size) : "—";
  }

  function build() {
    dialog = document.createElement("dialog");
    dialog.className = "fit";
    dialog.id = "fit";
    dialog.setAttribute("aria-labelledby", "fit-title");
    document.body.appendChild(dialog);

    dialog.addEventListener("input", e => {
      if (e.target.classList.contains("fit-range")) setMeasure(e.target.name, Number(e.target.value));
    });
    dialog.addEventListener("change", e => {
      const m = /^shape-(\w+)$/.exec(e.target.name || "");
      if (m) { answers.shape[m[1]] = e.target.value; save(); }
      if (e.target.name === "pref") { answers.pref = e.target.value; save(); }
    });
    dialog.addEventListener("click", e => {
      if (e.target === dialog || e.target.closest("[data-fit-close]")) { close(); return; }
      const tabBtn = e.target.closest("[data-fit-tab]");
      if (tabBtn) {
        if (tabBtn.dataset.fitTab !== tab) { tab = tabBtn.dataset.fitTab; step = 1; go(1); }
        return;
      }
      const nudge = e.target.closest("[data-fit-nudge]");
      if (nudge) { setMeasure(nudge.dataset.fitNudge, answers[nudge.dataset.fitNudge] + Number(nudge.dataset.step)); return; }
      if (e.target.closest("[data-fit-next]")) { go(step + 1); return; }
      if (e.target.closest("[data-fit-back]")) { go(step - 1); return; }
      if (e.target.closest("[data-fit-edit]")) { go(1); return; }
      const select = e.target.closest("[data-fit-select]");
      if (select) { close(); if (actions.select) actions.select(select.dataset.fitSelect); return; }
      const add = e.target.closest("[data-fit-add]");
      if (add) { close(); if (actions.add) actions.add(add.dataset.fitAdd); }
    });
    // Arrow keys move between the two tabs
    dialog.addEventListener("keydown", e => {
      if (!e.target.matches("[data-fit-tab]") || !["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      tab = tab === "chart" ? "find" : "chart";
      step = 1;
      render();
      dialog.querySelector('[data-fit-tab="' + tab + '"]').focus();
    });
    document.addEventListener("lp:lang", render);
  }

  function close() { if (dialog) LP.closeDialog(dialog); }

  LP.fit = {
    // Can this piece be sized? (needs at least one of its sizes in the chart)
    available: p => rowsFor(p).length > 0,
    // actions: { select(size), add(size) }; startTab: "chart" (size guide) or "find" (size advisor)
    open(p, c, acts, startTab) {
      if (!dialog) build();
      product = p;
      color = c;
      actions = acts || {};
      tab = startTab === "chart" ? "chart" : "find";
      step = 1;
      render();
      LP.openDialog(dialog);
    }
  };
})();
