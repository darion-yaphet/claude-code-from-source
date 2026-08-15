require(["gitbook"], function (gitbook) {
  // 1. Reading Progress Bar
  var progressBar = null;
  var scrollContainer = null;
  var progressHandler = null;

  function initProgressBar() {
    if (!progressBar) {
      progressBar = document.createElement("div");
      progressBar.className = "reader-progress-bar";
      progressBar.id = "readerProgressBar";
      document.body.appendChild(progressBar);
    }

    if (scrollContainer && progressHandler) {
      scrollContainer.removeEventListener("scroll", progressHandler);
      window.removeEventListener("scroll", progressHandler);
    }

    var bodyInner = document.querySelector(".body-inner");
    var bookBody = document.querySelector(".book-body");

    if (bodyInner && bodyInner.scrollHeight > bodyInner.clientHeight) {
      scrollContainer = bodyInner;
    } else if (bookBody && bookBody.scrollHeight > bookBody.clientHeight) {
      scrollContainer = bookBody;
    } else {
      scrollContainer = window;
    }

    function updateProgress() {
      var scrollTop = 0;
      var scrollHeight = 0;
      var clientHeight = 0;

      if (scrollContainer === window) {
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        scrollHeight = document.documentElement.scrollHeight;
        clientHeight = window.innerHeight;
      } else {
        scrollTop = scrollContainer.scrollTop;
        scrollHeight = scrollContainer.scrollHeight;
        clientHeight = scrollContainer.clientHeight;
      }

      var maxScroll = scrollHeight - clientHeight;
      var percent = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
      percent = Math.min(100, Math.max(0, percent));
      if (progressBar) {
        progressBar.style.width = percent + "%";
      }
    }

    progressHandler = updateProgress;
    scrollContainer.addEventListener("scroll", progressHandler, { passive: true });
    window.addEventListener("scroll", progressHandler, { passive: true });
    updateProgress();
  }

  // 2. Word Count and Reading Time Stats
  function initReadingStats() {
    var section = document.querySelector(".markdown-section");
    if (!section || section.classList.contains("ccfs-cover-page")) return;

    var existing = section.querySelector(".reader-meta-badge");
    if (existing) existing.remove();

    var text = section.innerText || section.textContent || "";
    // Chinese characters count
    var chineseMatches = text.match(/[\u4e00-\u9fa5]/g) || [];
    // English words count
    var englishMatches = text.match(/[a-zA-Z0-9_-]+/g) || [];
    var totalWords = chineseMatches.length + englishMatches.length;

    if (totalWords < 100) return;

    // Average reading speed ~ 350-400 chars/min
    var readingMinutes = Math.max(1, Math.ceil(totalWords / 380));

    var badge = document.createElement("div");
    badge.className = "reader-meta-badge";

    var wordSpan = document.createElement("span");
    wordSpan.className = "reader-meta-item";
    wordSpan.innerHTML =
      '<svg class="reader-meta-icon" viewBox="0 0 24 24" width="14" height="14"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="14 2 14 8 20 8"></polyline><line fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" x1="16" y1="13" x2="8" y2="13"></line><line fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" x1="16" y1="17" x2="8" y2="17"></line></svg> 约 ' +
      totalWords.toLocaleString() +
      " 字";

    var dot = document.createElement("span");
    dot.className = "reader-meta-dot";
    dot.textContent = "·";

    var timeSpan = document.createElement("span");
    timeSpan.className = "reader-meta-item";
    timeSpan.innerHTML =
      '<svg class="reader-meta-icon" viewBox="0 0 24 24" width="14" height="14"><circle fill="none" stroke="currentColor" stroke-width="2" cx="12" cy="12" r="10"></circle><polyline fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="12 6 12 12 16 14"></polyline></svg> 预计阅读 ' +
      readingMinutes +
      " 分钟";

    badge.appendChild(wordSpan);
    badge.appendChild(dot);
    badge.appendChild(timeSpan);

    // Insert after title or quote
    var h1 = section.querySelector("h1");
    if (h1) {
      var nextEl = h1.nextElementSibling;
      if (nextEl && nextEl.tagName.toLowerCase() === "blockquote") {
        section.insertBefore(badge, nextEl.nextElementSibling);
      } else {
        section.insertBefore(badge, nextEl);
      }
    }
  }

  // 3. Bottom Next/Prev Chapter Navigation Cards
  function initChapterCards() {
    var section = document.querySelector(".markdown-section");
    if (!section || section.classList.contains("ccfs-cover-page")) return;

    var existing = section.querySelector(".reader-nav-cards");
    if (existing) existing.remove();

    var prevLink = document.querySelector(".navigation-prev");
    var nextLink = document.querySelector(".navigation-next");

    var prevHref = prevLink ? prevLink.getAttribute("href") : null;
    var nextHref = nextLink ? nextLink.getAttribute("href") : null;

    if (!prevHref && !nextHref) return;

    // Get active item in sidebar for clean title extraction
    var activeChapter = document.querySelector(".book-summary li.chapter.active");
    var allChapters = Array.from(document.querySelectorAll(".book-summary li.chapter a"));

    function getChapterTitle(href) {
      if (!href) return "";
      for (var i = 0; i < allChapters.length; i++) {
        var a = allChapters[i];
        if (a.getAttribute("href") === href || a.href === href) {
          return a.textContent.trim();
        }
      }
      return "";
    }

    var prevTitle = getChapterTitle(prevHref) || (prevLink ? prevLink.getAttribute("aria-label") : "") || "上一章";
    var nextTitle = getChapterTitle(nextHref) || (nextLink ? nextLink.getAttribute("aria-label") : "") || "下一章";

    var container = document.createElement("div");
    container.className = "reader-nav-cards";

    if (prevHref) {
      var prevCard = document.createElement("a");
      prevCard.className = "reader-nav-card reader-nav-card--prev";
      prevCard.href = prevHref;
      prevCard.innerHTML =
        '<div class="reader-nav-card__label">← 上一章</div>' +
        '<div class="reader-nav-card__title">' +
        prevTitle +
        "</div>";
      container.appendChild(prevCard);
    } else {
      var placeholder = document.createElement("div");
      placeholder.className = "reader-nav-card reader-nav-card--placeholder";
      container.appendChild(placeholder);
    }

    if (nextHref) {
      var nextCard = document.createElement("a");
      nextCard.className = "reader-nav-card reader-nav-card--next";
      nextCard.href = nextHref;
      nextCard.innerHTML =
        '<div class="reader-nav-card__label">下一章 →</div>' +
        '<div class="reader-nav-card__title">' +
        nextTitle +
        "</div>";
      container.appendChild(nextCard);
    }

    section.appendChild(container);
  }

  // 4. Image Lightbox Zoom
  var lightbox = null;
  function initLightbox() {
    if (!lightbox) {
      lightbox = document.createElement("div");
      lightbox.className = "reader-lightbox";
      lightbox.innerHTML =
        '<div class="reader-lightbox__backdrop"></div>' +
        '<div class="reader-lightbox__container">' +
        '  <div class="reader-lightbox__content"></div>' +
        '  <div class="reader-lightbox__hint">点击任意处或按 ESC 关闭</div>' +
        '</div>';
      document.body.appendChild(lightbox);

      lightbox.addEventListener("click", function () {
        lightbox.classList.remove("is-open");
      });
    }

    var images = document.querySelectorAll(".markdown-section img:not([alt='封面'])");
    images.forEach(function (img) {
      img.classList.add("reader-zoomable");
      img.onclick = function (e) {
        e.stopPropagation();
        var content = lightbox.querySelector(".reader-lightbox__content");
        content.innerHTML = '<img src="' + img.src + '" alt="' + (img.alt || "") + '" />';
        lightbox.classList.add("is-open");
      };
    });
  }

  // 5. Search Bar Shortcut Badge
  function initSearchBadge() {
    var searchContainer = document.querySelector("#book-search-input");
    if (!searchContainer || searchContainer.querySelector(".reader-search-shortcut")) return;

    var isMac = typeof navigator !== "undefined" && /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
    var shortcutText = isMac ? "⌘K" : "Ctrl+K";

    var badge = document.createElement("span");
    badge.className = "reader-search-shortcut";
    badge.textContent = shortcutText;
    badge.title = "按 " + shortcutText + " 或 / 快速搜索";
    badge.addEventListener("click", function () {
      var input = searchContainer.querySelector("input");
      if (input) {
        input.focus();
        input.select();
      }
    });

    searchContainer.appendChild(badge);
  }

  // 6. Shortcuts Cheatsheet Modal
  var shortcutModal = null;
  function initShortcutModal() {
    if (!shortcutModal) {
      shortcutModal = document.createElement("div");
      shortcutModal.className = "reader-shortcut-modal";

      var isMac = typeof navigator !== "undefined" && /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
      var modKey = isMac ? "⌘" : "Ctrl";

      shortcutModal.innerHTML =
        '<div class="reader-shortcut-modal__backdrop"></div>' +
        '<div class="reader-shortcut-modal__dialog">' +
        '  <div class="reader-shortcut-modal__header">' +
        '    <h3 class="reader-shortcut-modal__title">键盘快捷键指南</h3>' +
        '    <button type="button" class="reader-shortcut-modal__close" title="关闭 (Esc)">×</button>' +
        "  </div>" +
        '  <div class="reader-shortcut-modal__body">' +
        '    <div class="reader-shortcut-row">' +
        '      <span class="reader-shortcut-desc">全局搜索</span>' +
        '      <span class="reader-shortcut-keys"><kbd>' +
        modKey +
        "</kbd> + <kbd>K</kbd> 或 <kbd>/</kbd></span>" +
        "    </div>" +
        '    <div class="reader-shortcut-row">' +
        '      <span class="reader-shortcut-desc">上一章 / 下一章</span>' +
        '      <span class="reader-shortcut-keys"><kbd>←</kbd> / <kbd>→</kbd></span>' +
        "    </div>" +
        '    <div class="reader-shortcut-row">' +
        '      <span class="reader-shortcut-desc">切换深色 / 浅色模式</span>' +
        '      <span class="reader-shortcut-keys"><kbd>T</kbd></span>' +
        "    </div>" +
        '    <div class="reader-shortcut-row">' +
        '      <span class="reader-shortcut-desc">展开 / 收起侧边栏</span>' +
        '      <span class="reader-shortcut-keys"><kbd>S</kbd></span>' +
        "    </div>" +
        '    <div class="reader-shortcut-row">' +
        '      <span class="reader-shortcut-desc">快捷键帮助面板</span>' +
        '      <span class="reader-shortcut-keys"><kbd>?</kbd></span>' +
        "    </div>" +
        '    <div class="reader-shortcut-row">' +
        '      <span class="reader-shortcut-desc">退出 / 关闭当前浮层</span>' +
        '      <span class="reader-shortcut-keys"><kbd>Esc</kbd></span>' +
        "    </div>" +
        "  </div>" +
        "</div>";

      document.body.appendChild(shortcutModal);

      shortcutModal.addEventListener("click", function (e) {
        if (
          e.target.classList.contains("reader-shortcut-modal__backdrop") ||
          e.target.classList.contains("reader-shortcut-modal__close")
        ) {
          shortcutModal.classList.remove("is-open");
        }
      });
    }
  }

  function toggleShortcutModal() {
    initShortcutModal();
    if (shortcutModal) {
      shortcutModal.classList.toggle("is-open");
    }
  }

  // 7. Global Keyboard Shortcuts Listener
  function initKeyboardShortcuts() {
    window.removeEventListener("keydown", handleKeydown);
    function handleKeydown(e) {
      // Ignore if user is typing in an input or textarea
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) {
        if (e.key === "Escape") {
          e.target.blur();
        }
        return;
      }

      if (e.key === "Escape") {
        if (shortcutModal && shortcutModal.classList.contains("is-open")) {
          shortcutModal.classList.remove("is-open");
          return;
        }
        if (lightbox && lightbox.classList.contains("is-open")) {
          lightbox.classList.remove("is-open");
          return;
        }
        return;
      }

      // Cmd+K or Ctrl+K or / to search
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault();
        var searchInput = document.querySelector("#book-search-input input");
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // Shift + / or ? to open cheatsheet
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        toggleShortcutModal();
        return;
      }

      // T to toggle theme
      if (e.key === "t" || e.key === "T") {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          var themeBtn = document.querySelector(".ccfs-theme-toggle");
          if (themeBtn) {
            themeBtn.click();
          }
          return;
        }
      }

      // S to toggle sidebar
      if (e.key === "s" || e.key === "S") {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          var sidebarBtn = document.querySelector(".btn.pull-left.js-toolbar-action, a[data-toggle='summary']");
          if (sidebarBtn) {
            sidebarBtn.click();
          }
          return;
        }
      }

      // ArrowLeft / ArrowRight for previous/next page navigation
      if (e.key === "ArrowLeft" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        var prevLink = document.querySelector(".navigation-prev");
        if (prevLink && prevLink.href) {
          window.location.href = prevLink.href;
        }
      } else if (e.key === "ArrowRight" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        var nextLink = document.querySelector(".navigation-next");
        if (nextLink && nextLink.href) {
          window.location.href = nextLink.href;
        }
      }
    }
    window.addEventListener("keydown", handleKeydown);
  }

  // 8. Code Block Badges
  function initCodeBadges() {
    var pres = document.querySelectorAll(".markdown-section pre");
    pres.forEach(function (pre) {
      if (pre.querySelector(".reader-code-lang") || pre.querySelector(".mermaid")) return;

      var code = pre.querySelector("code");
      var lang = "";
      if (code && code.className) {
        var match = code.className.match(/lang-([a-zA-Z0-9_-]+)/);
        if (match) lang = match[1];
      }

      if (!lang && pre.className) {
        var match2 = pre.className.match(/lang-([a-zA-Z0-9_-]+)/);
        if (match2) lang = match2[1];
      }

      if (lang && lang.toLowerCase() !== "mermaid") {
        var displayLang = lang.toUpperCase();
        var map = {
          JAVASCRIPT: "JS",
          TYPESCRIPT: "TS",
          SHELL: "BASH",
          SH: "BASH",
          MARKDOWN: "MD",
          PYTHON: "PY",
          YAML: "YAML",
          YML: "YAML",
        };
        if (map[displayLang]) displayLang = map[displayLang];

        var badge = document.createElement("span");
        badge.className = "reader-code-lang";
        badge.textContent = displayLang;
        pre.appendChild(badge);
      }
    });
  }

  // 9. Callouts / Blockquotes Enhancement
  function initCallouts() {
    var blockquotes = document.querySelectorAll(".markdown-section blockquote");
    blockquotes.forEach(function (bq) {
      if (bq.classList.contains("reader-callout-processed")) return;
      bq.classList.add("reader-callout-processed");

      var text = bq.innerHTML || "";
      if (/\[!(NOTE|INFO)\]/i.test(text)) {
        bq.classList.add("reader-callout", "reader-callout--note");
        bq.innerHTML = text.replace(/\[!(NOTE|INFO)\]\s*<br\s*\/?>?/i, "").replace(/\[!(NOTE|INFO)\]/i, "").trim();
      } else if (/\[!TIP\]/i.test(text)) {
        bq.classList.add("reader-callout", "reader-callout--tip");
        bq.innerHTML = text.replace(/\[!TIP\]\s*<br\s*\/?>?/i, "").replace(/\[!TIP\]/i, "").trim();
      } else if (/\[!IMPORTANT\]/i.test(text)) {
        bq.classList.add("reader-callout", "reader-callout--important");
        bq.innerHTML = text.replace(/\[!IMPORTANT\]\s*<br\s*\/?>?/i, "").replace(/\[!IMPORTANT\]/i, "").trim();
      } else if (/\[!WARNING\]/i.test(text)) {
        bq.classList.add("reader-callout", "reader-callout--warning");
        bq.innerHTML = text.replace(/\[!WARNING\]\s*<br\s*\/?>?/i, "").replace(/\[!WARNING\]/i, "").trim();
      } else if (/\[!CAUTION\]/i.test(text)) {
        bq.classList.add("reader-callout", "reader-callout--caution");
        bq.innerHTML = text.replace(/\[!CAUTION\]\s*<br\s*\/?>?/i, "").replace(/\[!CAUTION\]/i, "").trim();
      } else if (/原文：/i.test(text)) {
        bq.classList.add("reader-callout", "reader-callout--source");
      }
    });
  }

  function enhanceAll() {
    initProgressBar();
    initReadingStats();
    initChapterCards();
    initLightbox();
    initSearchBadge();
    initShortcutModal();
    initKeyboardShortcuts();
    initCodeBadges();
    initCallouts();
  }

  gitbook.events.bind("page.change", enhanceAll);
});
