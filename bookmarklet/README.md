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

**1. Pick a secret and set it on Vercel.** Any random string works, e.g.
`sino2026secret`. On Vercel: Project Settings -> Environment Variables ->
add `INGEST_SECRET` with that value, then redeploy (or just wait for the
next deploy) so `/api/ingest` picks it up.

**2. Put that same secret into the bookmarklet.** Open
`bookmarklet/bookmarklet.txt` in this repo (view it on GitHub - tap the
file, then the "Raw" button) and copy the "Raw" bookmarklet text (the
long line starting with `javascript:;(function`). If your domain isn't
`lefong.vercel.app`, or you changed `INGEST_SECRET`, edit
`bookmarklet/extract.js`'s `CONFIG` first and regenerate (`node build.mjs`
inside `bookmarklet/`) before copying - otherwise the copy from
`bookmarklet.txt` already has the placeholder secret that needs replacing:
find `PASTE_YOUR_INGEST_SECRET_HERE` in the copied text and replace it
with your actual secret before saving the bookmark in step 3.

**3. Save it as a bookmark, with that text as the URL.** Browsers block
typing/pasting a `javascript:` link directly into the main address bar
(security measure), but editing an *existing* bookmark's URL still works
everywhere:

- **Android Chrome:** bookmark any page first (star icon, or menu ->
  "Add to bookmarks"). Then menu (⋮) -> Bookmarks -> find that bookmark ->
  tap the three dots next to it -> Edit -> replace the URL field with the
  bookmarklet text -> Save. Name it something like "1688 -> Lefong".
- **iOS Safari:** bookmark any page (share icon -> Add Bookmark). Then
  Bookmarks -> Edit -> tap that bookmark -> replace the URL -> Done.

If the browser strips quotes or otherwise mangles the raw version, use
the URL-encoded alternative further down in `bookmarklet.txt` instead -
functionally identical, just safer for a form field that tries to
"clean up" what you paste.

## Using it

1. Browse m.1688.com normally and search for something (e.g.
   `m.1688.com/offer_search/-6D7033.html?keywords=phone case`) or open a
   product's page.
2. Open your bookmarks and tap the one you saved.
3. A popup reports what happened ("OK! 11 produit voarakitra." or an
   error). On a search page, everything visible on that page is sent
   under that search keyword; on a product page, that product's full
   detail (photos, description) is sent.
4. Check the site (`/api/search?keyword=...` or the product's page) -
   should reflect what you just sent within moments.

Repeat for as many keywords/products as you want indexed - there's no
rate limit or cooldown here, since it's not automated at all.

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
  sometimes truncate very long pasted text in form fields). Try the
  shorter URL-encoded version, or split viewing the raw text into a note
  app first to copy it fully before pasting into the bookmark editor.
