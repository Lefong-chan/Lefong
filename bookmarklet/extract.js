// Readable source for the bookmarklet described in README.md. Not loaded
// by anything directly - bookmarklet.txt (generated from this file) is
// what actually gets pasted into a browser bookmark's URL field.
//
// Runs in the site owner's own real browser, on the real m.1688.com page
// they're already looking at - this is what makes it not a bot: there's
// no automation, no headless browser, just the page's own DOM read by a
// script the owner chose to run, then POSTed to /api/ingest (see there).
//
// Edit CONFIG.api / CONFIG.secret below, then regenerate bookmarklet.txt
// (see README.md) after any change here.
;(function () {
  var CONFIG = {
    api: 'https://lefong.vercel.app/api/ingest',
    secret: 'PASTE_YOUR_INGEST_SECRET_HERE'
  }

  function firstNumber(text) {
    if (!text) return null
    var m = String(text).replace(/,/g, '').match(/[\d.]+/)
    return m ? parseFloat(m[0]) : null
  }

  // 1688's card/detail images lazy-load: `src` is a blank placeholder
  // until it scrolls into view - the real URL is already sitting in one
  // of these data-* attributes.
  function realImageSrc(imgEl) {
    if (!imgEl) return ''
    var attrs = ['data-src', 'data-original', 'data-lazy-src', 'data-ks-lazyload', 'data-echo']
    for (var i = 0; i < attrs.length; i++) {
      var val = imgEl.getAttribute(attrs[i])
      if (val && val.indexOf('data:') !== 0) return val
    }
    var src = imgEl.getAttribute('src') || ''
    return src.indexOf('data:') === 0 ? '' : src
  }

  function text(el) {
    return el ? el.textContent.trim() : ''
  }

  function offerIdFromHref(href) {
    if (!href) return null
    var m = href.match(/\/offer\/(\d+)\.html/)
    return m ? m[1] : null
  }

  function extractCards() {
    var anchors = Array.prototype.slice.call(document.querySelectorAll('a[href*="/offer/"]'))
    var seen = {}
    var cards = []
    anchors.forEach(function (a) {
      var itemId = offerIdFromHref(a.getAttribute('href') || a.href || '')
      if (!itemId || seen[itemId]) return
      var card = a.closest('[class*="goods"], [class*="offer"], [class*="item"], [class*="card"]') || a
      var titleEl = card.querySelector('[class*="title"]') || a
      var imgEl = card.querySelector('img')
      var priceEl = card.querySelector('[class*="price"] [class*="money"], [class*="current-money"], [class*="price"]')
      var soldEl = card.querySelector('[class*="sold"], [class*="sale"]')
      var shopEl = card.querySelector('[class*="shop"], [class*="company"], [class*="seller"]')
      var title = text(titleEl) || a.getAttribute('title') || (imgEl && imgEl.getAttribute('alt')) || ''
      var price = firstNumber(priceEl ? priceEl.textContent : '')
      if (!title || price === null) return
      seen[itemId] = true
      cards.push({
        itemId: itemId,
        title: title,
        image: realImageSrc(imgEl),
        price: price,
        sales: firstNumber(soldEl ? soldEl.textContent : ''),
        shopName: text(shopEl),
        link: 'https://detail.1688.com/offer/' + itemId + '.html'
      })
    })
    return cards
  }

  function extractDetail() {
    var ogTitleEl = document.querySelector('meta[property="og:title"]')
    var ogImageEl = document.querySelector('meta[property="og:image"]')
    var titleEl = document.querySelector('[class*="title"]')
    var priceEl = document.querySelector('[class*="price"] [class*="money"], [class*="current-money"], [class*="price"]')
    var shopEl = document.querySelector('[class*="shop"], [class*="company"], [class*="seller"]')
    var descEl = document.querySelector('[class*="description"], [class*="detail-content"], [class*="rich-text"]')
    var imgs = Array.prototype.slice
      .call(document.querySelectorAll('[class*="thumb"] img, [class*="gallery"] img, [class*="main-img"] img'))
      .map(realImageSrc)
      .filter(Boolean)
    var idMatch = location.pathname.match(/\/offer\/(\d+)\.html/)
    return {
      itemId: idMatch ? idMatch[1] : null,
      title: text(titleEl) || (ogTitleEl ? ogTitleEl.content : ''),
      image: (ogImageEl ? ogImageEl.content : '') || imgs[0] || '',
      images: imgs,
      price: firstNumber(priceEl ? priceEl.textContent : ''),
      shopName: text(shopEl),
      description: descEl ? descEl.innerHTML : ''
    }
  }

  function send(payload) {
    fetch(CONFIG.api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Ingest-Secret': CONFIG.secret },
      body: JSON.stringify(payload)
    })
      .then(function (r) {
        return r.json()
      })
      .then(function (data) {
        if (data.ok) {
          alert('OK! ' + (data.saved !== undefined ? data.saved + ' produit voarakitra.' : 'Voarakitra ny produit.'))
        } else {
          alert('Nisy olana: ' + (data.error || 'tsy fantatra'))
        }
      })
      .catch(function (err) {
        alert('Nisy olana: ' + err.message)
      })
  }

  var isSearchPage = location.pathname.indexOf('/offer_search/') !== -1
  var isDetailPage = /\/offer\/\d+\.html/.test(location.pathname)

  if (isSearchPage) {
    var keyword = new URLSearchParams(location.search).get('keywords') || ''
    var items = extractCards()
    if (!keyword) {
      alert('Tsy hita ny teny nokarohina (keyword).')
    } else if (!items.length) {
      alert("Tsy nahita produit teto amin'ity pejy ity.")
    } else {
      send({ type: 'search', keyword: keyword, items: items })
    }
  } else if (isDetailPage) {
    var detail = extractDetail()
    if (!detail.itemId || !detail.title) {
      alert("Tsy nahita antsipirian'ny produit teto.")
    } else {
      send({ type: 'product', detail: detail })
    }
  } else {
    alert('Ity pejy ity dia tsy pejy fikarohana na pejy produit 1688. Mitadiava teny voalohany, na sokafy produit iray.')
  }
})()
