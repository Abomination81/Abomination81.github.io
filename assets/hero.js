/* The living hero portrait.
 *
 * Mounts the looping clip over the CSS-animated still in the markup. Narrow
 * screens get a 640px cut instead of the 1080px one.
 *
 * Skipped entirely, leaving the still in place, when the visitor has asked for
 * reduced motion or the browser reports a metered or very slow connection.
 */
(function () {
  "use strict";

  var CLIP     = "seedance";
  var SMALL_AT = 900;   // viewport width below which the 640px cut is used
  var HERO_V = {"seedance": "57525844", "seedance_sm": "a8a01b77"}; // stamped by stamp.py

  function mq(q) { return window.matchMedia && window.matchMedia(q).matches; }
  if (mq("(prefers-reduced-motion: reduce)")) return;

  var conn = navigator.connection;
  if (conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ""))) return;

  var ghoul = document.querySelector(".ghoul");
  if (!ghoul) return;

  var name = window.innerWidth < SMALL_AT ? CLIP + "_sm" : CLIP;
  var ver  = HERO_V[name] ? "?v=" + HERO_V[name] : "";

  var v = document.createElement("video");
  v.className = "ghoul-video";
  v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
  v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("loop", "");
  v.preload = "auto";
  v.poster = "/assets/hero/hero_" + name + "_poster.jpg" + ver;
  v.src    = "/assets/hero/hero_" + name + ".mp4" + ver;
  // Keep the still underneath until the first frame decodes, so a slow
  // connection shows the portrait rather than a black square.
  v.addEventListener("loadeddata", function () { ghoul.classList.add("has-video"); });
  ghoul.insertBefore(v, ghoul.firstChild);

  // Muted autoplay is normally allowed, but a play() issued before any data
  // arrives can be dropped. Ask again as data lands, on a few timers, and on
  // the first interaction, until it sticks.
  function tryPlay() { if (!v.paused) return; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  tryPlay();
  v.addEventListener("loadeddata", tryPlay);
  v.addEventListener("canplay", tryPlay);
  setTimeout(tryPlay, 800); setTimeout(tryPlay, 2500); setTimeout(tryPlay, 6000);
  var keys = ["pointerdown", "touchstart", "keydown", "scroll"];
  var once = function () { tryPlay(); keys.forEach(function (e) { window.removeEventListener(e, once); }); };
  keys.forEach(function (e) { window.addEventListener(e, once, { passive: true }); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) tryPlay(); });
})();
