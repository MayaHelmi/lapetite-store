/* =========================================================
   FAQ — content comes from LP.content
   ========================================================= */
function renderFaq() {
  const list = document.getElementById("faq-list");
  const open = [...list.querySelectorAll("details")].map(d => d.open);
  list.innerHTML = LP.content.faq
    .map((f, i) => {
      const extra = f.id === "delivery" && LP.freeDeliveryText() ? " " + LP.freeDeliveryText() + "." : "";
      return "<details" + ((open.length ? open[i] : i === 0) ? " open" : "") + "><summary>" + LP.esc(LP.tx(f.q)) + '</summary><div class="accordion__body"><p>' + LP.esc(LP.fillFees(LP.tx(f.a)) + extra) + "</p></div></details>";
    })
    .join("");
}

LP.page = {
  id: "help",
  render() {
    LP.applyStaticText();
    renderFaq();
  }
};

// Delivery fees load from the settings after the first render
document.addEventListener("lp:fees", renderFaq);
