// Byline, browser bar colour, and a user-switchable Auto / Light / Dark theme.
(function () {
  // "Built by Rakesh" card above the footer
  var f = document.querySelector("footer");
  if (f) {
    var d = document.createElement("div");
    d.className = "by";
    d.innerHTML = '<img src="rakesh.jpg" alt="Rakesh" width="56" height="56"><div><b>Built by Rakesh</b><span>Made for Narsipatnam–Chodavaram commuters</span></div>';
    d.querySelector("img").onerror = function () { this.style.display = "none"; };
    f.parentNode.insertBefore(d, f);
  }

  // Theme switch: Auto -> Light -> Dark -> Auto ...
  var KEY = "nc.theme";
  var MODES = ["auto", "light", "dark"];
  var LABEL = { auto: "Auto", light: "Light", dark: "Dark" };
  var ICON = { auto: "◐", light: "☀", dark: "☾" };
  var root = document.documentElement;
  var saved = localStorage.getItem(KEY);
  var mode = MODES.indexOf(saved) >= 0 ? saved : "auto";

  var header = document.querySelector("header");
  if (!header) return;

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "theme-btn";
  btn.setAttribute("aria-label", "Change theme");
  header.appendChild(btn);

  var meta = document.querySelector('meta[name="theme-color"]');
  var mq = window.matchMedia("(prefers-color-scheme: dark)");

  function apply() {
    if (mode === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", mode);

    btn.textContent = ICON[mode] + " " + LABEL[mode];
    btn.title = "Theme: " + LABEL[mode] + " (tap to change)";

    if (meta) {
      var dark = mode === "dark" || (mode === "auto" && mq.matches);
      meta.content = dark ? "#1f2f8f" : "#2f46c9";
    }
  }

  btn.addEventListener("click", function () {
    mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
    localStorage.setItem(KEY, mode);
    apply();
  });

  if (mq.addEventListener) mq.addEventListener("change", function () { if (mode === "auto") apply(); });
  else if (mq.addListener) mq.addListener(function () { if (mode === "auto") apply(); });

  apply();
})();


// Show only the first 3 live buses, with a "See more" button for the rest.
// Re-applies itself whenever the page re-renders the live list (every ~15s).
(function () {
  var live = document.getElementById("live");
  if (!live) return;

  var LIMIT = 3;
  var KEY = "nc.liveMore";
  var expanded = localStorage.getItem(KEY) === "1";
  var btn = null;

  function trim() {
    var cards = [].slice.call(live.querySelectorAll(".bus"));
    var extra = cards.slice(LIMIT);

    var attached = btn && live.contains && live.contains(btn);

    if (!extra.length) {
      if (attached) live.removeChild(btn);
      btn = null;
      cards.forEach(function (c) { if (c.style.display) c.style.display = ""; });
      return;
    }

    if (!attached) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "more live-more";
      btn.addEventListener("click", function () {
        expanded = !expanded;
        localStorage.setItem(KEY, expanded ? "1" : "0");
        trim();
      });
      live.appendChild(btn);
    }

    var label = expanded ? "Show less" : "See more (" + extra.length + " more)";
    if (btn.textContent !== label) btn.textContent = label;

    cards.forEach(function (c, i) {
      var want = !expanded && i >= LIMIT ? "none" : "";
      if (c.style.display !== want) c.style.display = want;
    });
  }

  if (window.MutationObserver) {
    new window.MutationObserver(function () { trim(); }).observe(live, { childList: true });
  }
  trim();
})();

// Contact line for any queries
(function () {
  var f = document.querySelector("footer");
  if (!f) return;
  var p = document.createElement("p");
  p.innerHTML = 'Any queries? <a href="tel:9494882167">Msg / call 9494882167</a>';
  f.appendChild(p);
})();

// Hide the decorative route line on the map (the blue line).
// Bus markers, stop dots and ETAs keep working normally.
(function () {
  var s = document.createElement("style");
  s.textContent = '.leaflet-overlay-pane path[stroke-width="5"],.leaflet-overlay-pane path[stroke-opacity="0.75"]{display:none!important}';
  document.head.appendChild(s);
})();
// Decorate the Narsipatnam ⇄ Chodavaram route line: green with a soft glow.
// Append AFTER the previous "hide blue line" snippet so it overrides it.
(function () {
  var s = document.createElement("style");
  s.textContent = '.leaflet-overlay-pane path[stroke-width="5"],.leaflet-overlay-pane path[stroke-opacity="0.75"]{' +
    'display:block!important;' +
    'stroke:#12a267!important;' +
    'stroke-width:6!important;' +
    'stroke-opacity:.95!important;' +
    'stroke-linecap:round!important;' +
    'stroke-linejoin:round!important;' +
    'stroke-dasharray:none!important;' +
    'filter:drop-shadow(0 0 3px rgba(18,162,103,.95)) drop-shadow(0 0 9px rgba(18,162,103,.55));' +
    '}';
  document.head.appendChild(s);
})();

