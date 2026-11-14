/* =========================================================
   Effects: hero crossfade, scroll reveal, seasonal decor. Runs after every page render.
   All effects switch off when the visitor prefers reduced motion.
   ========================================================= */
window.LP = window.LP || {};

LP.effects = {
  init() {
    this.season();
    this.hero();
    this.reveal();
  },

  /* ---------- Hero: each slot crossfades between two photos ---------- */
  hero() {
    clearInterval(this._heroTimer);
    const slots = [...document.querySelectorAll(".hero__slot")];
    if (!slots.length || LP.reducedMotion()) return;
    let tick = 0;
    this._heroTimer = setInterval(() => {
      const slot = slots[tick % slots.length];
      const imgs = slot.querySelectorAll("img");
      if (imgs.length > 1) {
        const active = slot.querySelector("img.is-active");
        const next = active.nextElementSibling || imgs[0];
        // Only fade to a photo that has finished loading
        if (next.complete && next.naturalWidth) {
          next.classList.add("is-active");
          active.classList.remove("is-active");
        }
      }
      tick += 1;
    }, LP.config.effects.heroInterval / slots.length);
  },

  /* ---------- Scroll reveal: photos unfold, text rises ---------- */
  reveal() {
    if (this._observer) this._observer.disconnect();
    const root = document.documentElement;
    if (!("IntersectionObserver" in window) || LP.reducedMotion()) { root.classList.remove("has-reveal"); return; }
    root.classList.add("has-reveal");

    const groups = {
      wipe: ".tile, .brand-about__media, .split__media, .look",
      fade: ".section-head, .points__item, .info-card, .page-hero__inner > *, .gallery-strip img"
    };
    const items = [];
    Object.keys(groups).forEach(kind => {
      document.querySelectorAll(groups[kind]).forEach(el => {
        el.dataset.reveal = kind;
        items.push(el);
      });
    });

    // Stagger siblings so rows appear one after another
    items.forEach(el => {
      const siblings = [...el.parentElement.children].filter(c => c.dataset.reveal);
      const i = siblings.indexOf(el);
      el.style.transitionDelay = Math.min(i, 5) * LP.config.effects.revealStagger + "ms";
    });

    this._observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          this._observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

    items.forEach(el => {
      // Anything already on screen shows right away
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-revealed");
      else this._observer.observe(el);
    });
  },

  /* ---------- Seasonal decor (Ramadan / Eid) ---------- */
  currentSeason() {
    const cfg = LP.config;
    const key = cfg.storage.seasonPreview;
    const param = new URLSearchParams(location.search).get("season");
    if (param) { try { sessionStorage.setItem(key, param); } catch (e) { /* ignore */ } }
    let preview = param;
    if (!preview) { try { preview = sessionStorage.getItem(key); } catch (e) { preview = null; } }
    const pick = preview || cfg.season;
    if (pick === "ramadan" || pick === "eid") return pick;
    if (pick === "none") return "";
    const today = new Date().toISOString().slice(0, 10);
    const hit = cfg.seasons.find(s => today >= s.from && today <= s.to);
    return hit ? hit.name : "";
  },

  season() {
    const season = this.currentSeason();
    const root = document.documentElement;
    if (!season) { delete root.dataset.season; return; }
    root.dataset.season = season;
    const greeting = LP.t(season === "ramadan" ? "seasonRamadan" : "seasonEid");

    const text = document.querySelector(".announce__text");
    if (text && !text.querySelector(".season-greeting")) text.insertAdjacentHTML("afterbegin", '<span class="season-greeting">' + LP.icons.crescent + greeting + "</span>");

    const hero = document.querySelector(".hero");
    if (hero && !hero.querySelector(".lanterns")) {
      const lantern = '<svg class="lantern" viewBox="0 0 34 120" aria-hidden="true">' +
        '<path class="lantern__string" d="M17 0v38"/>' +
        '<path class="lantern__cap" d="M11 44h12l-2-6h-8z"/>' +
        '<path class="lantern__body" d="M9 46h16l3 8v22l-3 8H9l-3-8V54z"/>' +
        '<path class="lantern__lines" d="M17 46v38M6 60h22M6 70h22"/>' +
        '<path class="lantern__cap" d="M12 84h10l-2 6h-6z"/>' +
        '<path class="lantern__string" d="M17 90v6"/></svg>';
      const wrap = document.createElement("div");
      wrap.className = "lanterns";
      wrap.setAttribute("aria-hidden", "true");
      wrap.innerHTML = lantern + lantern.replace('class="lantern"', 'class="lantern lantern--short"') + '<span class="lanterns__spacer"></span>' + lantern.replace('class="lantern"', 'class="lantern lantern--short"') + lantern;
      hero.appendChild(wrap);
      const eyebrow = hero.querySelector(".eyebrow");
      if (eyebrow) eyebrow.textContent = greeting;
    }
  }
};
