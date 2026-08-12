require(["gitbook"], function (gitbook) {
  var ORIGINAL = "https://claude-code-from-source.com/";

  function enhanceSearch() {
    var inputWrap = document.getElementById("book-search-input");
    if (!inputWrap) return;

    var input = inputWrap.querySelector("input");
    if (input) {
      input.setAttribute("placeholder", "搜索本章术语、标题…");
      input.setAttribute("aria-label", "搜索");
    }

    if (!document.querySelector(".search-cn-hint")) {
      var hint = document.createElement("div");
      hint.className = "search-cn-hint";
      hint.innerHTML =
        "中文建议用完整词搜索，例如「粘性锁存器」「查询循环」。也可" +
        '<a href="' +
        ORIGINAL +
        '" target="_blank" rel="noopener noreferrer">在原站搜索</a>。';
      inputWrap.parentNode.insertBefore(hint, inputWrap.nextSibling);
    }
  }

  gitbook.events.bind("start", enhanceSearch);
  gitbook.events.bind("page.change", enhanceSearch);
});
