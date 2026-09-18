# abomination81.com

Landing page for [@Abomination81](https://x.com/Abomination81). Static, no build step, served by GitHub Pages.

## Editing

| What | Where |
| --- | --- |
| Quote rotation | `QUOTES` array near the bottom of `index.html`. One entry per quote: `["quote", "who said it"]`. Empty name prints no attribution. One shows per day, same for every visitor. |
| Follower / post counts | `stats.json`. The numbers written into `index.html` are the fallback if the fetch fails. |
| GitHub stars | Nothing to edit. Summed live from the GitHub API on page load. |
| Start here list | The `.row` links in the `#start-here` section. |
| Featured post | The `.featured` block in `#band`. |

## Deploying

Push to `main`. GitHub Pages publishes automatically.
