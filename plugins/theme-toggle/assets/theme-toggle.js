require(["gitbook"], function (gitbook) {
  var STORAGE_KEY = "ccfs-color-theme";
  var themeObserver = null;
  var lastDarkClass = null;

  function systemDark() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }

  function savedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function isDark() {
    var saved = savedTheme();
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return systemDark();
  }

  function captureMermaidSources() {
    document.querySelectorAll(".mermaid").forEach(function (el) {
      if (el.getAttribute("data-ccfs-src")) return;
      if (el.querySelector("svg")) return;
      el.setAttribute("data-ccfs-src", el.textContent.trim());
    });
  }

  function patchMermaid() {
    var mermaid = window.mermaid;
    if (!mermaid || mermaid.__ccfsPatched) return;
    mermaid.__ccfsPatched = true;
    var origInit = mermaid.init.bind(mermaid);
    mermaid.init = function () {
      captureMermaidSources();
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark() ? "dark" : "default",
      });
      return origInit.apply(mermaid, arguments);
    };
  }

  function applyMermaid(dark) {
    var mermaid = window.mermaid;
    if (!mermaid) return;

    captureMermaidSources();
    mermaid.initialize({
      startOnLoad: false,
      theme: dark ? "dark" : "default",
    });

    var nodes = document.querySelectorAll(".mermaid");
    if (!nodes.length) return;

    nodes.forEach(function (el) {
      var src = el.getAttribute("data-ccfs-src");
      if (!src) return;
      el.removeAttribute("data-processed");
      el.innerHTML = src;
    });

    try {
      mermaid.init(undefined, nodes);
    } catch (e) {
      /* mermaid may not be ready on first start */
    }
  }

  function updateToggleIcon(dark) {
    var btn = document.querySelector(".ccfs-theme-toggle");
    if (!btn) return;
    btn.classList.remove("fa-moon-o", "fa-sun-o");
    btn.classList.add(dark ? "fa-sun-o" : "fa-moon-o");
    btn.setAttribute("aria-label", dark ? "切换为浅色" : "切换为深色");
    btn.setAttribute("title", dark ? "切换为浅色" : "切换为深色");
  }

  function apply(dark, persist) {
    if (themeObserver) themeObserver.disconnect();
    var root = document.documentElement;

    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
      } catch (e) {}
      root.setAttribute("data-theme", dark ? "dark" : "light");
    } else if (savedTheme() === "dark" || savedTheme() === "light") {
      root.setAttribute("data-theme", savedTheme());
    } else {
      root.removeAttribute("data-theme");
    }

    var book = document.querySelector(".book");
    if (book) {
      book.classList.remove("color-theme-1");
      book.classList.toggle("color-theme-2", dark);
      lastDarkClass = dark;
    }

    updateToggleIcon(dark);
    applyMermaid(dark);
    observeBookTheme();
  }

  function toggle(e) {
    if (e) e.preventDefault();
    apply(!isDark(), true);
  }

  function observeBookTheme() {
    var book = document.querySelector(".book");
    if (!book) return;
    if (themeObserver) themeObserver.disconnect();
    lastDarkClass = book.classList.contains("color-theme-2");
    themeObserver = new MutationObserver(function () {
      var dark = book.classList.contains("color-theme-2");
      if (dark === lastDarkClass) return;
      lastDarkClass = dark;
      apply(dark, true);
    });
    themeObserver.observe(book, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  gitbook.events.bind("start", function () {
    patchMermaid();

    if (gitbook.fontsettings && gitbook.fontsettings.setThemes) {
      gitbook.fontsettings.setThemes([
        { config: "white", text: "浅色", id: 0 },
        { config: "night", text: "深色", id: 2 },
      ]);
    }

    gitbook.toolbar.createButton({
      icon: "fa " + (isDark() ? "fa-sun-o" : "fa-moon-o"),
      label: isDark() ? "切换为浅色" : "切换为深色",
      className: "ccfs-theme-toggle",
      position: "right",
      onClick: toggle,
    });

    apply(isDark(), false);
    observeBookTheme();

    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onChange = function () {
        if (savedTheme()) return;
        apply(systemDark(), false);
      };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  });

  gitbook.events.bind("page.change", function () {
    patchMermaid();
    observeBookTheme();
    updateToggleIcon(isDark());
  });
});
