require(["gitbook"], function (gitbook) {
  var scrollContainer = null;
  var scrollHandler = null;

  function findScrollContainer() {
    var bodyInner = document.querySelector(".body-inner");
    if (bodyInner && bodyInner.scrollHeight > bodyInner.clientHeight) {
      return bodyInner;
    }
    var bookBody = document.querySelector(".book-body");
    if (bookBody && bookBody.scrollHeight > bookBody.clientHeight) {
      return bookBody;
    }
    return window;
  }

  function showToast(msg) {
    var toast = document.querySelector(".reader-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "reader-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(function () {
      toast.classList.remove("show");
    }, 1800);
  }

  function buildToc() {
    // Clean up previous listeners
    if (scrollContainer && scrollHandler) {
      scrollContainer.removeEventListener("scroll", scrollHandler);
      window.removeEventListener("scroll", scrollHandler);
    }

    var existingNavs = document.querySelectorAll(".page-toc-cn");
    existingNavs.forEach(function (el) {
      el.remove();
    });

    var section = document.querySelector(".markdown-section");
    if (!section || section.classList.contains("ccfs-cover-page")) return;

    var headings = Array.from(section.querySelectorAll("h2, h3"));
    headings = headings.filter(function (h) {
      return h.id && h.offsetParent !== null;
    });

    if (headings.length < 2) return;

    var nav = document.createElement("nav");
    nav.className = "page-toc-cn";
    nav.setAttribute("aria-label", "本章目录");

    // Header container with Title & Back to top button
    var header = document.createElement("div");
    header.className = "page-toc-cn__header";

    var title = document.createElement("span");
    title.className = "page-toc-cn__title";
    title.textContent = "本章目录";
    header.appendChild(title);

    var topBtn = document.createElement("button");
    topBtn.type = "button";
    topBtn.className = "page-toc-cn__top-btn";
    topBtn.title = "回到顶部";
    topBtn.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M18 15l-6-6-6 6M12 9v12M4 4h16"></path></svg> 顶部';
    topBtn.addEventListener("click", function () {
      if (scrollContainer && scrollContainer !== window) {
        scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
    header.appendChild(topBtn);
    nav.appendChild(header);

    var list = document.createElement("ul");
    list.className = "page-toc-cn__list";

    var linkMap = [];

    headings.forEach(function (h) {
      var li = document.createElement("li");
      var tag = h.tagName.toLowerCase();
      li.className = "page-toc-cn__item page-toc-cn__item--" + tag;

      var a = document.createElement("a");
      a.href = "#" + h.id;
      a.className = "page-toc-cn__link";
      a.textContent = h.textContent.replace(/^#+\s*/, "").trim();
      a.setAttribute("data-target", h.id);

      a.addEventListener("click", function (e) {
        e.preventDefault();
        var targetEl = document.getElementById(h.id);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
          if (history.pushState) {
            history.pushState(null, null, "#" + h.id);
          }
          setActive(h.id);
        }
      });

      // Quick copy anchor button on hover
      var copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "page-toc-cn__copy-btn";
      copyBtn.title = "复制小节链接";
      copyBtn.innerHTML = '<svg viewBox="0 0 24 24" width="11" height="11"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';
      copyBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var url = window.location.origin + window.location.pathname + "#" + h.id;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () {
            showToast("已复制小节链接");
          });
        }
      });

      li.appendChild(a);
      li.appendChild(copyBtn);
      list.appendChild(li);
      linkMap.push({ heading: h, link: a, item: li, id: h.id });
    });

    nav.appendChild(list);

    // Insert into .page-inner alongside #book-search-results
    var pageInner = document.querySelector(".page-inner");
    if (pageInner) {
      pageInner.appendChild(nav);
    } else {
      section.appendChild(nav);
    }

    function setActive(activeId) {
      linkMap.forEach(function (item) {
        if (item.id === activeId) {
          if (!item.link.classList.contains("is-active")) {
            item.link.classList.add("is-active");
            // Auto-scroll TOC container smoothly so the active item stays in view
            try {
              var navRect = nav.getBoundingClientRect();
              var itemRect = item.item.getBoundingClientRect();
              if (itemRect.top < navRect.top + 40 || itemRect.bottom > navRect.bottom - 40) {
                var offset = item.item.offsetTop - nav.clientHeight / 2 + item.item.clientHeight / 2;
                nav.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
              }
            } catch (err) {}
          }
        } else {
          item.link.classList.remove("is-active");
        }
      });
    }

    var ticking = false;
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          var activeId = null;
          var scrollThreshold = 150;

          // Check if scrolled near the bottom of page
          var isBottom = false;
          if (scrollContainer === window) {
            isBottom = window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 60;
          } else if (scrollContainer) {
            isBottom = scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 60;
          }

          if (isBottom && headings.length > 0) {
            activeId = headings[headings.length - 1].id;
          } else {
            for (var i = 0; i < headings.length; i++) {
              var rect = headings[i].getBoundingClientRect();
              if (rect.top <= scrollThreshold) {
                activeId = headings[i].id;
              } else {
                break;
              }
            }
          }

          if (!activeId && headings.length > 0) {
            activeId = headings[0].id;
          }

          if (activeId) {
            setActive(activeId);
          }
          ticking = false;
        });
        ticking = true;
      }
    }

    scrollHandler = onScroll;
    scrollContainer = findScrollContainer();
    scrollContainer.addEventListener("scroll", scrollHandler, { passive: true });
    window.addEventListener("scroll", scrollHandler, { passive: true });

    // Initial trigger
    setTimeout(onScroll, 100);
  }

  gitbook.events.bind("page.change", buildToc);
});

