# 1688 scraper bot

Indexes product data from m.1688.com and writes it into the same Firebase
Realtime Database the site (`api/`) reads from. Runs on your own machine -
**not** on Vercel.

## Why this isn't part of the Vercel deployment

Earlier versions of this app tried scraping 1688 live, inside the Vercel
serverless functions, on every search request. 1688's anti-bot system
flatly refused those requests with a "访问被拒绝" (access denied) page,
even after the request looked exactly like a real mobile browser (correct
URL, correct markup, a real Android Chrome user agent, `navigator.webdriver`
patched out, etc.). That points to an IP-reputation block rather than a
fingerprint check - Vercel's serverless functions share a pool of
datacenter IPs, which are far more likely to already be on this kind of
blocklist than a normal home or mobile internet connection.

So instead: this bot runs wherever you keep it running (a home PC, an old
laptop, a Raspberry Pi, even a phone via Termux), searches 1688 for a
fixed list of keywords/categories (`api/_lib/scrapeTargets.js` - shared
with the site so both stay in sync), and saves normalized results to
Firebase. The site's `/api/search`, `/api/trending` and `/api/product`
endpoints just read whatever this bot last wrote - no live scraping happens
on Vercel anymore.

## Setup (one time)

```sh
cd scraper
npm install
npx playwright install chromium   # downloads a real Chromium for this machine
cp .env.example .env
# edit .env with the same FIREBASE_* values already set on Vercel
# (Vercel dashboard -> Project Settings -> Environment Variables)
```

## Running it

```sh
node index.js            # one pass over every keyword, then exits
node index.js --loop     # runs forever, sleeping SCRAPER_INTERVAL_HOURS between passes
```

A full pass takes a while on purpose - there's a random few-second delay
between every request so the bot doesn't hammer 1688 at a suspiciously
constant rate. Progress prints to the console as it goes.

## Keeping it running unattended

`--loop` keeps the process alive, but something still needs to keep the
process itself alive across reboots/crashes and (for a phone) the OS not
killing a backgrounded app:

- **Home PC / Raspberry Pi (Linux/macOS):** run it under a process
  manager like `pm2` (`npm install -g pm2 && pm2 start index.js --
  --loop`), or a `systemd` service, or a `cron` job that runs `node
  index.js` (no `--loop`) on a schedule instead.
- **Windows:** Task Scheduler running `node index.js` on a schedule, or
  run it inside WSL with `pm2`/`cron` as above.
- **Android phone:** install Termux, run the setup above inside it, and
  use Termux:Boot / `termux-wake-lock` so it survives the screen locking
  and phone reboots.

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
