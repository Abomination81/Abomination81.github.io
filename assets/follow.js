/* Follow prompt.
 *
 * Asks at most once per page load, and never on arrival. It waits for the
 * visitor to spend real time on the page, scroll a meaningful way down, or
 * move to leave.
 *
 * Answering is final. "Follow" and "I already follow you" both stop it for
 * good. Closing without answering snoozes it for SNOOZE_DAYS.
 *
 * Tuning knobs are the constants directly below.
 */
(function () {
  "use strict";

  var PROFILE     = "https://x.com/Abomination81";
  var KEY         = "ab81.follow.v1";
  var DELAY_MS    = 28000;  // time on page before it may appear
  var SCROLL_PCT  = 0.45;   // ...or this far down the page, whichever lands first
  var SNOOZE_DAYS = 14;     // closed without answering: wait this long, then ask again
  var MIN_MS      = 4000;   // never appear sooner than this, even on exit intent

  /* ---------- memory (never throws, even with storage blocked) ---------- */

  function remember(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ state: state, at: Date.now() }));
    } catch (e) { /* private mode, blocked cookies: just don't remember */ }
  }

  function recall() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); }
    catch (e) { return null; }
  }

  function shouldAsk() {
    var seen = recall();
    if (!seen) return true;
    if (seen.state === "followed" || seen.state === "already") return false;
    if (seen.state === "closed") {
      return (Date.now() - (seen.at || 0)) > SNOOZE_DAYS * 86400000;
    }
    return true;
  }

  if (!shouldAsk()) return;

  /* ---------- state ---------- */

  var root, panel, opener;
  var shown = false;
  var finished = false;   // asked and dealt with: never reopen this page load
  var startedAt = Date.now();
  var delayTimer = null, pendingTimer = null, onScroll = null, onExit = null;

  // Disarms every trigger. Called as soon as the prompt is shown or answered,
  // so nothing can reopen it behind the visitor's back.
  function disarm() {
    if (delayTimer) { clearTimeout(delayTimer); delayTimer = null; }
    if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; }
    if (onScroll) { window.removeEventListener("scroll", onScroll); onScroll = null; }
    if (onExit) { document.removeEventListener("mouseout", onExit); onExit = null; }
  }

  /* ---------- build ---------- */

  function build() {
    root = document.createElement("div");
    root.className = "fp-veil";
    root.innerHTML = [
      '<div class="fp-card" role="dialog" aria-modal="true" aria-labelledby="fp-h" aria-describedby="fp-b">',
        '<button class="fp-x" type="button" aria-label="Close">&times;</button>',
        '<img class="fp-face" src="/assets/avatar.jpg" alt="">',
        '<p class="fp-eyebrow mono">One ask</p>',
        '<h2 class="fp-h display" id="fp-h">Follow me on X</h2>',
        '<p class="fp-b" id="fp-b">Everything on this site started as a post. When I find the next one, that is where it goes first. No course, no newsletter, no funnel.</p>',
        '<a class="fp-yes display" href="' + PROFILE + '" target="_blank" rel="noopener">Follow @Abomination81</a>',
        '<button class="fp-no mono" type="button">I already follow you</button>',
      '</div>'
    ].join("");
    document.body.appendChild(root);

    panel = root.querySelector(".fp-card");
    root.querySelector(".fp-yes").addEventListener("click", function () { answer("followed"); });
    root.querySelector(".fp-no").addEventListener("click", function () { answer("already"); });
    root.querySelector(".fp-x").addEventListener("click", function () { answer("closed"); });
    root.addEventListener("mousedown", function (e) {
      if (e.target === root) answer("closed");
    });
    document.addEventListener("keydown", onKey);
  }

  /* ---------- focus handling ---------- */

  function onKey(e) {
    if (!shown) return;
    if (e.key === "Escape") { answer("closed"); return; }
    if (e.key !== "Tab" || !panel) return;
    var f = panel.querySelectorAll("a[href], button");
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- show / answer ---------- */

  function show() {
    if (finished || shown) return;
    if (!shouldAsk()) { finished = true; disarm(); return; }
    shown = true;
    disarm();               // one prompt per page load, whatever happens next
    opener = document.activeElement;
    build();
    requestAnimationFrame(function () {
      if (!root) return;
      root.classList.add("is-open");
      var yes = root.querySelector(".fp-yes");
      if (yes) yes.focus();
    });
  }

  // Every exit from the prompt goes through here, so the answer is always
  // recorded and the triggers are always disarmed.
  function answer(state) {
    if (finished) return;
    finished = true;
    remember(state);
    disarm();
    close(state === "followed");
  }

  function close(keepFocus) {
    shown = false;
    document.removeEventListener("keydown", onKey);
    var dying = root;
    root = null;
    panel = null;
    if (dying) {
      dying.classList.remove("is-open");
      setTimeout(function () {
        if (dying.parentNode) dying.parentNode.removeChild(dying);
      }, 220);
    }
    if (!keepFocus && opener && opener.focus) { try { opener.focus(); } catch (e) {} }
  }

  /* ---------- triggers ---------- */

  function trigger() {
    if (finished || shown || pendingTimer) return;
    if (!shouldAsk()) { finished = true; disarm(); return; }
    var wait = MIN_MS - (Date.now() - startedAt);
    if (wait > 0) {
      // Honour an early trigger late rather than dropping it, so someone who
      // scrolls straight down still gets asked.
      pendingTimer = setTimeout(function () { pendingTimer = null; show(); }, wait);
      return;
    }
    show();
  }

  function arm() {
    delayTimer = setTimeout(trigger, DELAY_MS);

    onScroll = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= SCROLL_PCT) trigger();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    // Also check on arrival: a restored scroll position or an anchor link can
    // land the visitor deep in the page without ever firing a scroll event.
    onScroll();

    // Exit intent, pointer devices only. Phones get the timer and scroll rules.
    if (window.matchMedia && window.matchMedia("(hover: hover)").matches) {
      onExit = function (e) {
        if (!e.relatedTarget && e.clientY <= 0) trigger();
      };
      document.addEventListener("mouseout", onExit);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arm);
  } else {
    arm();
  }
})();
