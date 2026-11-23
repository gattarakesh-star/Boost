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

// Final byline (dedication + contact) and a crown beside Kothakota.
(function () {
  var css = document.createElement("style");
  css.textContent = '.by div span{display:block;margin-top:2px}.by a{color:var(--bus);font-weight:600}';
  document.head.appendChild(css);

  var by = document.querySelector(".by");
  if (by) {
    by.innerHTML =
      '<img src="rakesh.jpg" alt="Rakesh" width="56" height="56">' +
      '<div><b>Built by Rakesh</b>' +
      '<span>Made for narsipatnam chodavaram pillalu..</span>' +
      '<span>Dedicated to that girl i saw at sivalayam temple in orange dress..</span>' +
      '<span>Any queries? <a href="tel:9494882167">Msg / call 9494882167</a></span></div>';
    var img = by.querySelector("img");
    if (img) img.onerror = function () { this.style.display = "none"; };
  }

  // Remove the older standalone contact paragraph if it is still there.
  [].slice.call(document.querySelectorAll("footer p")).forEach(function (p) {
    if (/Any queries/i.test(p.textContent)) p.parentNode.removeChild(p);
  });

  // Crown beside Kothakota everywhere it appears (route line, timetable, tooltips).
  var CROWN = " \uD83D\uDC51";
  function crown(root) {
    if (!root || !root.querySelectorAll) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var hits = [], t;
    while ((t = w.nextNode())) {
      if (t.nodeValue && /Kothakota/i.test(t.nodeValue) && t.nodeValue.indexOf("\uD83D\uDC51") < 0) hits.push(t);
    }
    hits.forEach(function (t) { t.nodeValue = t.nodeValue.replace(/(Kothakota)/gi, "$1" + CROWN); });
  }
  crown(document.body);
  if (window.MutationObserver) {
    new window.MutationObserver(function (ms) {
      ms.forEach(function (m) {
        [].slice.call(m.addedNodes).forEach(function (n) {
          if (n.nodeType === 1) crown(n);
          else if (n.nodeType === 3 && /Kothakota/i.test(n.nodeValue) && n.nodeValue.indexOf("\uD83D\uDC51") < 0) {
            n.nodeValue = n.nodeValue.replace(/(Kothakota)/gi, "$1" + CROWN);
          }
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }
})();

// Final byline (dedication + contact) and a crown beside Kothakota.
(function () {
  var css = document.createElement("style");
  css.textContent = '.by div span{display:block;margin-top:2px}.by a{color:var(--bus);font-weight:600}';
  document.head.appendChild(css);

  var by = document.querySelector(".by");
  if (by) {
    by.innerHTML =
      '<img src="rakesh.jpg" alt="Rakesh" width="56" height="56">' +
      '<div><b>Built by Rakesh</b>' +
      '<span>Made for kothakota students...</span>' +
      '<span>Dedicated to that orange dress girl i saw at sivalayam temple on nov 20 night🫠...</span>' +
      '<span>Any queries? <a href="tel:9494882167">Msg / call 9494882167</a></span></div>';
    var img = by.querySelector("img");
    if (img) img.onerror = function () { this.style.display = "none"; };
  }

  // Remove the older standalone contact paragraph if it is still there.
  [].slice.call(document.querySelectorAll("footer p")).forEach(function (p) {
    if (/Any queries/i.test(p.textContent)) p.parentNode.removeChild(p);
  });

  // Crown beside Kothakota everywhere it appears (route line, timetable, tooltips).
  var CROWN = " \uD83D\uDC51";
  function crown(root) {
    if (!root || !root.querySelectorAll) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var hits = [], t;
    while ((t = w.nextNode())) {
      if (t.nodeValue && /Kothakota/i.test(t.nodeValue) && t.nodeValue.indexOf("\uD83D\uDC51") < 0) hits.push(t);
    }
    hits.forEach(function (t) { t.nodeValue = t.nodeValue.replace(/(Kothakota)/gi, "$1" + CROWN); });
  }
  crown(document.body);
  if (window.MutationObserver) {
    new window.MutationObserver(function (ms) {
      ms.forEach(function (m) {
        [].slice.call(m.addedNodes).forEach(function (n) {
          if (n.nodeType === 1) crown(n);
          else if (n.nodeType === 3 && /Kothakota/i.test(n.nodeValue) && n.nodeValue.indexOf("\uD83D\uDC51") < 0) {
            n.nodeValue = n.nodeValue.replace(/(Kothakota)/gi, "$1" + CROWN);
          }
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }
})();

// Live viewers, views and passenger reviews.
(function () {
  var API = "/api/social";
// One ID per browser (localStorage, shared by all tabs) so refreshes/tabs don't add views.
  var vid;
  try {
    vid = localStorage.getItem("nc.vid");
    if (!vid) { vid = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("nc.vid", vid); }
  } catch (e) { vid = "anon-" + Math.random().toString(36).slice(2); }
  var today = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);

  var css = document.createElement("style");
  css.textContent =
    '.social-stats{display:flex;gap:14px;align-items:center;font-size:14px;color:var(--muted);margin:6px 2px 12px;flex-wrap:wrap}' +
    '.social-stats b{color:var(--ink)}' +
    '.reviews{margin-top:26px}' +
    '.reviews h2{font-size:17px;margin:0 2px 10px}' +
    '.reviews h2 span{font-size:13px;color:var(--muted);font-weight:500}' +
    '.review-list{display:flex;flex-direction:column;gap:10px}' +
    '.review{background:var(--card);border-radius:14px;padding:12px 14px}' +
    '.review .who{font-weight:700;font-size:14px}' +
    '.review .stars{color:var(--accent);font-size:14px;margin-left:6px}' +
    '.review .txt{font-size:15px;margin-top:4px;white-space:pre-wrap;overflow-wrap:anywhere}' +
    '.review .when{font-size:12px;color:var(--muted);margin-top:4px}' +
    '.review-form{display:flex;flex-direction:column;gap:8px;margin-top:12px}' +
    '.review-form input,.review-form select,.review-form textarea{font:600 15px system-ui;color:var(--ink);background:var(--card);border:2px solid var(--line);border-radius:12px;padding:10px;width:100%}' +
    '.review-form textarea{min-height:84px;font-weight:400;resize:vertical}' +
    '.review-form button{border:0;border-radius:12px;padding:11px;background:var(--bus);color:#fff;font:700 15px system-ui;cursor:pointer}' +
    '.rv-msg{font-size:13px;color:var(--muted);min-height:16px;margin:0}';
  document.head.appendChild(css);

  var stat = document.getElementById("stat");
  var bar = document.createElement("div");
  bar.className = "social-stats";
  bar.innerHTML = '<span>👥 <b id="liveViewers">…</b> live</span><span>👁 <b id="pageViews">…</b> views</span>';
  if (stat && stat.parentNode) stat.parentNode.insertBefore(bar, stat.nextSibling);

  var footer = document.querySelector("footer");
  var sec = document.createElement("section");
  sec.className = "reviews";
  sec.innerHTML =
    '<h2>Reviews <span>from passengers</span></h2>' +
    '<div class="review-list" id="reviewList"><div class="review"><div class="txt">Loading reviews…</div></div></div>' +
    '<form class="review-form" id="reviewForm">' +
      '<input id="rvName" maxlength="40" placeholder="Your name (optional)">' +
      '<select id="rvRating"><option value="5">★★★★★</option><option value="4">★★★★☆</option><option value="3">★★★☆☆</option><option value="2">★★☆☆☆</option><option value="1">★☆☆☆☆</option></select>' +
      '<textarea id="rvText" maxlength="300" placeholder="Tell others about this bus tracker…" required></textarea>' +
      '<button type="submit" id="rvBtn">Post review</button>' +
      '<p class="rv-msg" id="rvMsg"></p>' +
    '</form>';
  if (footer && footer.parentNode) footer.parentNode.insertBefore(sec, footer);

  function renderStats(d) {
    var v = document.getElementById("liveViewers");
    var p = document.getElementById("pageViews");
    if (v) v.textContent = d.viewers == null ? "…" : d.viewers;
    if (p) p.textContent = d.views == null ? "…" : d.views;
  }

  function renderReviews(list) {
    var box = document.getElementById("reviewList");
    if (!box) return;
    if (!list || !list.length) { box.innerHTML = '<div class="review"><div class="txt">No reviews yet — be the first! 🚌</div></div>'; return; }
    box.innerHTML = list.map(function (r) {
      var rating = r.rating || 5;
      var stars = "★".repeat(rating) + "☆".repeat(Math.max(0, 5 - rating));
      var when = new Date(r.ts || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      return '<div class="review"><div><span class="who">' + esc(r.name) + '</span><span class="stars">' + stars + '</span></div>' +
        '<div class="txt">' + esc(r.text) + '</div><div class="when">' + esc(when) + '</div></div>';
    }).join("");
  }

  async function post(action, extra) {
    var body = Object.assign({ action: action, id: vid }, extra || {});
    var r = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    return r.json();
  }

  async function refresh() {
    try { var d = await fetch(API, { cache: "no-store" }).then(function (r) { return r.json(); }); renderStats(d); renderReviews(d.reviews || []); } catch (e) {}
  }

  
// Count a view only once per browser per day (IST). Otherwise just ping as a live viewer.
  var countedKey = "nc.viewed." + today;
  var counted = false;
  try { counted = localStorage.getItem(countedKey) === "1"; } catch (e) {}
  (counted ? post("ping") : post("view").then(function () {
    try { localStorage.setItem(countedKey, "1"); } catch (e) {}
  })).then(refresh).catch(refresh);
  setInterval(function () { if (!document.hidden) { post("ping").catch(function () {}); refresh(); } }, 20000);

  var form = document.getElementById("reviewForm");
  if (form) form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var text = document.getElementById("rvText").value.trim();
    var msg = document.getElementById("rvMsg");
    var btn = document.getElementById("rvBtn");
    if (!text) return;
    btn.disabled = true;
    try {
      var d = await post("review", { name: document.getElementById("rvName").value, text: text, rating: +document.getElementById("rvRating").value });
      renderReviews(d.reviews || []);
      document.getElementById("rvText").value = "";
      msg.textContent = "Posted! Thanks ✨";
      refresh();
    } catch (err) { msg.textContent = "Could not post. Try again."; }
    finally { btn.disabled = false; }
  });
})();

// Admin-only review deletion. Unlock with your secret key, then pick a review to remove.
(function () {
  var API = "/api/social";
  var KEY = "nc.adminKey";
  var key = localStorage.getItem(KEY) || "";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var css = document.createElement("style");
  css.textContent =
    '.admin-panel{margin:16px 2px}' +
    '.admin-btn{border:0;border-radius:12px;padding:10px 14px;background:var(--card);color:var(--ink);font:700 14px system-ui;cursor:pointer}' +
    '.admin-body{display:flex;flex-direction:column;gap:8px;margin-top:8px}' +
    '.admin-body[hidden]{display:none}' +
    '.admin-body select{font:15px system-ui;color:var(--ink);background:var(--card);border:2px solid var(--line);border-radius:12px;padding:10px;width:100%}' +
    '.admin-body button{border:0;border-radius:12px;padding:10px;background:#d33;color:#fff;font:700 14px system-ui;cursor:pointer}' +
    '.admin-msg{font-size:13px;color:var(--muted);margin:0}';
  document.head.appendChild(css);

  var footer = document.querySelector("footer");
  if (!footer) return;

  var box = document.createElement("section");
  box.className = "admin-panel";
  box.innerHTML =
    '<button type="button" class="admin-btn" id="adminBtn">🔑 Manage reviews (admin)</button>' +
    '<div class="admin-body" id="adminBody" hidden>' +
      '<select id="adminSelect"></select>' +
      '<button type="button" id="adminDelete">🗑 Delete selected review</button>' +
      '<p class="admin-msg" id="adminMsg"></p>' +
    '</div>';
  footer.parentNode.insertBefore(box, footer);

  var btn = document.getElementById("adminBtn");
  var body = document.getElementById("adminBody");
  var sel = document.getElementById("adminSelect");
  var msg = document.getElementById("adminMsg");

  function show(open) {
    body.hidden = !open;
    btn.textContent = open ? "🔒 Close admin" : "🔑 Manage reviews (admin)";
  }

  async function load() {
    try {
      var d = await fetch(API + "?type=reviews", { cache: "no-store" }).then(function (r) { return r.json(); });
      var list = d.reviews || [];
      sel.innerHTML = list.length
        ? list.map(function (r) {
            return '<option value="' + esc(r.id) + '">' + esc((r.name || "Anonymous") + " — " + String(r.text || "").slice(0, 60)) + '</option>';
          }).join("")
        : '<option value="">No reviews yet</option>';
      msg.textContent = list.length ? list.length + " review(s) loaded." : "No reviews yet.";
    } catch (e) { msg.textContent = "Could not load reviews."; }
  }

  btn.addEventListener("click", async function () {
    if (!body.hidden) { show(false); return; }
    if (!key) {
      var entered = window.prompt("Enter your admin key:");
      if (!entered) return;
      try {
        var r = await fetch(API, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "admin-check", key: entered })
        }).then(function (x) { return x.json(); });
        if (!r.ok) { window.alert("Wrong key."); return; }
        key = entered;
        localStorage.setItem(KEY, key);
      } catch (e) { msg.textContent = "Could not verify key."; return; }
    }
    show(true);
    load();
  });

  document.getElementById("adminDelete").addEventListener("click", async function () {
    var id = sel.value;
    if (!id) { msg.textContent = "Select a review first."; return; }
    if (!window.confirm("Delete this review?")) return;
    try {
      var r = await fetch(API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "delete", key: key, reviewId: id })
      });
      if (!r.ok) { msg.textContent = "Could not delete."; return; }
      location.reload();
    } catch (e) { msg.textContent = "Could not delete."; }
  });
})();

