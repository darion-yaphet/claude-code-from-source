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

  var SUN_SVG =
    '<svg class="ccfs-theme-icon ccfs-theme-icon--sun" viewBox="0 0 24 24" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="4.2"/>' +
    '<path d="M12 3v1.8M12 19.2V21M4.93 4.93l1.27 1.27M17.8 17.8l1.27 1.27M3 12h1.8M19.2 12H21M4.93 19.07l1.27-1.27M17.8 6.2l1.27-1.27"/>' +
    "</svg>";
  var MOON_SVG =
    '<svg class="ccfs-theme-icon ccfs-theme-icon--moon" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M20.2 14.3A8.2 8.2 0 0 1 9.7 3.8 8.4 8.4 0 1 0 20.2 14.3z"/>' +
    "</svg>";

  function updateToggleIcon(dark) {
    var btn = document.querySelector(".ccfs-theme-toggle");
    if (!btn) return;
    btn.classList.remove("fa", "fa-moon-o", "fa-sun-o", "fa-adjust");
    btn.innerHTML = dark ? SUN_SVG : MOON_SVG;
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

  function markCoverPage() {
    var section = document.querySelector(".markdown-section");
    if (!section) return;
    var isCover = !!section.querySelector('img[alt="封面"]');
    section.classList.toggle("ccfs-cover-page", isCover);
    document.body.classList.toggle("ccfs-cover", isCover);
    if (!isCover) return;

    Array.prototype.forEach.call(section.querySelectorAll(":scope > p"), function (p) {
      if (p.classList.contains("cover-actions")) return;
      if (p.querySelectorAll("a").length < 3) return;
      if (!/PREFACE|前言/.test(p.innerHTML)) return;
      p.className = "cover-actions";
      p.innerHTML = p.innerHTML.replace(/\s*·\s*/g, "");
      Array.prototype.forEach.call(p.querySelectorAll("strong"), function (strong) {
        while (strong.firstChild) strong.parentNode.insertBefore(strong.firstChild, strong);
        strong.parentNode.removeChild(strong);
      });
    });
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
      icon: "fa fa-adjust",
      label: isDark() ? "切换为浅色" : "切换为深色",
      className: "ccfs-theme-toggle",
      position: "right",
      onClick: toggle,
    });

    apply(isDark(), false);
    observeBookTheme();
    markCoverPage();

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
    markCoverPage();
  });
});
