# 1688 bookmarklet

A bookmark that, when tapped while looking at a real m.1688.com page in
your own phone/browser, reads the products on that page and sends them to
your site. Because it's *you*, in your own real browser session, browsing
normally - there's no bot for 1688 to detect or block. This is the most
reliable way to get product data in, but it's manual: it only updates
whichever page you're looking at when you tap it, unlike `scraper/`
(automatic, but can get blocked) which this can be used alongside or
instead of.

## One-time setup

**1. Pick a secret and set it on Vercel.** Any random string works. On
Vercel: Project Settings -> Environment Variables -> add `INGEST_SECRET`
with that value, then redeploy (or just wait for the next deploy) so
`/api/ingest` picks it up. `bookmarklet/extract.js`'s `CONFIG.secret`
already has the site owner's chosen value baked in - if you ever change
`INGEST_SECRET` on Vercel, update it there too and regenerate (`node
build.mjs` inside `bookmarklet/`) before re-copying step 2's file.

**2. Copy the bookmarklet text.** Open `bookmarklet/bookmarklet.txt` in
this repo on GitHub, tap it, then tap "Raw". Select all and copy - the
whole file is exactly one line meant to be copied whole, nothing else in
it to strip out first. (It's URL-encoded rather than plain-text
JavaScript, on purpose: a mobile bookmark's URL field is a single-line
box, and pasting real newlines into one has been observed to get silently
dropped by at least one Android Chrome build. Percent-encoding keeps it
on one line with nothing a form field would try to "clean up" - the
browser decodes it the same as the plain form once the bookmark is
tapped.)

**3. Save it as a bookmark, with that text as the URL.** Browsers block
typing/pasting a `javascript:` link directly into the main address bar
(security measure), but editing an *existing* bookmark's URL still works:

- **Android Chrome does NOT work for this** - confirmed by testing: the
  bookmark saves fine (URL and all), but tapping it from the Bookmarks
  list silently does nothing, no popup, no error. Chrome appears to
  block running a `javascript:` bookmarklet from its bookmarks UI
  entirely, with no workaround found.
- **Firefox for Android works** (confirmed) - install it from the Play
  Store if needed. Bookmark any page first (star icon, or menu -> "Save
  to bookmark"). Then menu (☰) -> Bookmarks -> find that bookmark -> "..."
  next to it -> Edit -> replace the URL field with the copied text ->
  Save. Name it something like "1688 -> Lefong".
- **iOS Safari:** not tested here, but bookmarklets are generally
  expected to work the same way as Firefox's: bookmark any page (share
  icon -> Add Bookmark), then Bookmarks -> Edit -> tap that bookmark ->
  replace the URL -> Done.

## Using it

The same bookmark works on all three kinds of m.1688.com page - which one
runs is decided automatically from the page's URL, nothing to switch:

1. Browse m.1688.com normally and either search for something (e.g.
   `m.1688.com/offer_search/-6D7033.html?keywords=phone case`), open a
   product's page, or just sit on 1688's own homepage
   (`m.1688.com/`).
2. Open your bookmarks and tap the one you saved.
3. A popup reports what happened ("OK! 11 produit voarakitra." or an
   error):
   - **Search page** - everything visible is sent under that search
     keyword; this is what the site's own search box and category chips
     read from.
   - **Product page** - that one product's full detail (extra photos,
     description) is sent, filling in beyond what a search-card summary
     alone has.
   - **Homepage** - sent under a fixed slot the site's Home page mixes in
     for variety, alongside its regular keyword list. 1688's homepage
     wraps a lot of its own cards in an ad-click-tracker link rather than
     a real product link, so this can find noticeably fewer items than a
     search page does, or none at all some days - that's expected, not a
     bug, whatever real links happen to be there still get sent.
4. Check the site (`/api/search?keyword=...` or the product's page) -
   should reflect what you just sent within moments. Re-sending a keyword
   or product already indexed updates it in place (price, title, sold
   count, ...) rather than duplicating it.

Repeat for as many keywords/products as you want indexed - there's no
rate limit or cooldown here, since it's not automated at all. If you'd
rather have separate bookmarks for clarity, save two with the exact same
URL and just name them differently (e.g. "1688 Search" and "1688 Home") -
the code is identical either way, since it auto-detects the page.

## If it stops working

- **"Nisy olana: Invalid or missing secret"** - the secret in the
  bookmarklet doesn't match `INGEST_SECRET` on Vercel. Redo step 2/3
  above with the current value.
- **"Tsy nahita produit..."** - 1688 changed its markup, or you're not
  actually on a search-results/product page. The selectors live in
  `extract.js` (same ones `scraper/lib/scrape1688.js` uses) - if 1688's
  own site works fine in the browser but this keeps finding nothing,
  that file is what needs updating.
- Nothing happens at all when tapped - the bookmark's URL likely got
  saved without the full `javascript:...` text (mobile browsers
  sometimes truncate very long pasted text in form fields, or leave out
  characters from the middle). Reopen the bookmark's Edit screen and
  check the URL field starts with `javascript:%3B` and ends with `%7D)()`
  - if it's shorter than that or cuts off mid-way, redo the copy/paste
  (copying from a notes app instead of directly off the GitHub page can
  help if the browser's copy button is the thing truncating it).
