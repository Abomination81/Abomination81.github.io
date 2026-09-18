/* Follow prompt.
 *
 * Shows once per visitor, never on arrival. It waits for the visitor to either
 * spend real time on the page, scroll a meaningful way down, or move to leave.
 *
 * Answering it is final. "Follow" and "I already follow you" both stop it
 * permanently. Closing it without answering snoozes it for SNOOZE_DAYS.
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

  /* ---------- build ---------- */

  var root, panel, opener, armed = false, shown = false, pending = null;
  var startedAt = Date.now();

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
    root.querySelector(".fp-yes").addEventListener("click", function () {
      remember("followed");
      close(true);
    });
    root.querySelector(".fp-no").addEventListener("click", function () {
      remember("already");
      close();
    });
    root.querySelector(".fp-x").addEventListener("click", function () {
      remember("closed");
      close();
    });
    root.addEventListener("mousedown", function (e) {
      if (e.target === root) { remember("closed"); close(); }
    });
    document.addEventListener("keydown", onKey);
  }

  /* ---------- focus handling ---------- */

  function focusables() {
    return panel.querySelectorAll("a[href], button");
  }

  function onKey(e) {
    if (!shown) return;
    if (e.key === "Escape") { remember("closed"); close(); return; }
    if (e.key !== "Tab") return;
    var f = focusables();
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- show / close ---------- */

  function show() {
    if (shown) return;
    shown = true;
    opener = document.activeElement;
    build();
    // let the element land before transitioning, so it animates in
    requestAnimationFrame(function () {
      root.classList.add("is-open");
      var yes = root.querySelector(".fp-yes");
      if (yes) yes.focus();
    });
  }

  function close(keepScroll) {
    if (!root) return;
    shown = false;
    root.classList.remove("is-open");
    document.removeEventListener("keydown", onKey);
    setTimeout(function () {
      if (root && root.parentNode) root.parentNode.removeChild(root);
      root = null;
    }, 220);
    if (!keepScroll && opener && opener.focus) { try { opener.focus(); } catch (e) {} }
  }

  /* ---------- triggers ---------- */

  // A trigger that fires inside the MIN_MS floor is honoured late rather than
  // dropped, so someone who scrolls straight down still gets asked.
  function trigger() {
    if (shown || pending) return;
    var wait = MIN_MS - (Date.now() - startedAt);
    if (wait > 0) { pending = setTimeout(show, wait); return; }
    show();
  }

  function arm() {
    if (armed) return;
    armed = true;

    setTimeout(trigger, DELAY_MS);

    function checkScroll() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= SCROLL_PCT) {
        window.removeEventListener("scroll", checkScroll);
        trigger();
      }
    }
    window.addEventListener("scroll", checkScroll, { passive: true });
    // Also check on arrival: a restored scroll position or an anchor link can
    // land the visitor deep in the page without ever firing a scroll event.
    checkScroll();

    // Exit intent, pointer devices only. Phones get the timer and scroll rules.
    if (window.matchMedia && window.matchMedia("(hover: hover)").matches) {
      document.addEventListener("mouseout", function (e) {
        if (!e.relatedTarget && e.clientY <= 0) trigger();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arm);
  } else {
    arm();
  }
})();
