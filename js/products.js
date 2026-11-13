/* =========================================================
   Product catalog — taken from @lapetite_byheba posts.
   PRICES ARE PLACEHOLDERS: replace each `price` with Heba's real price (JOD).
   `images` = number of photos per color in assets/products/,
   named <id>-<color>-<n>.webp
   ========================================================= */
window.LP = window.LP || {};

LP.products = [
  {
    id: "autumn-tracksuit", category: "sets", collection: "autumn", badges: ["new"], price: 32,
    name: { ar: "ترينينغ الخريف", en: "Autumn Tracksuit" },
    desc: { ar: "ترينينغ بقماشة مميزة لأجواء الخريف، بستايل تريندي وعملي.", en: "A tracksuit in a fabric made for autumn days — trendy and easy to wear." },
    colors: ["beige", "black", "olive", "grey"], sizes: ["1", "2"],
    images: { beige: 8, black: 8, olive: 7, grey: 7 }
  },
  {
    id: "belted-jacket", category: "outerwear", collection: "autumn", badges: ["new"], price: 38,
    name: { ar: "جاكيت بحزام خصر", en: "Belted Jacket" },
    desc: { ar: "قطعة الموسم: جاكيت بتفاصيل راقية وحزام يلتف على الخصر.", en: "The standout piece of the season: a refined jacket with a tie waist belt." },
    colors: ["grey", "black", "brown", "burgundy"], sizes: ["1", "2"],
    images: { black: 7, burgundy: 6, grey: 7, brown: 7 }
  },
  {
    id: "autumn-blouse", category: "tops", collection: "autumn", badges: ["new"], price: 22,
    name: { ar: "بلوزة خريفية", en: "Autumn Blouse" },
    desc: { ar: "بألوان خريفية ناعمة، بتنسقيها لإطلالة رسمية أو كاجوال.", en: "Soft autumn tones you can dress up for work or down for weekends." },
    colors: ["cream", "black", "brown", "burgundy"], sizes: ["1", "2"],
    images: { black: 7, cream: 6, burgundy: 5, brown: 8 }
  },
  {
    id: "three-piece-tracksuit", category: "sets", collection: "essentials", badges: [], price: 35,
    name: { ar: "ترينينغ ٣ قطع", en: "Three-Piece Tracksuit" },
    desc: { ar: "ثلاث قطع منفصلة بقماش مريح، بتنسقيهم بأكثر من طريقة حسب ستايلك.", en: "Three separate pieces in a comfortable fabric — mix them any way that suits you." },
    colors: ["black", "burgundy", "olive", "mocha"], sizes: ["1", "2"],
    images: { black: 12, olive: 5, mocha: 3, burgundy: 5 }
  },
  {
    id: "priva-set", category: "sets", collection: "summer", badges: [], price: 34,
    name: { ar: "طقم بريڤا", en: "Priva Set" },
    desc: { ar: "نعومة وأناقة كلاسيكية بقماش ناعم، لإطلالة رسمية أو طلعة صيفية.", en: "Soft and classic, for a formal look or a summer outing." },
    colors: ["beige", "olive"], sizes: ["1", "2"],
    images: { beige: 6, olive: 5 }
  },
  {
    id: "summer-shirt", category: "tops", collection: "summer", badges: [], price: 18,
    name: { ar: "قميص صيفي", en: "Summer Shirt" },
    desc: { ar: "تفاصيل ناعمة بألوان أساسية بتحتاجيها بخزانتك لتنسيق سهل كل يوم.", en: "Soft details in the core colors every wardrobe needs, for easy everyday styling." },
    colors: ["white", "beige", "skyblue"], sizes: ["1", "2"],
    images: { white: 5, beige: 6, skyblue: 5 }
  },
  {
    id: "cream-cape-set", category: "sets", collection: "summer", badges: ["exclusive"], price: 42,
    name: { ar: "طقم الكيب الكريمي", en: "Cream Cape Set" },
    desc: { ar: "تصميمنا الحصري: قطعة خارجية بقماشة فخمة مع بلوزة منفصلة.", en: "Our exclusive design: a luxe outer layer paired with a separate blouse." },
    colors: ["cream"], sizes: ["1", "2"],
    images: { cream: 5 }
  },
  {
    id: "belted-two-piece", category: "sets", collection: "summer", badges: [], price: 36,
    name: { ar: "طقم قطعتين مع بيلت", en: "Belted Two-Piece" },
    desc: { ar: "طقم من قطعتين مع حزام. القميص الأبيض متوفر كمان.", en: "Two pieces with a belt. The white shirt is available too." },
    colors: ["olive"], sizes: ["1", "2"],
    images: { olive: 5 }
  },
  {
    id: "cape-blouse", category: "tops", collection: "summer", badges: [], price: 26,
    name: { ar: "بلوزة كيب", en: "Cape Blouse" },
    desc: { ar: "قطعة انسيابية بتنحط على الجينز أو البنطلون الواسع.", en: "A flowing cape top that works over jeans or wide trousers." },
    colors: ["black", "white"], sizes: ["1", "2"],
    images: { black: 5, white: 6 }
  },
  {
    id: "denim-vest", category: "vests", collection: "summer", badges: [], price: 24,
    name: { ar: "فيست جينز", en: "Denim Vest" },
    desc: { ar: "القطعة اللي بتكمل صيفك، مع حزام على الخصر.", en: "The belted piece that finishes a summer outfit." },
    colors: ["denim"], sizes: ["free"],
    images: { denim: 12 }
  },
  {
    id: "summer-wrap-set", category: "sets", collection: "summer", badges: [], price: 34,
    name: { ar: "طقم الصيف الكريمي", en: "Cream Summer Set" },
    desc: { ar: "طقم صيفي خفيف بلون كريمي ناعم.", en: "A light summer set in soft cream." },
    colors: ["cream"], sizes: ["1", "2"],
    images: { cream: 5 }
  },
  {
    id: "navy-belted-set", category: "sets", collection: "summer", badges: [], price: 34,
    name: { ar: "طقم كحلي بحزام", en: "Navy Belted Set" },
    desc: { ar: "طقم صيفي رايق بحزام على الخصر.", en: "An easy summer set with a waist tie." },
    colors: ["navy"], sizes: ["1", "2"],
    images: { navy: 5 }
  },
  {
    id: "eid-belted-suit", category: "sets", collection: "eid", badges: [], price: 45,
    name: { ar: "طقم جوخ بحزام جلد", en: "Wool Suit with Leather Belt" },
    desc: { ar: "جاكيت وبنطلون من قماش الجوخ مع حزام جلد مميز.", en: "Jacket and trousers in wool cloth with a statement leather belt." },
    colors: ["cream"], sizes: ["1", "2"],
    images: { cream: 4 }
  },
  {
    id: "drape-dress", category: "dresses", collection: "eid", badges: [], price: 39,
    name: { ar: "فستان الدرابيه", en: "Draped Dress" },
    desc: { ar: "تصميم هادئ بقصّة واسعة ومريحة مع درابيه جانبي ناعم.", en: "A calm design with a relaxed wide cut and soft side draping." },
    colors: ["pink", "navy"], sizes: ["1", "2"],
    images: { navy: 5, pink: 5 }
  },
  {
    id: "black-embroidered-abaya", category: "abayas", collection: "ramadan", badges: [], price: 55,
    name: { ar: "عباية سوداء مطرزة", en: "Black Embroidered Abaya" },
    desc: { ar: "قصّة واسعة وانسيابية مع تطريز فاخر يغطي الظهر بأسلوب ملكي.", en: "A wide, flowing cut with rich embroidery across the back." },
    colors: ["black"], sizes: ["free"],
    images: { black: 5 }
  },
  {
    id: "navy-embroidered-abaya", category: "abayas", collection: "ramadan", badges: [], price: 52,
    name: { ar: "عباية كحلي مطرزة", en: "Navy Embroidered Abaya" },
    desc: { ar: "تطريز دقيق على الأمام والأكمام يضيف عمق وأناقة هادئة.", en: "Fine embroidery on the front and sleeves for quiet, confident elegance." },
    colors: ["navy"], sizes: ["free"],
    images: { navy: 5 }
  },
  {
    id: "offwhite-geometric-abaya", category: "abayas", collection: "ramadan", badges: [], price: 52,
    name: { ar: "عباية أوف وايت بتطريز هندسي", en: "Off-White Geometric Abaya" },
    desc: { ar: "تطريز هندسي ذهبي وأسود على الأكمام والطرف الأمامي، لرمضان والمناسبات.", en: "Gold and black geometric embroidery on the sleeves and front — for Ramadan and occasions." },
    colors: ["offwhite"], sizes: ["free"],
    images: { offwhite: 5 }
  },
  {
    id: "olive-abaya", category: "abayas", collection: "ramadan", badges: [], price: 50,
    name: { ar: "عباية زيتي بتفاصيل بيج", en: "Olive Abaya with Beige Details" },
    desc: { ar: "أناقة هادئة بتفاصيل مستوحاة من الأصالة.", en: "Calm elegance with heritage-inspired details." },
    colors: ["olive"], sizes: ["free"],
    images: { olive: 6 }
  },
  {
    id: "waterproof-jacket", category: "outerwear", collection: "winter", badges: [], price: 40,
    name: { ar: "جاكيت ووتر بروف", en: "Waterproof Jacket" },
    desc: { ar: "جاكيت شتوي مقاوم للماء.", en: "A winter jacket that keeps the rain out." },
    colors: ["black", "brown", "lightbeige"], sizes: ["1", "2"],
    images: { black: 4, brown: 3, lightbeige: 2 }
  },
  {
    id: "wool-collar-blouse", category: "tops", collection: "winter", badges: [], price: 24,
    name: { ar: "بلوزة صوف مع قبة قميص", en: "Wool Blouse with Shirt Collar" },
    desc: { ar: "بلوزة صوف مع قبة قميص مفصولة.", en: "A wool knit with a separate shirt collar." },
    colors: ["black", "beige"], sizes: ["1", "2"],
    images: { black: 4, beige: 3 }
  },
  {
    id: "trench-coat", category: "outerwear", collection: "winter", badges: [], price: 48,
    name: { ar: "ترانش كوت", en: "Trench Coat" },
    desc: { ar: "ترانش كوت كلاسيكي. الهاينيك الصوف الأبيض متوفر كمان.", en: "A classic trench. The white wool high-neck is available too." },
    colors: ["beige", "black"], sizes: ["1", "2"],
    images: { black: 4, beige: 4 }
  },
  {
    id: "wool-vest-shirt", category: "vests", collection: "winter", badges: [], price: 30,
    name: { ar: "فيست صوف مع قميص", en: "Wool Vest & Shirt" },
    desc: { ar: "فيست صوف رمادي فري سايز مع قميص أبيض بمقاس ١ و٢.", en: "A grey knit vest (free size) with a white shirt in sizes 1 and 2." },
    colors: ["grey"], sizes: ["1", "2"],
    images: { grey: 5 }
  },
  {
    id: "waterproof-vest", category: "vests", collection: "winter", badges: [], price: 28,
    name: { ar: "فيست ووتر بروف", en: "Waterproof Vest" },
    desc: { ar: "فيست شتوي مقاوم للماء.", en: "A water-resistant winter vest." },
    colors: ["black", "beige"], sizes: ["1", "2"],
    images: { black: 3, beige: 3 }
  },
  {
    id: "olive-summer-set", category: "sets", collection: "summer", badges: [], price: 34,
    name: { ar: "طقم صيفي زيتوني", en: "Olive Summer Set" },
    desc: { ar: "فيست وبنطلون بقماش بارد وناعم.", en: "Vest and trousers in a cool, soft fabric." },
    colors: ["olive"], sizes: ["1", "2"],
    images: { olive: 5 }
  },
  {
    id: "linen-set", category: "sets", collection: "summer", badges: [], price: 36,
    name: { ar: "طقم كتان", en: "Linen Set" },
    desc: { ar: "قماش الكتان الصيفي بتفاصيل مميزة على أطراف الأكمام والبنطلون.", en: "Summer linen with detailing at the cuffs and hems." },
    colors: ["cream"], sizes: ["1", "2"],
    images: { cream: 6 }
  },
  {
    id: "light-summer-set", category: "sets", collection: "summer", badges: [], price: 32,
    name: { ar: "طقم صيفي خفيف", en: "Light Summer Set" },
    desc: { ar: "طقم بارد وخفيف لأيام الصيف.", en: "Cool and light for summer days." },
    colors: ["navy", "pink"], sizes: ["1", "2"],
    images: { navy: 5, pink: 5 }
  },
  {
    id: "bestseller-white-top", category: "tops", collection: "summer", badges: ["bestseller"], price: 26,
    name: { ar: "الموديل الأكثر طلباً", en: "Our Bestseller Top" },
    desc: { ar: "باللون الأبيض بقماش الحبر الناعم.", en: "In white, in a soft crepe fabric." },
    colors: ["white"], sizes: ["free"],
    images: { white: 6 }
  },
  {
    id: "asymmetric-blouse-skirt", category: "sets", collection: "eid", badges: [], price: 38,
    name: { ar: "بلوزة غير متماثلة مع تنورة", en: "Asymmetric Blouse & Skirt" },
    desc: { ar: "بلوزة طويلة من جهة وقصيرة من الأخرى بقماش ناعم بارد، مع تنورة بيج.", en: "A blouse long on one side and short on the other, in a soft cool fabric, with a beige skirt." },
    colors: ["cream"], sizes: ["free"],
    images: { cream: 5 }
  },
  {
    id: "boho-dress", category: "dresses", collection: "eid", badges: [], price: 36,
    name: { ar: "فستان بوهيمي", en: "Boho Dress" },
    desc: { ar: "فستان صيفي بستايل بوهيمي شيك بأكمام طويلة وحزام جلد بني.", en: "A boho-chic summer dress with long sleeves and a slim brown leather belt." },
    colors: ["cream"], sizes: ["free"],
    images: { cream: 6 }
  },
  {
    id: "burgundy-abaya-set", category: "abayas", collection: "eid", badges: [], price: 48,
    name: { ar: "عباية برغندي مع فستان داخلي", en: "Burgundy Abaya Set" },
    desc: { ar: "عباية برغندي بقماش صيفي ناعم مع فستان داخلي أوف وايت وحزام يلتف على الخصر.", en: "A burgundy abaya in soft summer fabric over an off-white inner dress with a wrap belt." },
    colors: ["burgundy"], sizes: ["free"],
    images: { burgundy: 6 }
  },
  {
    id: "white-embroidered-dress", category: "dresses", collection: "eid", badges: [], price: 42,
    name: { ar: "فستان أبيض مطرز", en: "White Embroidered Dress" },
    desc: { ar: "فستان بقماش بارد مع تطريز على الكتف والخصر وحزام من الخلف.", en: "A cool-fabric dress with embroidery at the shoulder and waist and a tie at the back." },
    colors: ["white"], sizes: ["free"],
    images: { white: 7 }
  },
  {
    id: "grey-wide-set", category: "sets", collection: "eid", badges: [], price: 34,
    name: { ar: "طقم رمادي واسع", en: "Grey Wide-Leg Set" },
    desc: { ar: "بلوزة بأكمام واسعة مع بنطلون بقصة عريضة وحزام على الخصر.", en: "A wide-sleeve top and wide-leg trousers with a waist tie." },
    colors: ["grey"], sizes: ["free"],
    images: { grey: 5 }
  },
  {
    id: "pink-summer-dress", category: "dresses", collection: "eid", badges: [], price: 34,
    name: { ar: "فستان صيفي زهري", en: "Pink Summer Dress" },
    desc: { ar: "قماش بارد خفيف مع تنورة أمامية متصلة وحزام على الخصر.", en: "Light cool fabric with an attached front skirt panel and wrap belt." },
    colors: ["pink"], sizes: ["free"],
    images: { pink: 4 }
  },
  {
    id: "brown-set", category: "sets", collection: "eid", badges: [], price: 34,
    name: { ar: "طقم بني", en: "Brown Set" },
    desc: { ar: "قطعة علوية واسعة وطويلة من الخلف مع بنطلون واسع ومريح.", en: "A wide top, longer at the back, with relaxed trousers." },
    colors: ["brown"], sizes: ["free"],
    images: { brown: 5 }
  }
];

/* Home page content — which images and links each section uses */
LP.home = {
  heroImages: [
    "assets/brand/hero.webp",
    "assets/brand/hero-2.webp",
    "assets/brand/cat-dresses.webp",
    "assets/products/belted-jacket-burgundy-1.webp",
    "assets/products/offwhite-geometric-abaya-offwhite-1.webp",
    "assets/products/light-summer-set-pink-1.webp"
  ],
  newCollections: ["autumn", "winter"],
  newCount: 8,
  lookbook: [
    { key: "autumn",  image: "col-autumn.webp" },
    { key: "winter",  image: "col-winter.webp" },
    { key: "ramadan", image: "col-ramadan.webp" },
    { key: "eid",     image: "col-eid.webp" },
    { key: "summer",  image: "col-summer.webp" }
  ],
  categoryTiles: [
    { key: "sets",      image: "cat-sets.webp" },
    { key: "abayas",    image: "cat-abayas.webp" },
    { key: "outerwear", image: "cat-outerwear.webp" },
    { key: "tops",      image: "cat-tops.webp" },
    { key: "dresses",   image: "cat-dresses.webp" },
    { key: "vests",     image: "cat-vests.webp" }
  ],
  instagram: [
    "assets/products/black-embroidered-abaya-black-2.webp",
    "assets/products/autumn-tracksuit-beige-1.webp",
    "assets/products/boho-dress-cream-2.webp",
    "assets/products/belted-jacket-burgundy-1.webp",
    "assets/products/light-summer-set-pink-1.webp",
    "assets/products/trench-coat-black-1.webp"
  ]
};
