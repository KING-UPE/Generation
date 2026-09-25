/* ===================================================================
   Generation'26 — v2
   No framework, no jQuery. Four things move, and a reader starts three
   of them: the loader, the video picker, the gallery sets and the
   lightbox. Nothing reveals itself on scroll.
   =================================================================== */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ------------------------------------------------------------ loader
     Held until the images above the fold have actually decoded, so the
     first thing seen is the finished page rather than a reflow. */
  var rule = $("#loaderRule");
  var done = 0;
  var watched = $$("img").slice(0, 10);
  var total = watched.length || 1;

  function tick() {
    done++;
    if (rule) rule.style.width = Math.min(100, (done / total) * 100) + "%";
    if (done >= total) finish();
  }

  var finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    if (rule) rule.style.width = "100%";
    setTimeout(function () {
      document.body.classList.add("is-ready");
      fitHero();
      drawBars();
    }, 220);
  }

  watched.forEach(function (img) {
    if (img.complete) tick();
    else {
      img.addEventListener("load", tick, { once: true });
      img.addEventListener("error", tick, { once: true });
    }
  });
  if (!watched.length) finish();
  /* Never hold the page on a slow image. */
  setTimeout(finish, 3500);

  /* ------------------------------------------------------------- chart
     The curve is drawn in pixel coordinates, not in a 0-100 viewBox.

     That is not a style choice, it is the fix for a real bug. The old
     chart stretched a 0-100 viewBox with preserveAspectRatio="none" and
     marked the stroke non-scaling. Those two together put the geometry in
     user units and the stroke in screen units -- so getTotalLength()
     returned about 50 while the line rendered about 1000px long, and a
     dash pattern built from that length tiled roughly twenty times
     instead of once. The result was a line chopped into pieces that did
     not reach its own dots.

     With the viewBox set to the element's own pixel size there is only
     one coordinate system, so lengths, dashes and stroke widths all agree.
     The points stay in the markup as percentages -- the markup is the
     source of truth for the figures -- and this reads them back. */
  var chart = $(".line-chart");

  function pathThrough(pts, tension) {
    /* Catmull-Rom through every point, converted to cubic beziers. A plain
       polyline gives the hard corners of a sketch; this gives the eased
       run of a real series without inventing a shape the data does not
       have. Tension is deliberately low -- it should read as a curve, not
       as a wave. */
    if (pts.length < 2) return "";
    var d = "M" + pts[0].x.toFixed(1) + "," + pts[0].y.toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i];
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var p3 = pts[i + 2] || p2;
      var c1x = p1.x + (p2.x - p0.x) * tension;
      var c1y = p1.y + (p2.y - p0.y) * tension;
      var c2x = p2.x - (p3.x - p1.x) * tension;
      var c2y = p2.y - (p3.y - p1.y) * tension;
      d += "C" + c1x.toFixed(1) + "," + c1y.toFixed(1) +
           " " + c2x.toFixed(1) + "," + c2y.toFixed(1) +
           " " + p2.x.toFixed(1) + "," + p2.y.toFixed(1);
    }
    return d;
  }

  function drawChart(animate) {
    if (!chart) return;
    var svg = $(".lc-svg", chart);
    if (!svg) return;

    var w = chart.clientWidth;
    var h = chart.clientHeight;
    if (!w || !h) return;

    var pts = $$(".lc-pt", chart).map(function (el) {
      return {
        x: (parseFloat(el.style.left) / 100) * w,
        y: h - (parseFloat(el.style.bottom) / 100) * h,
        next: el.classList.contains("is-next")
      };
    });
    if (pts.length < 2) return;

    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);

    /* Recorded years solid; the last leg is a projection and is drawn as
       one. Both are built from the same point list so they meet exactly. */
    var solid = pathThrough(pts.slice(0, pts.length - 1), 0.18);
    var lastTwo = pathThrough(pts.slice(pts.length - 2), 0.18);

    svg.innerHTML =
      '<path class="lc-line" d="' + solid + '"/>' +
      '<path class="lc-line lc-next" d="' + lastTwo + '"/>';

    if (!animate) return;

    $$(".lc-line", svg).forEach(function (line, i) {
      var len = line.getTotalLength();
      var isNext = line.classList.contains("lc-next");
      line.style.transition = "none";
      line.style.strokeDasharray = len + " " + len;
      line.style.strokeDashoffset = len;
      void line.getBoundingClientRect();
      setTimeout(function () {
        line.style.transition = "stroke-dashoffset 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)";
        line.style.strokeDashoffset = "0";
        /* Hand the dash pattern back to the stylesheet once it has drawn:
           solid for the record, dashes for the projection. */
        setTimeout(function () {
          line.style.transition = "";
          line.style.strokeDasharray = isNext ? "8 8" : "none";
          line.style.strokeDashoffset = "0";
        }, 950);
      }, 120 + 380 * i);
    });

    $$(".lc-pt", chart).forEach(function (pt, i) {
      pt.style.opacity = "0";
      pt.style.transition = "opacity 0.4s ease";
      setTimeout(function () { pt.style.opacity = "1"; }, 240 + 170 * i);
    });
  }

  /* Named drawBars for the loader, which calls it when the page hands over. */
  function drawBars() { drawChart(true); }

  var chartW = chart ? chart.clientWidth : 0;
  window.addEventListener("resize", function () {
    if (!chart) return;
    if (chart.clientWidth === chartW) return;
    chartW = chart.clientWidth;
    drawChart(false);
  });

  /* --------------------------------------------------------- hero fit
     The title is set to the exact width of its column.

     A clamp() cannot do this job. The column stops growing at --maxw
     while the viewport keeps going, so any vw-based size eventually
     outruns the box it sits in -- measured at 1440 the title was 1665px
     wide inside a 1216px column and put the whole document into sideways
     scroll. Measuring the text and solving for the size that fits is the
     only thing that holds at every width, and it gives the flush-to-both
     -edges setting the design wants for free. */
  var heroTitle = $(".hero-title");

  function fitHero() {
    if (!heroTitle) return;
    var col = heroTitle.parentElement;
    var cs = getComputedStyle(col);
    var inner = col.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (inner <= 0) return;

    /* Width scales linearly with font-size, so one measurement gives the
       answer: no loop, no reflow storm on resize. */
    heroTitle.style.fontSize = "100px";
    var at100 = heroTitle.getBoundingClientRect().width;
    if (!at100) return;
    var size = Math.floor((inner / at100) * 100 * 100) / 100;
    heroTitle.style.fontSize = size + "px";
  }

  fitHero();
  window.addEventListener("resize", fitHero);
  /* Re-run once the webfont has settled, in case metrics changed. */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHero);

  /* --------------------------------------------------------------- nav */
  var toggle = $("#navToggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute("href");
    if (id.length < 2) return;
    var el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    document.body.classList.remove("nav-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    /* Clear the floating bar plus the gap it sits in, so a section never
       lands underneath it. */
    var head = document.querySelector(".site-head .inner");
    var clearance = head ? head.getBoundingClientRect().bottom + 14 : 82;
    var top = el.getBoundingClientRect().top + window.pageYOffset - clearance;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  });

  /* ------------------------------------------------------ hero slider
     Three frames under the static title, driven by the three boxes over
     the bottom-left corner. It advances on its own because a slider that
     never moves is just a photograph -- slowly, and it stops the moment
     a reader takes hold of it, so the thing they picked stays put. */
  var heroSlides = $$(".hero-slide");
  var heroBoxes = $$(".hero-box");

  if (heroSlides.length > 1) {
    var hAt = 0;
    var hTimer = null;
    var HOLD = 6000;

    function heroShow(i) {
      hAt = (i + heroSlides.length) % heroSlides.length;
      heroSlides.forEach(function (s, n) { s.classList.toggle("is-on", n === hAt); });
      heroBoxes.forEach(function (b, n) { b.classList.toggle("is-on", n === hAt); });
    }

    function heroStart() {
      if (hTimer) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      hTimer = setInterval(function () { heroShow(hAt + 1); }, HOLD);
    }

    function heroStop() {
      clearInterval(hTimer);
      hTimer = null;
    }

    heroBoxes.forEach(function (b, i) {
      b.addEventListener("click", function () { heroStop(); heroShow(i); });
    });

    /* The whole hero is the slider; there is no inner wrapper to bind
       to. Guarded, because everything below this line lives in the
       same IIFE and a throw here takes the gallery with it. */
    var slider = $(".hero");
    if (slider) {
      slider.addEventListener("mouseenter", heroStop);
      slider.addEventListener("mouseleave", heroStart);
    }
    /* A backgrounded tab should not queue up a pile of missed advances. */
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) heroStop(); else heroStart();
    });

    heroShow(0);
    heroStart();
  }

  /* ---------------------------------------------------------- lightbox */
  var lb = $("#lb");
  var lbInner = $("#lbInner");

  function openLb(html) {
    lbInner.innerHTML = html;
    lb.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeLb() {
    lb.classList.remove("is-open");
    lbInner.innerHTML = "";     // stops the video
    document.body.style.overflow = "";
  }

  if (lb) {
    $("#lbClose").addEventListener("click", closeLb);
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lb.classList.contains("is-open")) closeLb();
    });
  }

  function openVideo(id) {
    openLb('<div class="lb-frame"><iframe src="https://www.youtube.com/embed/' + id +
      '?autoplay=1&rel=0" title="Generation 26" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>');
  }

  function openPhoto(src, alt) {
    openLb('<img class="lb-photo" src="' + src + '" alt="' + (alt || "") + '">');
  }

  /* ------------------------------------------------------------ videos */
  var thumbs = $$("#vidThumbs button");
  if (thumbs.length) {
    var poster = $("#vidPoster");
    var play = $("#vidPlay");
    var tTitle = $("#vidTitle");
    var tDesc = $("#vidDesc");
    var at = 0;

    function show(i) {
      at = (i + thumbs.length) % thumbs.length;
      var b = thumbs[at];
      poster.src = b.getAttribute("data-poster");
      poster.alt = b.getAttribute("data-title");
      play.setAttribute("data-yt", b.getAttribute("data-yt"));
      tTitle.innerHTML = b.getAttribute("data-title");
      tDesc.innerHTML = b.getAttribute("data-desc");
      thumbs.forEach(function (x) { x.classList.remove("is-on"); });
      b.classList.add("is-on");
    }

    thumbs.forEach(function (b, i) {
      b.addEventListener("click", function () { show(i); });
    });
    $("#vidPrev").addEventListener("click", function () { show(at - 1); });
    $("#vidNext").addEventListener("click", function () { show(at + 1); });
    play.addEventListener("click", function (e) {
      e.preventDefault();
      openVideo(play.getAttribute("data-yt"));
    });

    show(0);
  }

  /* ----------------------------------------------------------- gallery
     Whole sets rather than a scrolling wall: fifteen at a time on a wide
     screen, eight on a phone, and the arrows swap the set entire. The
     count comes off the viewport at build time and again on resize,
     because the two layouts do not hold the same number. */
  var sheet = $("#sheet");
  if (sheet && window.GEN_PHOTOS) {
    var all = window.GEN_PHOTOS;
    var page = 0;

    function perPage() { return window.innerWidth < 900 ? 8 : 15; }

    function render() {
      var n = perPage();
      var pages = Math.ceil(all.length / n);
      page = ((page % pages) + pages) % pages;
      var slice = all.slice(page * n, page * n + n);

      sheet.innerHTML = slice.map(function (p) {
        return '<img src="' + p[0] + '" alt="' + p[1] + '" loading="lazy" data-photo>';
      }).join("");

      $("#sheetCount").textContent =
        "Set " + (page + 1) + " of " + pages + " — " + all.length + " photographs";
    }

    $("#sheetPrev").addEventListener("click", function () { page--; render(); });
    $("#sheetNext").addEventListener("click", function () { page++; render(); });

    var wide = window.innerWidth >= 900;
    window.addEventListener("resize", function () {
      var nowWide = window.innerWidth >= 900;
      if (nowWide !== wide) { wide = nowWide; page = 0; render(); }
    });

    render();
  }

  /* Any photograph on the page opens full size. */
  document.addEventListener("click", function (e) {
    var img = e.target.closest ? e.target.closest("img[data-photo]") : null;
    if (!img) return;
    openPhoto(img.getAttribute("src"), img.getAttribute("alt"));
  });
})();
