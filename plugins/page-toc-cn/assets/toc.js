require(["gitbook"], function (gitbook) {
  function buildToc() {
    var section = document.querySelector(".markdown-section");
    if (!section) return;

    var existing = section.querySelector(".page-toc-cn");
    if (existing) existing.remove();

    var headings = section.querySelectorAll("h2");
    if (headings.length < 4) return;

    var nav = document.createElement("nav");
    nav.className = "page-toc-cn";
    nav.setAttribute("aria-label", "本章目录");

    var title = document.createElement("div");
    title.className = "page-toc-cn__title";
    title.textContent = "本章目录";
    nav.appendChild(title);

    var list = document.createElement("ul");
    headings.forEach(function (h) {
      if (!h.id) return;
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent.replace(/^#+\s*/, "").trim();
      li.appendChild(a);
      list.appendChild(li);
    });

    if (!list.children.length) return;
    nav.appendChild(list);

    // 插在标题、原文引用等引导内容之后，第一个正文 h2 之前
    var firstH2 = headings[0];
    section.insertBefore(nav, firstH2);
  }

  gitbook.events.bind("page.change", buildToc);
});
