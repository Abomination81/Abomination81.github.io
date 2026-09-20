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
| Shared styling | `assets/site.css`, used by every page. |
| Follow prompt | `assets/follow.js`. Timing, wording and the snooze window are the constants at the top of the file. Answering it is remembered in the browser, so it asks once. |
| Featured post | The `.featured` block in `#band`. |

## Deploying

Run `python3 stamp.py` first. It tags the stylesheet and script URLs in every page with a content hash so returning visitors never get new HTML with a cached old stylesheet. Then push to `main`; GitHub Pages publishes automatically.
