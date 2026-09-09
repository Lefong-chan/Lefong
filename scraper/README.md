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
