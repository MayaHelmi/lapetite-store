/* =========================================================
   About page — content comes from LP.content.about
   ========================================================= */
LP.page = {
  id: "about",
  render() {
    const a = LP.content.about;
    document.title = LP.t("navAbout") + " · " + LP.config.brand;

    document.getElementById("about-hero-media").innerHTML = "<img " + LP.imgAttrs(a.images[0], "split") + ' alt="" width="1200" height="1600" fetchpriority="high">';
    document.getElementById("about-title").textContent = LP.tx(a.title);
    document.getElementById("about-lead").textContent = LP.tx(a.lead);
    // The story: the opening paragraphs in the middle, the last one beside the closing photo
    const paragraphs = a.body.map(p => "<p>" + LP.esc(LP.tx(p)) + "</p>");
    document.getElementById("about-body").innerHTML = paragraphs.slice(0, -1).join("");
    document.getElementById("about-closing").innerHTML = paragraphs.slice(-1).join("");

    document.getElementById("about-gallery").innerHTML = a.gallery
      .map(src => "<img " + LP.imgAttrs(src, "strip") + ' alt="" loading="lazy" decoding="async" width="900" height="1200">').join("");

    document.getElementById("about-second-media").innerHTML = "<img " + LP.imgAttrs(a.images[1], "split") + ' alt="" loading="lazy" decoding="async" width="1200" height="1600">';
  }
};
