# abomination81.com

Landing page for [@Abomination81](https://x.com/Abomination81). Static, no build step, served by GitHub Pages.

## Editing

| What | Where |
| --- | --- |
| Quote rotation | `QUOTES` array near the bottom of `index.html`. One entry per quote: `["quote", "who said it"]`. Empty name prints no attribution. One shows per day, same for every visitor. |
| Follower / post counts | `stats.json`. The numbers written into `index.html` are the fallback if the fetch fails. |
| GitHub stars | Nothing to edit. Summed live from the GitHub API on page load. |
| Start here list | The `.row` links in the `#start-here` section of `index.html`. |
| Side hustles | `side_hustles/index.html`. One `.hitem` block per hustle: number, title, amount, description, link. |
| Favicon / icons | `favicon.ico` and `assets/icons/`: the eye for tab sizes (16, 32, 48), the face for home screens (180, 192, 512, plus a maskable 512). `site.webmanifest` lists the install icons. Source is the session scratchpad under `favicon/`. |
| Share card | `assets/og/card-*.jpg` (1200x630, every platform) and `card-x-*.jpg` (1200x600, X's 2:1 crop). Filenames carry a content hash so X and Facebook fetch a fresh card when it changes. Source HTML lives in the session scratchpad under `cards/`. |
| Display font | `assets/fonts/anton-latin.woff2`, self-hosted and preloaded from each page's head so the hero wordmark never renders in a fallback first. Body faces still come from Google. |
| Shared styling | `assets/site.css`, used by every page. |
| Hero variants | `assets/hero.js` swaps the portrait for a video when the URL has `?hero=kling`, `?hero=seedance` or `?hero=hailuo`. Files live in `assets/hero/`. Kling and Seedance loop natively and are cut straight; Hailuo is a ping-pong because it does not return to its first frame. The unlisted `/ab/` page compares them. |
| Follow prompt | `assets/follow.js`. Timing, wording and the snooze window are the constants at the top of the file. Answering it is remembered in the browser, so it asks once. |
| Featured post | The `.featured` block in `#band`. |

## Deploying

Run `python3 stamp.py` first. It tags the stylesheet and script URLs in every page with a content hash so returning visitors never get new HTML with a cached old stylesheet. Then push to `main`; GitHub Pages publishes automatically.
