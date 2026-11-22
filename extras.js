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
