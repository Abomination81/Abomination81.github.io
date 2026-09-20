/* The living hero portrait.
 *
 * Seedance is the default for everyone. Narrow screens get a 640px cut instead
 * of the 1080px one. If the visitor has asked for reduced motion, or the
 * browser reports a metered or very slow connection, the video is skipped and
 * the CSS-animated still already in the markup stays put.
 *
 * URL overrides, for comparison:
 *   ?hero=seedance | kling | hailuo   pick a specific clip
 *   ?hero=css                         force the CSS still, no video
 * With any ?hero= present a small switcher appears bottom-left.
 */
(function () {
  "use strict";

  var DEFAULT   = "seedance";
  var CLIPS     = ["seedance", "kling", "hailuo"];
  var SMALL_AT  = 900;          // viewport width below which the 640px cut is used
  var HAS_SMALL = ["seedance"]; // clips that have a _sm variant
  var HERO_V = {"hailuo": "a31e1fda", "kling": "43f04339", "seedance": "57525844", "seedance_sm": "a8a01b77"}; // stamped by stamp.py

  var param = new URLSearchParams(location.search).get("hero");
  var onComparePage = !!document.querySelector(".abcard video");

  function mq(q) { return window.matchMedia && window.matchMedia(q).matches; }

  function unwanted() {
    if (mq("(prefers-reduced-motion: reduce)")) return true;
    var c = navigator.connection;
    if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ""))) return true;
    return false;
  }

  // Muted autoplay is normally allowed, but a play() issued before any data
  // arrives can be dropped. Ask again as data lands, on a few timers, and on
  // the first interaction, until it sticks.
  function kick(el) {
    function tryPlay() { if (!el.paused) return; var p = el.play(); if (p && p.catch) p.catch(function () {}); }
    tryPlay();
    el.addEventListener("loadeddata", tryPlay);
    el.addEventListener("canplay", tryPlay);
    setTimeout(tryPlay, 800); setTimeout(tryPlay, 2500); setTimeout(tryPlay, 6000);
    var keys = ["pointerdown", "touchstart", "keydown", "scroll"];
    var once = function () { tryPlay(); keys.forEach(function (e) { window.removeEventListener(e, once); }); };
    keys.forEach(function (e) { window.addEventListener(e, once, { passive: true }); });
    document.addEventListener("visibilitychange", function () { if (!document.hidden) tryPlay(); });
  }

  function mount(clip) {
    var ghoul = document.querySelector(".ghoul");
    if (!ghoul) return;
    var name = clip;
    if (HAS_SMALL.indexOf(clip) !== -1 && window.innerWidth < SMALL_AT) name = clip + "_sm";
    var ver = HERO_V[name] ? "?v=" + HERO_V[name] : "";

    var v = document.createElement("video");
    v.className = "ghoul-video";
    v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
    v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("loop", "");
    v.preload = "auto";
    v.poster = "/assets/hero/hero_" + name + "_poster.jpg" + ver;
    v.src = "/assets/hero/hero_" + name + ".mp4" + ver;
    // Keep the animated still underneath until the first frame is decoded, so
    // a slow connection shows the portrait rather than a black square.
    v.addEventListener("loadeddata", function () { ghoul.classList.add("has-video"); });
    ghoul.insertBefore(v, ghoul.firstChild);
    kick(v);
  }

  if (onComparePage) {
    Array.prototype.forEach.call(document.querySelectorAll(".abcard video"), kick);
  }

  var clip = param || DEFAULT;
  if (clip !== "css" && CLIPS.indexOf(clip) !== -1) {
    // An explicit ?hero= is a deliberate request, so honour it either way.
    if (param || !unwanted()) mount(clip);
  }

  if (!param) return;
  var bar = document.createElement("div");
  bar.className = "hero-switch mono";
  bar.innerHTML = "HERO:&nbsp;" + ["css"].concat(CLIPS).map(function (n) {
    return '<a href="/?hero=' + n + '"' + (n === param ? ' class="on"' : "") + ">" + n + "</a>";
  }).join("") + '<a href="/ab/">compare &rarr;</a>';
  document.body.appendChild(bar);
})();
