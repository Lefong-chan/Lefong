# 1688 scraper bot

Indexes product data from m.1688.com and writes it into the same Firebase
Realtime Database the site (`api/`) reads from.

## Why this isn't part of the Vercel deployment

Earlier versions of this app tried scraping 1688 live, inside the Vercel
serverless functions, on every search request. 1688's anti-bot system
flatly refused those requests with a "访问被拒绝" (access denied) page,
even after the request looked exactly like a real mobile browser (correct
URL, correct markup, a real Android Chrome user agent, `navigator.webdriver`
patched out, etc.). That points to an IP-reputation block rather than a
fingerprint check - Vercel's serverless functions share a pool of
datacenter IPs, which are far more likely to already be on this kind of
blocklist than a normal home/mobile connection.

So instead, this bot needs to run somewhere with a different IP, and
writes normalized results to Firebase; the site's `/api/search`,
`/api/trending` and `/api/product` endpoints just read whatever it last
wrote - no live scraping happens on Vercel.

## What to expect while it's still catching up

1688 only tolerates a handful of requests per run before throwing up a
CAPTCHA wall ("验证码拦截") - a real run showed the very first search and
first detail page succeed, then everything after blocked. So each run
only works through a small batch of keywords (`SCRAPER_BATCH_SIZE`,
default 3) and a couple of detail pages each (`SCRAPER_DETAILS_PER_KEYWORD`,
default 2), stopping immediately at the first block instead of wasting
the rest of the run. It prioritizes keywords that have never been
indexed yet, so repeated runs gradually work through the full list
(`api/_lib/scrapeTargets.js`) rather than re-rolling the same few.

Until that catches up, expect:

- **The site shows the same handful of products for a while** - only the
  keywords that have actually succeeded have anything to show; the
  homepage/search draw from whatever's cached, which starts out being
  just one or two keywords' worth. Widens as more runs succeed.
- **A newly-found item shows up with just its search-card info at
  first** (title/price/image/link, no extra photos or description) -
  its own detail page is only fetched once the batch gets to it, on this
  run or a later one; see `_lib/normalize.js` for the exact fallback
  shape.

## Option A: GitHub Actions (no PC/phone setup needed)

`.github/workflows/scrape-1688.yml` runs this bot on GitHub's own servers
on a schedule, with no device of your own required to be online - useful
if you don't have a computer to dedicate to running this yourself. Worth
trying first, though GitHub's runners are also cloud/datacenter IPs, so
there's a real chance 1688 blocks these too the same way it blocked
Vercel's - there's no way to know without trying it.

Setup (all done on github.com, no terminal needed):

1. Get the four Firebase values already configured on Vercel: open the
   Vercel dashboard for this project -> Settings -> Environment Variables,
   and note `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`,
   `FIREBASE_PRIVATE_KEY`, `FIREBASE_DATABASE_URL`.
2. On GitHub, open this repository -> Settings -> Secrets and variables ->
   Actions -> "New repository secret". Add all four, using the exact same
   names and values as step 1 (paste `FIREBASE_PRIVATE_KEY` exactly as it
   appears on Vercel, `\n` sequences and all).
3. Open the repository's "Actions" tab -> "Scrape 1688" (in the left list)
   -> "Run workflow" button -> "Run workflow" again to confirm. This
   triggers one pass immediately instead of waiting for the schedule.
4. Click into the run that appears to watch its progress/logs. It's
   indexing correctly if you see lines like `search "phone case"... 24
   items` for each keyword; `FAILED` lines (especially ones mentioning
   "访问被拒绝" or "blocked") mean 1688 is refusing GitHub's IPs too, in
   which case there's no remaining free option - see the note at the
   bottom of this file.
5. Once a run finishes successfully, the site should start showing real
   products within a few minutes.

The workflow re-runs automatically every 12 hours after that (adjust the
`cron` line in the workflow file to change how often); use "Run workflow"
any time to trigger an extra pass on demand.

## Option B: run it yourself, on your own machine

If you have a computer (or a phone with Termux) you're fine leaving on
periodically, running it directly gives you more control (live console
output, immediate re-runs) than waiting on GitHub Actions.

```sh
cd scraper
npm install
npx playwright install chromium   # downloads a real Chromium for this machine
cp .env.example .env
# edit .env with the same FIREBASE_* values already set on Vercel
```

```sh
node index.js            # one pass over every keyword, then exits
node index.js --loop     # runs forever, sleeping SCRAPER_INTERVAL_HOURS between passes
```

To keep `--loop` alive unattended: a process manager like `pm2` on a home
PC/Raspberry Pi, a `systemd` service, a `cron` job running `node index.js`
(no `--loop`) on a schedule instead, Windows Task Scheduler, or on Android
via Termux + Termux:Boot/`termux-wake-lock`.

## Adding or changing what gets indexed

Edit `api/_lib/scrapeTargets.js` (`CATEGORIES` for the homepage chips,
`DEFAULT_KEYWORDS` for the generic trending pool) - this file is shared
with the site itself, so a change here is picked up by both the next
scraper run and `/api/categories`.

## If 1688 changes its markup

Every card/detail selector lives in `lib/scrape1688.js`, written with
broad fallbacks (`[class*="title"]` rather than one exact class) so small
template changes hopefully don't break extraction outright. If a keyword
comes back with 0 items where it used to have some, that file is the
place to fix.

## If every free option gets blocked

If GitHub Actions' IPs turn out to be blocked the same way Vercel's were,
that's the end of what's fixable for free - both are shared cloud IP
ranges, and 1688's block is IP-reputation-based rather than something an
in-browser fix can get around (see "Why this isn't part of the Vercel
deployment" above). The remaining options all cost money: a residential/
mobile proxy service routed through this bot's browser, or a paid VPS
with a cleaner IP reputation.
