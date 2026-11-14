/* =========================================================
   Size help on the product page, one panel with two views:
   • Find my size: height + weight on one screen; her size
     shows right below and follows the numbers as they change
   • Size chart: a drawing of the piece + the measurements
   Model: LP.config.fit (demo numbers) + LP.content.sizeChart.
   Side panel on desktop, bottom sheet on phones.
   ========================================================= */
(function () {
  const cfg = LP.config.fit;
  const areas = ["bust", "waist", "hips"];
  const fields = [
    { key: "height", label: "fitHeight", unit: "fitCm" },
    { key: "weight", label: "fitWeight", unit: "fitKg" }
  ];

  let dialog = null;
  let product = null;
  let actions = {};
  let view = "find";    // "find" | "chart"
  let holding = 0;      // timer while − or + is held down

  // Her numbers are kept in this browser, so the next piece opens with them filled in
  const saved = LP.storage.get(LP.config.storage.fit, {});
  const answers = {
    height: clamp(Number(saved.height) || cfg.height.start, cfg.height),
    weight: clamp(Number(saved.weight) || cfg.weight.start, cfg.weight)
  };

  function clamp(v, r) { return Math.min(r.max, Math.max(r.min, Math.round(v))); }

  /* ---------- Model ---------- */
  // Estimated measurements from height and weight
  function bodyOf(a) {
    const bmi = a.weight / Math.pow(a.height / 100, 2);
    const out = {};
    areas.forEach(k => {
      out[k] = cfg.base[k] + cfg.perBmi[k] * (bmi - cfg.base.bmi) + cfg.perCm[k] * (a.height - cfg.base.height);
    });
    return out;
  }

  // "88–96" → { min: 88, max: 96 }
  function rangeOf(text) {
    const n = String(text).split(/[–-]/).map(Number);
    return { min: n[0], max: n.length > 1 ? n[1] : n[0] };
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

  function lengthFit(height, length) {
    const diff = length - (height - cfg.ankleOffset);
    return diff > cfg.lengthTolerance.long ? "long" : diff < -cfg.lengthTolerance.short ? "short" : "right";
  }

  // Best size: the lowest total penalty across bust, waist and hips.
  // fit: "snug" if any area is over the size's range, "roomy" if all are under it, else "right"
  function recommend(p, a) {
    const body = bodyOf(a);
    const best = rowsFor(p).map(row => ({
      row,
      score: areas.reduce((sum, k) => sum + penalty(body[k], rangeOf(row.values[k])), 0)
    })).sort((x, y) => x.score - y.score)[0];
    const ranges = areas.map(k => ({ value: body[k], r: rangeOf(best.row.values[k]) }));
    const fit = ranges.some(x => x.value > x.r.max) ? "snug" : ranges.every(x => x.value < x.r.min) ? "roomy" : "right";
    const hasLength = cfg.lengthCategories.includes(p.category) && best.row.values.length;
    return { size: best.row.size, fit, length: hasLength ? lengthFit(a.height, Number(best.row.values.length)) : null };
  }

  const isNumber = s => /^\d+$/.test(s);
  const sizeName = s => LP.label("sizes", s);
  // "size 1" for numbered sizes, "free size" for free size (mid-sentence; lower case only changes English)
  const sizePhrase = s => (isNumber(s) ? LP.t("fitSizeN", { n: sizeName(s) }) : sizeName(s).toLowerCase());

  /* ---------- Find my size ---------- */
  function stepper(f) {
    const t = LP.t;
    const label = t(f.label);
    const nudge = (by, key, sign) =>
      '<button type="button" data-fit-nudge="' + f.key + '" data-step="' + by + '" aria-label="' + label + " · " + t(key) + '">' + sign + "</button>";
    return '<div class="fit-field">' +
      '<label class="fit-field__label" for="fit-' + f.key + '">' + label + "</label>" +
      '<div class="fit-stepper">' +
        nudge(-cfg[f.key].step, "fitLess", "−") +
        '<label class="fit-stepper__value">' +
          '<input id="fit-' + f.key + '" name="' + f.key + '" type="text" inputmode="numeric" autocomplete="off" maxlength="3" value="' + answers[f.key] + '">' +
          "<span>" + t(f.unit) + "</span>" +
        "</label>" +
        nudge(cfg[f.key].step, "fitMore", "+") +
      "</div></div>";
  }

  // One line under the size: how it sits, plus the length when the piece is long and it is off
  function noteFor(r) {
    const t = LP.t;
    const main = r.fit === "snug" ? t("fitNoteSnug") : r.fit === "roomy" ? t("fitNoteRoomy") : r.length === "right" ? t("fitNoteRightLength") : t("fitNoteRight");
    const length = r.length === "long" ? t("fitLengthLong") : r.length === "short" ? t("fitLengthShort") : "";
    return main + (length ? " " + length : "");
  }

  // Numbered sizes also show big in a tile; a size that is a word ("free size") is in the title already
  function result(r) {
    return (isNumber(r.size) ? '<strong class="fit-result__size" aria-hidden="true">' + sizeName(r.size) + "</strong>" : "") +
      '<p><span class="fit-result__title">' + LP.t("fitYourSize", { size: sizeName(r.size) }) + "</span>" +
      '<span class="fit-result__note">' + noteFor(r) + "</span></p>";
  }

  function findView() {
    const t = LP.t;
    const r = recommend(product, answers);
    return '<div class="fit__body">' +
        '<p class="fit__lead">' + t("fitLead") + "</p>" +
        '<div class="fit-fields">' + fields.map(stepper).join("") + "</div>" +
        '<div class="fit-result" id="fit-result" data-size="' + r.size + '" aria-live="polite">' + result(r) + "</div>" +
        (product.soldOut ? "" : '<button class="btn btn--primary btn--block" type="button" data-fit-add="' + r.size + '">' + t("fitAdd", { size: sizePhrase(r.size) }) + "</button>") +
        '<button class="link fit__switch" type="button" data-fit-view="chart">' + t("sizeGuide") + "</button>" +
      "</div>";
  }

  // A number changed: update the size, its note and the button in place
  function refresh() {
    const r = recommend(product, answers);
    const box = dialog.querySelector("#fit-result");
    const changed = box.dataset.size !== r.size;
    box.innerHTML = result(r);
    box.dataset.size = r.size;
    if (changed) {   // a different size eases in (restart the animation if one is still running)
      box.classList.remove("is-new");
      void box.offsetWidth;
      box.classList.add("is-new");
    }
    const add = dialog.querySelector("[data-fit-add]");
    if (!add) return;
    add.dataset.fitAdd = r.size;
    add.textContent = LP.t("fitAdd", { size: sizePhrase(r.size) });
  }

  function setMeasure(key, value) {
    answers[key] = clamp(value, cfg[key]);
    LP.storage.set(LP.config.storage.fit, answers);
    dialog.querySelector("#fit-" + key).value = answers[key];
    refresh();
  }

  // What she typed, as a number (Arabic and Persian digits count too); NaN if it is not one
  function typed(input) {
    const text = input.value.replace(/[٠-٩۰-۹]/g, d => d.charCodeAt(0) & 15);
    return /^\d+$/.test(text) ? Number(text) : NaN;
  }

  // Pressing − or + steps once; holding it keeps stepping
  function hold(btn) {
    const key = btn.dataset.fitNudge;
    const by = Number(btn.dataset.step);
    const tick = () => setMeasure(key, answers[key] + by);
    release();
    tick();
    holding = setTimeout(function again() {
      tick();
      holding = setTimeout(again, cfg.hold.every);
    }, cfg.hold.delay);
  }
  function release() { clearTimeout(holding); }

  /* ---------- Size chart ---------- */
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
    const table = '<div class="table-wrap"><table class="table fit-table"><thead><tr><th scope="col">' + t("sizeColumn") + "</th>" +
        cols.map(k => '<th scope="col">' + LP.tx(c.measureLabels[k]) + "</th>").join("") + "</tr></thead><tbody>" +
        rowsFor(product).map(r => '<tr><th scope="row">' + sizeName(r.size) + "</th>" +
          cols.map(k => '<td><bdi dir="ltr">' + (r.values[k] ? LP.esc(r.values[k]) : "—") + "</bdi></td>").join("") + "</tr>").join("") +
      "</tbody></table></div>";
    return '<div class="fit__body">' +
        '<p class="fit__lead">' + t("fitChartLead") + "</p>" +
        garment() + table +
        (product.sizes.includes("free") ? '<p class="fit-note"><strong>' + t("freeSizeTitle") + "</strong> " + t("freeSizeText") + "</p>" : "") +
        '<h3 class="fit-subtitle">' + t("fitHowToMeasure") + "</h3>" +
        '<ul class="fit-measures">' + c.howToMeasure.map(m =>
          "<li><strong>" + LP.tx(c.measureLabels[m.key]) + "</strong><span>" + LP.tx(m.text) + "</span></li>").join("") + "</ul>" +
      "</div>" +
      '<footer class="fit__foot"><button class="btn btn--primary btn--block" type="button" data-fit-view="find">' + LP.icons.ruler + "<span>" + t("fitNotSure") + "</span></button></footer>";
  }

  /* ---------- Render + events ---------- */
  function render() {
    if (!dialog || !product) return;
    const t = LP.t;
    dialog.innerHTML = '<div class="fit__panel">' +
      '<header class="fit__head">' +
        '<h2 class="fit__title" id="fit-title" tabindex="-1">' + t(view === "chart" ? "sizeGuide" : "fitOpen") + "</h2>" +
        '<button class="icon-btn" type="button" data-fit-close aria-label="' + t("close") + '">' + LP.icons.close + "</button>" +
      "</header>" +
      (view === "chart" ? chartView() : findView()) + "</div>";
  }

  function build() {
    dialog = document.createElement("dialog");
    dialog.className = "fit";
    dialog.id = "fit";
    dialog.setAttribute("aria-labelledby", "fit-title");
    document.body.appendChild(dialog);

    // Typing a number: the size follows while it is in range; leaving the field tidies it up
    dialog.addEventListener("input", e => {
      const r = cfg[e.target.name];
      const n = typed(e.target);
      if (!r || !(n >= r.min && n <= r.max)) return;
      answers[e.target.name] = n;
      LP.storage.set(LP.config.storage.fit, answers);
      refresh();
    });
    dialog.addEventListener("change", e => {
      if (cfg[e.target.name]) setMeasure(e.target.name, typed(e.target) || answers[e.target.name]);
    });

    dialog.addEventListener("pointerdown", e => {
      const nudge = e.target.closest("[data-fit-nudge]");
      if (nudge && e.button === 0) hold(nudge);
    });
    ["pointerup", "pointercancel"].forEach(type => addEventListener(type, release));
    dialog.addEventListener("close", release);

    dialog.addEventListener("click", e => {
      if (e.target === dialog || e.target.closest("[data-fit-close]")) { close(); return; }
      // A pointer press already stepped (above); this is − or + from the keyboard
      const nudge = e.target.closest("[data-fit-nudge]");
      if (nudge) { if (!e.detail) setMeasure(nudge.dataset.fitNudge, answers[nudge.dataset.fitNudge] + Number(nudge.dataset.step)); return; }
      const to = e.target.closest("[data-fit-view]");
      if (to) {
        view = to.dataset.fitView;
        LP.swap(() => {
          render();
          dialog.querySelector("#fit-title").focus({ preventScroll: true });
        });
        return;
      }
      const add = e.target.closest("[data-fit-add]");
      if (add) { close(); if (actions.add) actions.add(add.dataset.fitAdd); }
    });
    document.addEventListener("lp:lang", render);
  }

  function close() { if (dialog) LP.closeDialog(dialog); }

  LP.fit = {
    // Can this piece be sized? (needs at least one of its sizes in the chart)
    available: p => rowsFor(p).length > 0,
    // actions: { add(size) }; startView: "find" (the default) or "chart"
    open(p, acts, startView) {
      if (!dialog) build();
      product = p;
      actions = acts || {};
      view = startView === "chart" ? "chart" : "find";
      render();
      LP.openDialog(dialog);
    }
  };
})();
