/* Harvey Timms portfolio: theme switch, evidence index, photo viewer, present mode, draft view.
   Plain JavaScript, no libraries. Everything here builds on the HTML, so the page still reads
   without it. */
(function () {
  "use strict";
  var root = document.documentElement;
  var $ = function (sel, el) { return (el || document).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };
  function typing(e) {
    var t = e.target;
    return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  }

  /* ---------- Theme ---------- */
  var themeBtn = $("#theme-toggle");
  function currentTheme() {
    var set = root.getAttribute("data-theme");
    if (set === "dark" || set === "light") return set;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function syncTheme() {
    if (!themeBtn) return;
    var t = currentTheme();
    themeBtn.setAttribute("data-mode", t);
    themeBtn.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
  }
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      store.set("ht-theme", next);
      syncTheme();
    });
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.addEventListener) mq.addEventListener("change", syncTheme);
    }
    new MutationObserver(syncTheme).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    syncTheme();
  }

  /* ---------- Draft view: #draft shows the photo slots still to fill ---------- */
  function checkDraft() {
    if (location.hash === "#draft") {
      root.classList.add("draft");
      var n = $$(".want").length;
      var c = $("#want-count");
      if (c) c.textContent = String(n);
    }
  }
  checkDraft();
  window.addEventListener("hashchange", checkDraft);

  /* ---------- Evidence index ---------- */
  var SKILLS = [
    ["lead", "Leading people"],
    ["team", "Teamwork and communication"],
    ["design", "Design and CAD"],
    ["analysis", "Analysis and modelling"],
    ["code", "Code"],
    ["build", "Build and make"],
    ["test", "Test and validate"],
    ["pm", "Project management"],
    ["commercial", "Stakeholders and commercial"]
  ];
  var matrix = $("#matrix");
  var status = $("#matrix-status");
  var sheets = $$(".sheet[data-skills]");
  if (matrix && sheets.length) {
    var rows = sheets.map(function (el) {
      return {
        id: el.id,
        name: el.getAttribute("data-short") || el.id,
        year: el.getAttribute("data-year") || "",
        skills: (el.getAttribute("data-skills") || "").split(/\s+/).filter(Boolean)
      };
    });
    var thead = document.createElement("thead");
    var htr = document.createElement("tr");
    var corner = document.createElement("th");
    corner.scope = "col";
    corner.textContent = "Project or role";
    htr.appendChild(corner);
    SKILLS.forEach(function (s, i) {
      var th = document.createElement("th");
      th.scope = "col";
      var b = document.createElement("button");
      b.type = "button";
      b.className = "skill-btn";
      b.setAttribute("aria-pressed", "false");
      b.setAttribute("data-col", String(i + 1));
      b.setAttribute("data-skill", s[0]);
      var count = rows.filter(function (r) { return r.skills.indexOf(s[0]) > -1; }).length;
      b.innerHTML = "<span></span><span class=\"n\"></span>";
      b.firstChild.textContent = s[1];
      b.lastChild.textContent = String(count);
      b.setAttribute("aria-label", s[1] + ", " + count + (count === 1 ? " item" : " items"));
      th.appendChild(b);
      htr.appendChild(th);
    });
    thead.appendChild(htr);
    var tbody = document.createElement("tbody");
    rows.forEach(function (r) {
      var tr = document.createElement("tr");
      tr.setAttribute("data-skills", r.skills.join(" "));
      var th = document.createElement("th");
      th.scope = "row";
      var a = document.createElement("a");
      a.href = "#" + r.id;
      a.textContent = r.name;
      th.appendChild(a);
      if (r.year) {
        var y = document.createElement("span");
        y.className = "yr";
        y.textContent = r.year;
        th.appendChild(y);
      }
      tr.appendChild(th);
      SKILLS.forEach(function (s) {
        var td = document.createElement("td");
        if (r.skills.indexOf(s[0]) > -1) {
          td.innerHTML = "<span class=\"tick\" aria-hidden=\"true\"></span><span class=\"visually-hidden\">Yes</span>";
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    matrix.appendChild(thead);
    matrix.appendChild(tbody);

    var active = null;
    function applyFilter(skill, col) {
      $$(".skill-btn", matrix).forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-skill") === skill));
      });
      $$("td.on-col", matrix).forEach(function (td) { td.classList.remove("on-col"); });
      var hits = [];
      $$("tbody tr", matrix).forEach(function (tr) {
        var has = skill && tr.getAttribute("data-skills").split(" ").indexOf(skill) > -1;
        tr.classList.toggle("is-dim", !!skill && !has);
        if (skill) tr.children[col].classList.add("on-col");
        if (has) hits.push(tr.querySelector("a").textContent);
      });
      if (status) {
        if (!skill) { status.textContent = ""; return; }
        var label = SKILLS.filter(function (s) { return s[0] === skill; })[0][1];
        status.textContent = label + ": " + hits.join(", ") + ".";
      }
    }
    matrix.addEventListener("click", function (e) {
      var b = e.target.closest(".skill-btn");
      if (!b) return;
      var skill = b.getAttribute("data-skill");
      active = active === skill ? null : skill;
      applyFilter(active, Number(b.getAttribute("data-col")));
    });
  } else if (matrix) {
    var idx = $("#index");
    if (idx) idx.hidden = true;
  }

  /* ---------- Photo viewer ---------- */
  var dlg = $("#lightbox");
  var lbImg = $("#lb-img"), lbCap = $("#lb-cap"), lbCount = $("#lb-count");
  var lbPrev = $("#lb-prev"), lbNext = $("#lb-next"), lbClose = $("#lb-close");
  var group = [], pos = 0, lastFocus = null;

  function captionFor(img, i) {
    var fig = img.closest("figure");
    var cap = fig && fig.querySelector("figcaption");
    if (cap && fig.closest(".gallery")) return "Fig. " + (i + 1) + "  " + cap.textContent.trim();
    return cap ? cap.textContent.trim() : (img.getAttribute("alt") || "");
  }
  function show(i) {
    pos = (i + group.length) % group.length;
    var img = group[pos];
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.getAttribute("alt") || "";
    lbCap.textContent = captionFor(img, pos);
    lbCount.textContent = group.length > 1 ? (pos + 1) + " / " + group.length : "";
    lbPrev.hidden = lbNext.hidden = group.length < 2;
  }
  function openViewer(list, i) {
    if (!dlg || typeof dlg.showModal !== "function") {
      window.open(list[i].currentSrc || list[i].src, "_blank", "noopener");
      return;
    }
    lastFocus = document.activeElement;
    group = list;
    show(i);
    dlg.showModal();
    lbClose.focus();
  }
  function closeViewer() { if (dlg && dlg.open) dlg.close(); }
  if (dlg) {
    dlg.addEventListener("close", function () {
      lbImg.removeAttribute("src");
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    });
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg || e.target.classList.contains("lb-figure") || e.target.classList.contains("lb-stage")) closeViewer();
    });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); show(pos + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); show(pos - 1); }
    });
    lbPrev.addEventListener("click", function () { show(pos - 1); });
    lbNext.addEventListener("click", function () { show(pos + 1); });
    lbClose.addEventListener("click", closeViewer);
  }
  $$(".gallery, .gallery-lite").forEach(function (g) {
    var imgs = $$("img", g);
    imgs.forEach(function (img, i) {
      img.tabIndex = 0;
      img.setAttribute("role", "button");
      var cap = img.closest("figure") && img.closest("figure").querySelector("figcaption");
      img.setAttribute("aria-label", "Enlarge photo: " + (cap ? cap.textContent.trim() : img.getAttribute("alt")));
      img.addEventListener("click", function () { openViewer(imgs, i); });
      img.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openViewer(imgs, i); }
      });
    });
  });

  /* ---------- Present mode: one section per screen, arrow keys to move ---------- */
  var presentBtn = $("#present-toggle");
  var hudPos = $("#hud-pos");
  var slides = $$(".slide");
  var presenting = false;

  function currentSlide() {
    var line = window.innerHeight * 0.4, best = 0;
    slides.forEach(function (s, i) { if (s.getBoundingClientRect().top <= line) best = i; });
    return best;
  }
  function slideName(s) {
    var n = s.getAttribute("data-short");
    if (n) return n;
    var h = s.querySelector("h1, h2, h3");
    return h ? h.textContent.trim() : "";
  }
  function updateHud() {
    if (!presenting || !hudPos) return;
    var i = currentSlide();
    var pad = function (n) { return n < 10 ? "0" + n : String(n); };
    hudPos.innerHTML = "<b></b> <span></span>";
    hudPos.firstChild.textContent = pad(i + 1) + " / " + pad(slides.length);
    hudPos.lastChild.textContent = slideName(slides[i]);
  }
  function go(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    slides[i].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }
  function setPresent(on) {
    var at = currentSlide();
    presenting = on;
    root.classList.toggle("presenting", on);
    if (presentBtn) presentBtn.setAttribute("aria-pressed", String(on));
    if (!on && document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(function () {});
    }
    requestAnimationFrame(function () {
      slides[at].scrollIntoView({ behavior: "auto", block: "start" });
      updateHud();
    });
  }
  function toggleFullscreen() {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen().catch(function () {});
    } else if (root.requestFullscreen) {
      root.requestFullscreen().catch(function () {});
    }
  }
  if (presentBtn) presentBtn.addEventListener("click", function () { setPresent(!presenting); });
  var hp = $("#hud-prev"), hn = $("#hud-next"), hx = $("#hud-exit");
  if (hp) hp.addEventListener("click", function () { go(currentSlide() - 1); });
  if (hn) hn.addEventListener("click", function () { go(currentSlide() + 1); });
  if (hx) hx.addEventListener("click", function () { setPresent(false); });

  document.addEventListener("keydown", function (e) {
    if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (dlg && dlg.open) return;
    var k = e.key;
    if (k === "p" || k === "P") { e.preventDefault(); setPresent(!presenting); return; }
    if (!presenting) return;
    if (k === "ArrowRight" || k === "PageDown" || k === " ") { e.preventDefault(); go(currentSlide() + 1); }
    else if (k === "ArrowLeft" || k === "PageUp") { e.preventDefault(); go(currentSlide() - 1); }
    else if (k === "Home") { e.preventDefault(); go(0); }
    else if (k === "End") { e.preventDefault(); go(slides.length - 1); }
    else if (k === "Escape") { e.preventDefault(); setPresent(false); }
    else if (k === "f" || k === "F") { e.preventDefault(); toggleFullscreen(); }
  });

  /* ---------- Section highlight in the nav, HUD position ---------- */
  var navLinks = $$(".nav a");
  var targets = navLinks.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      updateHud();
      var line = 120, current = -1;
      targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top <= line) current = i; });
      navLinks.forEach(function (a, i) {
        if (i === current) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Copy email ---------- */
  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var text = b.getAttribute("data-copy");
      var done = function (msg) {
        var old = b.textContent;
        b.textContent = msg;
        setTimeout(function () { b.textContent = old; }, 1600);
      };
      var fallback = function () {
        var v = b.parentNode.querySelector(".v");
        if (v && window.getSelection) {
          var range = document.createRange();
          range.selectNodeContents(v);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
        done("Selected");
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done("Copied"); }, fallback);
      } else {
        fallback();
      }
    });
  });
})();
