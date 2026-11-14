/* =========================================================
   Store settings — edit these, not the page code.
   ========================================================= */
window.LP = window.LP || {};

LP.config = {
  brand: "La Petite",
  instagramHandle: "lapetite_byheba",
  instagramUrl: "https://www.instagram.com/lapetite_byheba/",
  instagramDm: "https://ig.me/m/lapetite_byheba",

  // WhatsApp number in international format without "+" or spaces, e.g. "9627XXXXXXXX".
  // Leave empty to hide the WhatsApp option on the contact page.
  whatsapp: "",

  currency: { ar: "د.أ", en: "JOD" },
  priceDecimals: 2,
  defaultLang: "ar",
  // Photo shown at the top of the first-visit language popup
  langPickerImage: "assets/brand/hero.webp",
  pageSize: 12,          // products per page in the shop

  // Image folders
  productImagePath: "assets/products/",
  brandImagePath: "assets/brand/",
  instagramLogo: "instagram.svg",   // Instagram's glyph in its brand gradient (in brandImagePath)
  // Every photo in those folders (products 900px wide, brand 1200px) has a 600px copy in sm/.
  // "sizes" tells the browser how wide each kind of photo shows, so phones load the small copy.
  images: {
    smallDir: "sm/",
    smallWidth: 600,
    productWidth: 900,
    brandWidth: 1200,
    sizes: {
      hero: "(min-width: 768px) 50vw, 100vw",
      card: "(min-width: 1400px) 25vw, (min-width: 768px) 33vw, 50vw",
      tile: "(min-width: 1024px) 33vw, 50vw",
      look: "(min-width: 1100px) 50vw, 60vw",
      instagram: "(min-width: 900px) 20vw, 33vw",
      gallery: "(min-width: 1100px) 55vw, 100vw",
      quick: "(min-width: 768px) 40vw, 100vw",
      split: "(min-width: 900px) 60vw, 100vw",
      strip: "(min-width: 768px) 25vw, 50vw",
      half: "(min-width: 768px) 50vw, 100vw"
    }
  },

  // ---------- Size advisor ("Find my size" on the product page) ----------
  // Demo sizing model: estimates body measurements (cm) from height + weight + shape answers,
  // then compares them with LP.content.sizeChart. Tune the numbers with real fitting data.
  fit: {
    height: { min: 140, max: 190, step: 1, start: 162 },   // cm
    weight: { min: 40, max: 120, step: 1, start: 60 },     // kg
    base: { height: 165, bmi: 22, bust: 90, waist: 72, hips: 98 },
    perBmi: { bust: 2.2, waist: 2.6, hips: 2.0 },          // cm per BMI point
    perCm: { bust: 0.15, waist: 0.1, hips: 0.15 },         // cm per cm of height
    shape: { narrower: -4, average: 0, fuller: 5 },        // cm added for each shape answer
    preference: { fitted: -2, regular: 0, relaxed: 4 },    // cm of ease for "How do you like it to fit?"
    ankleOffset: 25,                                       // a long piece reaches the ankle at height − this
    lengthTolerance: { long: 5, short: 8 },
    lengthCategories: ["abayas", "dresses"]                // pieces where the length matters
  },

  // ---------- Orders ----------
  // Payment: cash on delivery only (no online payment)
  payment: "cod",
  // Delivery fee per governorate, in JD (demo values). Heba can change them in the admin panel.
  deliveryFees: {
    amman: 2, zarqa: 3, irbid: 3, balqa: 3, madaba: 3, mafraq: 3,
    jerash: 3, ajloun: 3, karak: 3, tafilah: 3, maan: 3, aqaba: 3
  },
  // Orders at or above this subtotal (JD) get free delivery; 0 turns the offer off. Editable in the admin panel.
  freeDeliveryOver: 60,
  // Customer reviews: written from the order page once delivered, shown after Heba approves them
  reviews: { maxText: 500 },
  // Tracking steps, in order. "cancelled" sits outside the steps and is set from the admin panel.
  orderSteps: ["review", "confirmed", "preparing", "shipping", "delivered"],
  orderNumberStart: 1001,
  maxQty: 10,

  // ---------- Admin (DEMO) ----------
  // Demo-only passcode for admin.html. The live version puts the admin panel behind a real
  // login on the server (e.g. Cloudflare Access) — a passcode in front-end code is not secure.
  adminDemoPasscode: "lapetite",
  // Admin-uploaded product photos are shrunk to this size before saving
  uploadImage: { width: 600, height: 800, quality: 0.78, maxPerProduct: 4 },

  // Storage keys
  storage: {
    bag: "lp_bag",
    lang: "lp_lang",
    announce: "lp_announce_closed",
    seasonPreview: "lp_season_preview",
    // Demo backend (see js/api.js)
    orders: "lp_orders",
    catalog: "lp_catalog",
    settings: "lp_settings",
    myOrders: "lp_my_orders",
    adminSession: "lp_admin_session",
    demoSeeded: "lp_demo_seeded",
    fit: "lp_fit",
    reviews: "lp_reviews",
    recent: "lp_recent"
  },

  // Effects (times in ms)
  effects: {
    heroInterval: 7000,
    flyDuration: 450,
    revealStagger: 90,
    toastDuration: 4000,   // long enough to tap Undo
    swipeStart: 10,        // px a finger moves before a sheet starts following it
    swipeClose: 0.3,       // drag past this share of a sheet's size to close it…
    swipeFlick: 0.5        // …or flick faster than this (px per ms)
  },

  // Seasonal decor: "auto" uses the dates below, or force "ramadan", "eid" or "none".
  // Preview any time by adding ?season=ramadan or ?season=eid to the address.
  // Dates are approximate — adjust each year to the announced dates.
  season: "auto",
  seasons: [
    { name: "ramadan", from: "2027-02-07", to: "2027-03-08" },
    { name: "eid",     from: "2027-03-09", to: "2027-03-12" },
    { name: "eid",     from: "2027-05-15", to: "2027-05-19" }
  ],

  cities: ["amman", "zarqa", "irbid", "balqa", "madaba", "mafraq", "jerash", "ajloun", "karak", "tafilah", "maan", "aqaba"]
};
