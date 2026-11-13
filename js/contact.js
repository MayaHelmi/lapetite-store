/* =========================================================
   Contact page: Instagram (and WhatsApp when a number is set
   in config.js), plus a shortcut to order tracking
   ========================================================= */
LP.page = {
  id: "contact",
  render() {
    LP.applyStaticText();
    const t = LP.t;
    const cfg = LP.config;
    const card = (icon, title, text, href, label, external) =>
      '<div class="info-card">' + icon + '<h2 class="h3">' + title + "</h2><p>" + text + "</p>" +
        '<a class="btn btn--secondary" href="' + href + '"' + (external ? ' target="_blank" rel="noopener"' : "") + ">" + label + "</a></div>";
    const cards = [card(LP.icons.instagram, t("contactInstagram"), t("contactInstagramText"), cfg.instagramDm, LP.handle(), true)];
    if (cfg.whatsapp) cards.push(card(LP.icons.whatsapp, t("contactWhatsapp"), t("contactWhatsappText"), "https://wa.me/" + cfg.whatsapp, '<span dir="ltr">+' + cfg.whatsapp + "</span>", true));
    cards.push(card(LP.icons.truck, t("contactTrackTitle"), t("contactTrackText"), "track.html", t("navTrack")));
    document.getElementById("contact-cards").innerHTML = cards.join("");
  }
};
