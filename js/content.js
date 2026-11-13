/* =========================================================
   Page content — About, FAQ, size guide, collection
   descriptions. Edit text here, not in the pages.
   DEMO CONTENT: the story, policies and measurements below
   are sample values for the mock-up; swap in the real ones.
   ========================================================= */
window.LP = window.LP || {};

// Shop policies: shown on the product page and in the FAQ ({amman} and {others} become the current fees)
const LP_POLICIES = {
  delivery: {
    ar: "التوصيل داخل عمّان {amman} وبياخد ١–٢ يوم عمل، ولباقي المحافظات من {others} وبياخد ٢–٤ أيام عمل. الرسوم بتظهر بالسلة قبل ما تأكدي الطلب.",
    en: "Delivery in Amman is {amman} and takes 1–2 working days; other governorates start from {others} and take 2–4 working days. The fee shows in your bag before you order."
  },
  payment: {
    ar: "الدفع كاش عند الاستلام.",
    en: "You pay in cash when your order arrives."
  },
  exchange: {
    ar: "بتقدري تبدّلي القطعة خلال ٣ أيام من الاستلام، بشرط تكون مش ملبوسة ومعها التاغ. راسلينا ونرتب التبديل معك.",
    en: "You can exchange a piece within 3 days of delivery, as long as it's unworn with its tag. Message us and we'll arrange it."
  }
};

LP.content = {
  policies: LP_POLICIES,

  /* ---------- About ---------- */
  about: {
    title: { ar: "حكاية لا\u00a0بوتيت", en: "The La\u00a0Petite story" },   // \u00a0 keeps the brand name on one line
    lead: {
      ar: "علامة أزياء محتشمة من الأردن، لكل بنت بتحب الأناقة الهادئة والتفاصيل اللي بتفرق.",
      en: "A modest fashion label from Jordan, for women who love quiet elegance and the details that make a difference."
    },
    body: [
      {
        ar: "كل قطعة في لا بوتيت من تصميمنا الخاص. بنختار الخامات بعناية، وبنشتغل على القصّات والتفاصيل لحتى تكون القطعة مريحة وأنيقة بنفس الوقت.",
        en: "Every La Petite piece is our own design. We choose fabrics carefully and work on the cuts and details so each piece is as comfortable as it is elegant."
      },
      {
        ar: "بنطلق كوليكشن لكل موسم: عبايات رمضان المطرزة، قطع العيد، أطقم الصيف الخفيفة، وجاكيتات الشتاء. وكل الصور والفيديوهات من تصويرنا.",
        en: "We release a collection for every season: embroidered Ramadan abayas, Eid pieces, light summer sets and winter jackets. Every photo and video is our own shoot."
      },
      {
        ar: "واهتمامنا ما بيوقف عند التصميم؛ من لحظة ما تطلبي لحد ما توصلك قطعتك مغلّفة بعناية لباب بيتك.",
        en: "Our care doesn't stop at the design: from the moment you order until your piece arrives, carefully wrapped, at your door."
      }
    ],
    images: ["assets/products/white-embroidered-dress-white-7.webp", "assets/brand/bag.webp"],
    gallery: [
      "assets/products/offwhite-geometric-abaya-offwhite-2.webp",
      "assets/products/eid-belted-suit-cream-2.webp",
      "assets/products/linen-set-cream-2.webp",
      "assets/products/navy-embroidered-abaya-navy-2.webp"
    ]
  },

  values: [
    { icon: "spark", title: { ar: "تصاميم حصرية", en: "Exclusive designs" }, text: { ar: "كل قطعة مصممة عندنا وما بتلاقيها بمكان تاني.", en: "Every piece is designed in-house — you won't find it anywhere else." } },
    { icon: "leaf", title: { ar: "خامات مختارة", en: "Chosen fabrics" }, text: { ar: "قماش مريح ومناسب للموسم، من الكتان الصيفي للصوف الشتوي.", en: "Comfortable, seasonal fabrics, from summer linen to winter wool." } },
    { icon: "camera", title: { ar: "من تصويرنا", en: "Our own shoots" }, text: { ar: "اللي بتشوفيه بالصور هو نفس القطعة اللي بتوصلك.", en: "What you see in the photos is exactly the piece you receive." } }
  ],

  /* ---------- FAQ ---------- */
  faq: [
    {
      q: { ar: "كيف بطلب من الموقع؟", en: "How do I order from the site?" },
      a: { ar: "أضيفي القطع للسلة، عبّي معلومات التوصيل، واضغطي «تأكيد الطلب». بتوصلك صفحة فيها رقم طلبك وبتتابعي منها حالته، والدفع عند الاستلام.", en: "Add pieces to your bag, fill in your delivery details and tap “Place order”. You'll get a page with your order number where you can track it — you pay in cash on delivery." }
    },
    {
      q: { ar: "كيف بتابع طلبي؟", en: "How do I track my order?" },
      a: { ar: "افتحي رابط صفحة الطلب اللي وصلك بعد الطلب، أو ادخلي على «تتبعي طلبك» واكتبي رقم الطلب ورقم هاتفك.", en: "Open your order page link, or go to “Track your order” and enter your order number and phone number." }
    },
    {
      id: "delivery",   // the free-delivery offer is added to this answer when it's on
      q: { ar: "قديش التوصيل وقديش بياخد وقت؟", en: "How much is delivery and how long does it take?" },
      a: LP_POLICIES.delivery
    },
    {
      q: { ar: "بقدر أبدّل القطعة؟", en: "Can I exchange a piece?" },
      a: LP_POLICIES.exchange
    },
    {
      q: { ar: "كيف بعرف مقاسي؟", en: "How do I find my size?" },
      a: { ar: "أغلب القطع بمقاس ١ و٢، وفي قطع فري سايز. بصفحة كل قطعة اضغطي «دليل المقاسات» لتشوفي قياساتها، أو «اعرفي مقاسك» وبنقترح عليكي المقاس الأنسب.", en: "Most pieces come in sizes 1 and 2, and some are free size. On each piece's page, tap “Size guide” to see its measurements, or “Find my size” and we'll suggest the best size for you." }
    },
    {
      q: { ar: "بدي لون مش ظاهر بالصور، بقدر أطلبه؟", en: "Can I order a color that isn't shown?" },
      a: { ar: "بعض القطع متوفرة بألوان إضافية. راسلينا واسألي عن اللون اللي بدك إياه.", en: "Some pieces come in extra colors. Message us and ask about the one you want." }
    }
  ],

  /* ---------- Size guide ---------- */
  // Body measurements in cm (length is the garment's length)
  sizeChart: {
    columns: ["bust", "waist", "hips", "length"],
    rows: [
      { size: "1", values: { bust: "88–96", waist: "70–78", hips: "96–104", length: "140" } },
      { size: "2", values: { bust: "96–104", waist: "78–86", hips: "104–112", length: "145" } },
      { size: "free", values: { bust: "88–108", waist: "70–90", hips: "96–116", length: "142" } }
    ]
  },
  measureLabels: {
    bust: { ar: "الصدر", en: "Bust" },
    waist: { ar: "الخصر", en: "Waist" },
    hips: { ar: "الأرداف", en: "Hips" },
    length: { ar: "الطول", en: "Length" }
  },
  howToMeasure: [
    { key: "bust", text: { ar: "قيسي حول أعرض نقطة بالصدر، مع إبقاء الشريط مستوي وغير مشدود.", en: "Measure around the fullest part of your bust, keeping the tape level and not tight." } },
    { key: "waist", text: { ar: "قيسي حول أضيق نقطة بالخصر، عادة فوق السرة بقليل.", en: "Measure around the narrowest part of your waist, usually just above the navel." } },
    { key: "hips", text: { ar: "قيسي حول أعرض نقطة بالأرداف مع ضم القدمين.", en: "Measure around the fullest part of your hips with your feet together." } },
    { key: "length", text: { ar: "طول القطعة من أعلى الكتف لآخر القطعة.", en: "The garment's length from the top of the shoulder to the hem." } }
  ],

  /* ---------- Collection descriptions (home lookbook) ---------- */
  collections: {
    autumn:  { ar: "طبقات ناعمة وألوان دافية لأيام الخريف.", en: "Soft layers and warm tones for autumn days." },
    ramadan: { ar: "عبايات مطرزة بتفاصيل يدوية لرمضان والمناسبات.", en: "Embroidered abayas for Ramadan and special occasions." },
    eid:     { ar: "فساتين وأطقم بقصّات ناعمة لجمعات العيد.", en: "Dresses and sets in soft cuts for Eid gatherings." },
    summer:  { ar: "أقمشة باردة وخفيفة وألوان هادئة لأيام الصيف.", en: "Cool, light fabrics and calm colors for summer." },
    winter:  { ar: "ترانش كوت، جاكيتات ووتر بروف وطبقات صوف.", en: "Trench coats, waterproof jackets and wool layers." }
  }
};
