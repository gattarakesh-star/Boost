// Adds "Built by Rakesh" with photo above the footer, and sets the browser bar colour.
(function () {
  var f = document.querySelector("footer");
  if (f) {
    var d = document.createElement("div");
    d.className = "by";
    d.innerHTML = '<img src="rakesh.jpg" alt="Rakesh" width="56" height="56"><div><b>Built by Rakesh</b><span>Made for Narsipatnam–Chodavaram commuters</span></div>';
    d.querySelector("img").onerror = function () { this.style.display = "none"; };
    f.parentNode.insertBefore(d, f);
  }
  var m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = "#2f46c9";
})();
