(function injectFocusStyle() {
  const s = document.createElement('style');
  s.id = 'kbnav-style';
  s.textContent = `
    :focus { outline: none !important; }
    .kbf {
      outline: 2px solid #e50914 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 3px rgba(229,9,20,.35) !important;
    }
  `;
  document.head.appendChild(s);
})();

const KBN = {
  cur:            null,
  lastGrid:       null,
  lastClist:      null,
  playerOvTimer:  null,
};

function kbFocus(el) {
  if (!el) return;
  if (KBN.cur && KBN.cur !== el) {
    KBN.cur.classList.remove('kbf');
    if (KBN.cur.tagName === 'INPUT' || KBN.cur.tagName === 'TEXTAREA') {
      KBN.cur.blur();
    }
  }
  KBN.cur = el;
  el.classList.add('kbf');
  try { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch(e) {}
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    el.focus();
  }
}

function isPlayerActive() {
  const pv = document.getElementById('playerview');
  return pv && pv.style.display !== 'none' && pv.style.display !== '';
}
function isWelcomeVisible() {
  const w = document.getElementById('welcomeScr');
  return w && w.style.display !== 'none' && w.style.display !== '';
}
function isGridVisible() {
  const gv = document.getElementById('gridview');
  return gv && gv.style.display !== 'none' && gv.style.display !== '';
}
function isFullScreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
}
function isTabActive(which) {
  const tabC  = document.getElementById('tabC');
  const tabCh = document.getElementById('tabCh');
  if (which === 'sources')  return tabC  && tabC.classList.contains('active');
  if (which === 'channels') return tabCh && tabCh.classList.contains('active');
  return false;
}
function isChSubpanelVisible() {
  const sub = document.getElementById('chsubpanel');
  return sub && sub.style.display !== 'none' && sub.style.display !== '';
}
function isCmdOpen() {
  const c = document.getElementById('cmdbg');
  return c && c.classList.contains('open');
}
function isSrcModalOpen() {
  const s = document.getElementById('srcModal');
  return s && s.classList.contains('open');
}
function isConfirmModalOpen() {
  const c = document.getElementById('confirmModal');
  return c && c.style.display === 'flex';
}

function getSrcItems()    { return Array.from(document.querySelectorAll('#srcItems .src-item')); }
function getRegionItems() { return Array.from(document.querySelectorAll('#regionItems .src-item[data-region-id]')); }
function getClistItems()  { return Array.from(document.querySelectorAll('#clist .citem')); }
function getChlistItems() { return Array.from(document.querySelectorAll('#chlist .chitem')); }
function getGridCards()   { return Array.from(document.querySelectorAll('#chgrid .gcard')); }
function getWcardUrl()    { return document.querySelector('.welcome-cards .wcard:first-child'); }
function getWcardFile()   { return document.querySelector('.welcome-cards .wcard:last-child'); }
function idxOf(list, el)  { return list.indexOf(el); }

function getGridCols() {
  const grid = document.getElementById('chgrid');
  if (!grid) return 1;
  if (grid.classList.contains('list')) return 1;
  const tpl = window.getComputedStyle(grid).gridTemplateColumns;
  if (!tpl || tpl === 'none') return 1;
  return tpl.split(' ').filter(Boolean).length || 1;
}

function goRight() {
  if (!isWelcomeVisible()) {
    const g = (KBN.lastGrid && document.contains(KBN.lastGrid))
      ? KBN.lastGrid
      : (getGridCards()[0] || null);
    if (g) { kbFocus(g); return; }
  }
  const wurl = getWcardUrl();
  if (wurl) kbFocus(wurl);
}

function goFootUp() {
  if (KBN.lastGrid && document.contains(KBN.lastGrid)) {
    kbFocus(KBN.lastGrid);
    return;
  }
  const cards = getGridCards();
  if (cards.length && isGridVisible()) {
    kbFocus(cards[0]);
    return;
  }
  const wurl = getWcardUrl();
  if (wurl) kbFocus(wurl);
}

function openDeleteModalForCurrent() {
  if (!KBN.cur) return;
  const item = KBN.cur.closest('.src-item[data-src-idx]');
  if (!item) return;
  const idx = parseInt(item.dataset.srcIdx);
  if (!isNaN(idx)) { try { delSource({ stopPropagation: ()=>{} }, idx); } catch(err){} }
}

function _modalFocus(el) {
  if (!el) return;
  if (KBN.cur) KBN.cur.classList.remove('kbf');
  KBN.cur = el;
  el.classList.add('kbf');
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.focus();
  else if (el.focus) el.focus();
  try { el.scrollIntoView({ block: 'nearest' }); } catch(e){}
}

function onKey(e) {

  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openCmd(); return; }

  if (e.key === 'Escape') {
    if (isCmdOpen())          { closeCmd(); return; }
    if (isSrcModalOpen())     { closeModal(); return; }
    if (isConfirmModalOpen()) { document.getElementById('confirmModal').style.display = 'none'; return; }
    if (isFullScreen()) {
      try { (document.exitFullscreen||document.webkitExitFullscreen||document.mozCancelFullScreen).call(document); } catch(err){}
    }
    return;
  }

  if (isCmdOpen()) {
    const items = document.querySelectorAll('#cmdlist .cmditem');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      cmdSelIdx = Math.min(cmdSelIdx+1, items.length-1);
      items.forEach((it,i) => it.classList.toggle('sel', i===cmdSelIdx));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      cmdSelIdx = Math.max(cmdSelIdx-1, 0);
      items.forEach((it,i) => it.classList.toggle('sel', i===cmdSelIdx));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      /* FIX: ← ou → ferme la palette */
      e.preventDefault();
      closeCmd();
    } else if (e.key === 'Enter' && cmdSelIdx >= 0) {
      try { cmdPlay(parseInt(items[cmdSelIdx].dataset.idx)); } catch(err){}
    }
    return;
  }

  /* Modale source */
  if (isSrcModalOpen()) { handleModalKey(e); return; }

  /* Modale confirmation */
  if (isConfirmModalOpen()) { handleConfirmModalKey(e); return; }

  /* Delete/Supr */
  if (e.key === 'Delete' || e.key === 'Supr' || e.keyCode === 46) {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    openDeleteModalForCurrent();
    return;
  }

  const nav = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter'].includes(e.key);
  if (!nav) return;

  /* Player actif */
  if (isPlayerActive()) { handlePlayerKey(e); return; }

  /* Init sans focus */
  if (!KBN.cur || !document.contains(KBN.cur)) {
    const tabSrc = document.getElementById('tabC');
    if (tabSrc) kbFocus(tabSrc);
    e.preventDefault();
    return;
  }

  e.preventDefault();
  const cur = KBN.cur;

  /* Dispatch */
  if (cur.classList.contains('sbtab'))                                                          { handleSbtabKey(cur, e.key); return; }
  if (cur.classList.contains('src-item') && cur.closest('#srcItems'))                           { handleSrcItemKey(cur, e.key); return; }
  if (cur.classList.contains('add-src-btn'))                                                    { handleAddSrcBtnKey(e.key); return; }
  if (cur.classList.contains('src-item') && cur.closest('#regionItems'))                        { handleRegionKey(cur, e.key); return; }
  if (cur.id === 'chpname' || cur.classList.contains('chpname'))                                { handleChpnameKey(e.key); return; }
  if (cur.classList.contains('citem'))                                                          { handleClistKey(cur, e.key); return; }
  if (cur.classList.contains('chitem'))                                                         { handleChlistKey(cur, e.key); return; }
  if (cur.id === 'chfilter' || cur.classList.contains('chfinput'))                              { handleChfinputKey(e.key); return; }
  if (cur.id === 'backToGroups' || cur.classList.contains('backbtn'))                           { handleBackbtnKey(e.key); return; }
  if (cur.classList.contains('vbtn') && (cur.getAttribute('onclick')||'').includes("'grid'"))  { handleVbtnGridKey(e.key); return; }
  if (cur.classList.contains('vbtn') && (cur.getAttribute('onclick')||'').includes("'list'"))  { handleVbtnListKey(e.key); return; }
  if (cur.classList.contains('gcard'))                                                          { handleGridKey(cur, e.key); return; }
  if (cur.id === 'msearch')                                                                     { handleMsearchKey(e.key); return; }
  if (cur.classList.contains('hbtn') && cur.classList.contains('desktop-only'))                { handleHbtnDesktopKey(e.key); return; }
  if (cur.classList.contains('hbtn') && cur.classList.contains('red'))                         { handleHbtnRedKey(e.key); return; }
  if (cur.classList.contains('footlink') && (cur.getAttribute('href')||'').startsWith('tel:')) { handleFootPhoneKey(e.key); return; }
  if (cur.classList.contains('footlink') && (cur.getAttribute('href')||'').includes('facebook')){ handleFootFbKey(e.key); return; }
  if (cur.classList.contains('wcard') && cur === getWcardUrl())                                 { handleWcardUrlKey(e.key); return; }
  if (cur.classList.contains('wcard') && cur === getWcardFile())                                { handleWcardFileKey(e.key); return; }
}

/* ============================================================
   HANDLERS PAR ZONE
   ============================================================ */

/* .sbtab */
function handleSbtabKey(cur, key) {
  const tabSrc = document.getElementById('tabC');
  const tabCh  = document.getElementById('tabCh');
  const isSrc  = (cur === tabSrc);
  const isCh   = (cur === tabCh);

  if (key === 'ArrowLeft') {
    if (isCh) kbFocus(tabSrc);
    return;
  }
  if (key === 'ArrowRight') {
    if (isSrc) { kbFocus(tabCh); return; }
    if (isCh)  { goRight(); return; }
    return;
  }
  if (key === 'ArrowUp') {
    const ms = document.getElementById('msearch'); if (ms) kbFocus(ms);
    return;
  }
  if (key === 'ArrowDown') {
    if (isSrc) {
      if (isTabActive('sources')) {
        const srcs = getSrcItems();
        if (srcs.length) { kbFocus(srcs[0]); return; }
        const btn = document.querySelector('.add-src-btn');
        if (btn) { kbFocus(btn); return; }
        const regs = getRegionItems();
        if (regs.length) { kbFocus(regs[0]); return; }
      } else {
        /* Sources tsy active et Chaînes active → Toutes les chaînes */
        if (isTabActive('channels') && !isChSubpanelVisible()) {
          const citems = getClistItems();
          if (citems.length) { kbFocus(citems[0]); return; }
        }
        if (isTabActive('channels') && isChSubpanelVisible()) {
          const chpn = document.getElementById('chpname');
          if (chpn) { kbFocus(chpn); return; }
        }
        const fl = document.querySelector('.footlinks .footlink');
        if (fl) kbFocus(fl);
      }
      return;
    }
    if (isCh) {
      if (isTabActive('channels')) {
        /* FIX: descend vers "Toutes les chaînes" (premier citem) */
        if (!isChSubpanelVisible()) {
          const citems = getClistItems();
          if (citems.length) { kbFocus(citems[0]); return; }
        }
        if (isChSubpanelVisible()) {
          const chpn = document.getElementById('chpname');
          if (chpn) { kbFocus(chpn); return; }
        }
        const fl = document.querySelector('.footlinks .footlink');
        if (fl) kbFocus(fl);
      } else {
        /* Chaînes tsy active */
        const srcs = getSrcItems();
        if (srcs.length) { kbFocus(srcs[0]); return; }
        const btn = document.querySelector('.add-src-btn');
        if (btn) { kbFocus(btn); return; }
      }
      return;
    }
  }
  if (key === 'Enter') {
    if (isSrc) switchTab('sources');
    if (isCh)  switchTab('channels');
  }
}

/* .srcItems */
function handleSrcItemKey(cur, key) {
  const srcs = getSrcItems();
  const idx  = idxOf(srcs, cur);
  if (key === 'ArrowLeft')  { openDeleteModalForCurrent(); return; }
  if (key === 'ArrowRight') { goRight(); return; }
  if (key === 'ArrowUp') {
    if (idx === 0) { const t = document.getElementById('tabCh'); if (t) kbFocus(t); }
    else kbFocus(srcs[idx-1]);
    return;
  }
  if (key === 'ArrowDown') {
    if (idx === srcs.length-1) { const b = document.querySelector('.add-src-btn'); if (b) kbFocus(b); }
    else kbFocus(srcs[idx+1]);
    return;
  }
  if (key === 'Enter') {
    const si = parseInt(cur.dataset.srcIdx);
    if (!isNaN(si)) { try { loadSource(si); } catch(err){} }
  }
}

/* .add-src-btn */
function handleAddSrcBtnKey(key) {
  if (key === 'ArrowLeft')  return;
  if (key === 'ArrowRight') { goRight(); return; }
  if (key === 'ArrowUp') {
    const srcs = getSrcItems();
    if (srcs.length) { kbFocus(srcs[srcs.length-1]); return; }
    const t = document.getElementById('tabCh'); if (t) kbFocus(t);
    return;
  }
  if (key === 'ArrowDown') {
    const regs = getRegionItems(); if (regs.length) kbFocus(regs[0]);
    return;
  }
  if (key === 'Enter') { try { openModal(); } catch(err){} }
}

/* Region items */
function handleRegionKey(cur, key) {
  const regs = getRegionItems();
  const idx  = idxOf(regs, cur);
  if (key === 'ArrowLeft')  return;
  if (key === 'ArrowRight') { goRight(); return; }
  if (key === 'ArrowUp') {
    if (idx === 0) { const b = document.querySelector('.add-src-btn'); if (b) { kbFocus(b); return; } }
    kbFocus(regs[Math.max(idx-1, 0)]);
    return;
  }
  if (key === 'ArrowDown') {
    if (idx === regs.length-1) { const fl = document.querySelector('.footlinks .footlink'); if (fl) kbFocus(fl); return; }
    kbFocus(regs[idx+1]);
    return;
  }
  if (key === 'Enter') {
    const rid = cur.dataset.regionId;
    if (rid) { try { loadRegion(rid); } catch(err){} }
  }
}

/* .chpname */
function handleChpnameKey(key) {
  if (key === 'ArrowLeft')  return;
  if (key === 'ArrowRight') { goRight(); return; }
  if (key === 'ArrowUp') { const t = document.getElementById('tabCh'); if (t) kbFocus(t); return; }
  if (key === 'ArrowDown') {
    const items = getClistItems(); if (items.length) kbFocus(items[0]);
    return;
  }
}

/* .clist items */
function handleClistKey(cur, key) {
  const items = getClistItems();
  const idx   = idxOf(items, cur);
  if (key === 'ArrowLeft')  return;
  if (key === 'ArrowRight') { goRight(); return; }
  if (key === 'ArrowUp') {
    if (idx === 0) {
      const chpn = document.getElementById('chpname');
      if (chpn) { kbFocus(chpn); return; }
      const t = document.getElementById('tabCh'); if (t) kbFocus(t);
      return;
    }
    kbFocus(items[idx-1]);
    return;
  }
  if (key === 'ArrowDown') {
    if (idx === items.length-1) { const fl = document.querySelector('.footlinks .footlink'); if (fl) { kbFocus(fl); return; } }
    kbFocus(items[idx+1]);
    return;
  }
  if (key === 'Enter') {
    KBN.lastClist = cur;
    cur.click();
    setTimeout(function() {
      const chitems = getChlistItems();
      if (chitems.length) kbFocus(chitems[0]);
    }, 80);
  }
}

/* .chlist items */
function handleChlistKey(cur, key) {
  const items = getChlistItems();
  const idx   = idxOf(items, cur);
  if (key === 'ArrowLeft') {
    const lc = (KBN.lastClist && document.contains(KBN.lastClist))
      ? KBN.lastClist
      : (getClistItems().find(c=>c.classList.contains('active')) || getClistItems()[0]);
    if (lc) kbFocus(lc);
    return;
  }
  if (key === 'ArrowRight') { goRight(); return; }
  if (key === 'ArrowUp') {
    if (idx === 0) { const chf = document.getElementById('chfilter'); if (chf) kbFocus(chf); return; }
    kbFocus(items[idx-1]);
    return;
  }
  if (key === 'ArrowDown') {
    if (idx === items.length-1) { const fl = document.querySelector('.footlinks .footlink'); if (fl) { kbFocus(fl); return; } }
    kbFocus(items[idx+1]);
    return;
  }
  if (key === 'Enter') { cur.click(); }
}

/* .chfinput */
function handleChfinputKey(key) {
  if (key === 'ArrowLeft')  return;
  if (key === 'ArrowRight') { goRight(); return; }
  if (key === 'ArrowUp') { const back = document.getElementById('backToGroups'); if (back) kbFocus(back); return; }
  if (key === 'ArrowDown') { const items = getChlistItems(); if (items.length) kbFocus(items[0]); return; }
  if (key === 'Enter') { const el = document.getElementById('chfilter'); if (el) el.blur(); }
}

/* .backbtn */
function handleBackbtnKey(key) {
  if (key === 'ArrowLeft') {
    const lc = (KBN.lastClist && document.contains(KBN.lastClist))
      ? KBN.lastClist
      : (getClistItems().find(c=>c.classList.contains('active')) || getClistItems()[0]);
    if (lc) kbFocus(lc);
    return;
  }
  if (key === 'ArrowRight') { goRight(); return; }
  if (key === 'ArrowUp') { const t = document.getElementById('tabCh'); if (t) kbFocus(t); return; }
  if (key === 'ArrowDown') { const chf = document.getElementById('chfilter'); if (chf) kbFocus(chf); return; }
  if (key === 'Enter') {
    const lc = (KBN.lastClist && document.contains(KBN.lastClist))
      ? KBN.lastClist
      : (getClistItems().find(c=>c.classList.contains('active')) || getClistItems()[0]);
    if (lc) kbFocus(lc);
    try { backToGroups(); } catch(err){}
  }
}

/* .vbtn grid */
function handleVbtnGridKey(key) {
  const vbtns = Array.from(document.querySelectorAll('.vbtn'));
  const vlist = vbtns.find(b=>(b.getAttribute('onclick')||'').includes("'list'"));
  if (key === 'ArrowLeft')  { const t = document.getElementById('tabCh'); if (t) kbFocus(t); return; }
  if (key === 'ArrowRight') { if (vlist) kbFocus(vlist); return; }
  if (key === 'ArrowUp')    { const h = document.querySelector('.hbtn.red'); if (h) kbFocus(h); return; }
  if (key === 'ArrowDown')  {
    const g = (KBN.lastGrid && document.contains(KBN.lastGrid)) ? KBN.lastGrid : (getGridCards()[0]||null);
    if (g) kbFocus(g);
    return;
  }
  if (key === 'Enter') {
    const vg = vbtns.find(b=>(b.getAttribute('onclick')||'').includes("'grid'"));
    if (vg) { try { setView('grid',vg); } catch(err){} }
  }
}

/* .vbtn list */
function handleVbtnListKey(key) {
  const vbtns = Array.from(document.querySelectorAll('.vbtn'));
  const vgrid = vbtns.find(b=>(b.getAttribute('onclick')||'').includes("'grid'"));
  if (key === 'ArrowLeft')  { if (vgrid) kbFocus(vgrid); return; }
  if (key === 'ArrowRight') return;
  if (key === 'ArrowUp')    { const h = document.querySelector('.hbtn.red'); if (h) kbFocus(h); return; }
  if (key === 'ArrowDown')  {
    const g = (KBN.lastGrid && document.contains(KBN.lastGrid)) ? KBN.lastGrid : (getGridCards()[0]||null);
    if (g) kbFocus(g);
    return;
  }
  if (key === 'Enter') {
    const vl = vbtns.find(b=>(b.getAttribute('onclick')||'').includes("'list'"));
    if (vl) { try { setView('list',vl); } catch(err){} }
  }
}

/* .gcard */
function handleGridKey(cur, key) {
  const cards = getGridCards();
  const idx   = idxOf(cards, cur);
  const cols  = getGridCols();

  if (key === 'ArrowLeft') {
    /* FIX: card le plus à gauche de sa ligne → sidebar, pas card d'en haut */
    const isFirstInRow = (cols > 1) ? (idx % cols === 0) : (idx === 0);
    if (idx === 0 || isFirstInRow) {
      /* Vers la sidebar : lastClist si dispo, sinon tabSrc */
      if (KBN.lastClist && document.contains(KBN.lastClist)) { kbFocus(KBN.lastClist); return; }
      const tabSrc = document.getElementById('tabC'); if (tabSrc) kbFocus(tabSrc);
      return;
    }
    kbFocus(cards[idx-1]);
    return;
  }
  if (key === 'ArrowRight') {
    if (cols === 1) return;
    if (idx < cards.length-1) kbFocus(cards[idx+1]);
    return;
  }
  if (key === 'ArrowUp') {
    const above = idx - cols;
    if (above < 0) {
      const vbtns = Array.from(document.querySelectorAll('.vbtn'));
      const inactive = vbtns.find(b => !b.classList.contains('active'));
      if (inactive) kbFocus(inactive);
      return;
    }
    kbFocus(cards[above]);
    return;
  }
  if (key === 'ArrowDown') {
    const below = idx + cols;
    if (below >= cards.length) {
      const fl = document.querySelector('.footlinks .footlink');
      if (fl) kbFocus(fl);
      return;
    }
    kbFocus(cards[below]);
    return;
  }
  if (key === 'Enter') {
    KBN.lastGrid = cur;
    cur.click();
  }
}

/* #msearch */
function handleMsearchKey(key) {
  if (key === 'ArrowLeft' || key === 'ArrowUp') return;
  if (key === 'ArrowRight') {
    const hd = document.querySelector('.hbtn.desktop-only');
    if (hd) { kbFocus(hd); return; }
    const hr = document.querySelector('.hbtn.red'); if (hr) kbFocus(hr);
    return;
  }
  if (key === 'ArrowDown') { const t = document.getElementById('tabC'); if (t) kbFocus(t); return; }
  if (key === 'Enter') { const ms = document.getElementById('msearch'); if (ms) ms.blur(); }
}

/* .hbtn.desktop-only */
function handleHbtnDesktopKey(key) {
  if (key === 'ArrowUp') return;
  if (key === 'ArrowLeft') { const ms = document.getElementById('msearch'); if (ms) kbFocus(ms); return; }
  if (key === 'ArrowRight') { const hr = document.querySelector('.hbtn.red'); if (hr) kbFocus(hr); return; }
  if (key === 'ArrowDown') {
    const vbtns = Array.from(document.querySelectorAll('.vbtn'));
    const inactive = vbtns.find(b => !b.classList.contains('active'));
    if (inactive && isGridVisible()) { kbFocus(inactive); return; }
    const wurl = getWcardUrl(); if (wurl) kbFocus(wurl);
    return;
  }
  if (key === 'Enter') { try { openCmd(); } catch(err){} }
}

/* .hbtn.red */
function handleHbtnRedKey(key) {
  if (key === 'ArrowUp' || key === 'ArrowRight') return;
  if (key === 'ArrowLeft') {
    const hd = document.querySelector('.hbtn.desktop-only');
    if (hd) { kbFocus(hd); return; }
    const ms = document.getElementById('msearch'); if (ms) kbFocus(ms);
    return;
  }
  if (key === 'ArrowDown') {
    const vbtns = Array.from(document.querySelectorAll('.vbtn'));
    const inactive = vbtns.find(b => !b.classList.contains('active'));
    if (inactive && isGridVisible()) { kbFocus(inactive); return; }
    const wurl = getWcardUrl(); if (wurl) kbFocus(wurl);
    return;
  }
  if (key === 'Enter') { try { openModal(); } catch(err){} }
}

/* .footlink phone */
function handleFootPhoneKey(key) {
  if (key === 'ArrowLeft' || key === 'ArrowDown') return;
  if (key === 'ArrowRight') {
    const fl = document.querySelectorAll('.footlinks .footlink');
    if (fl.length > 1) kbFocus(fl[1]);
    return;
  }
  /* FIX: ↑ → lastGrid uniquement */
  if (key === 'ArrowUp') { goFootUp(); return; }
  if (key === 'Enter') { if (KBN.cur) KBN.cur.click(); }
}

/* .footlink facebook */
function handleFootFbKey(key) {
  if (key === 'ArrowRight' || key === 'ArrowDown') return;
  if (key === 'ArrowLeft') {
    const fl = document.querySelectorAll('.footlinks .footlink');
    if (fl.length > 0) kbFocus(fl[0]);
    return;
  }
  /* FIX: ↑ → lastGrid uniquement */
  if (key === 'ArrowUp') { goFootUp(); return; }
  if (key === 'Enter') { if (KBN.cur) KBN.cur.click(); }
}

/* .wcard M3U URL */
function handleWcardUrlKey(key) {
  /* FIX: → vers Fichier M3U */
  if (key === 'ArrowRight') { const wf = getWcardFile(); if (wf) kbFocus(wf); return; }
  if (key === 'ArrowLeft')  { const t = document.getElementById('tabC'); if (t) kbFocus(t); return; }
  if (key === 'ArrowUp')    { const hr = document.querySelector('.hbtn.red'); if (hr) kbFocus(hr); return; }
  if (key === 'ArrowDown')  { const fl = document.querySelector('.footlinks .footlink'); if (fl) kbFocus(fl); return; }
  if (key === 'Enter') { try { openModal('url'); } catch(err){} }
}

/* .wcard Fichier M3U */
function handleWcardFileKey(key) {
  if (key === 'ArrowRight') return;
  if (key === 'ArrowLeft')  { const wu = getWcardUrl(); if (wu) kbFocus(wu); return; }
  if (key === 'ArrowUp')    { const hr = document.querySelector('.hbtn.red'); if (hr) kbFocus(hr); return; }
  if (key === 'ArrowDown')  { const fl = document.querySelector('.footlinks .footlink'); if (fl) kbFocus(fl); return; }
  if (key === 'Enter') { try { openModal('file'); } catch(err){} }
}

/* ============================================================
   PLAYER KEY HANDLER
   ============================================================ */
function handlePlayerKey(e) {
  const key = e.key;
  showOv();
  resetPlayerNavTimer();

  const pv       = document.getElementById('playerview');
  const ctrlrow  = pv ? pv.querySelector('.ctrlrow') : null;
  const cbtnPrev = ctrlrow ? ctrlrow.querySelector('.cbtn:first-child') : null;
  const ppbtn    = document.getElementById('ppbtn');
  const cbtnNext = ppbtn ? ppbtn.nextElementSibling : null;
  const stopbtn  = cbtnNext ? cbtnNext.nextElementSibling : null;
  const volInput = document.getElementById('volr');
  const fsbtn    = pv ? pv.querySelector('.fsbtn') : null;
  const prevNav  = pv ? pv.querySelector('.navbtn:first-child') : null;
  const nextNav  = pv ? pv.querySelector('.navbtn:nth-child(2)') : null;
  const closeBtn = pv ? pv.querySelector('.closebtn') : null;
  const retrybtn = pv ? pv.querySelector('.retrybtn') : null;
  const retryVisible = retrybtn && retrybtn.offsetParent !== null;

  const ctrlList = [cbtnPrev, ppbtn, cbtnNext, stopbtn, volInput, fsbtn].filter(Boolean);
  const pbarList = [prevNav, nextNav, closeBtn].filter(Boolean);

  const isInCtrl = KBN.cur && ctrlList.includes(KBN.cur);
  const isInPbar = KBN.cur && pbarList.includes(KBN.cur);
  const isRetry  = KBN.cur === retrybtn;

  /* Init focus dans player */
  if (!KBN.cur || !pv || !pv.contains(KBN.cur)) {
    if (cbtnPrev) { kbFocus(cbtnPrev); e.preventDefault(); return; }
  }

  e.preventDefault();
  const cur = KBN.cur;

  /* ctrlrow */
  if (isInCtrl) {
    const ci = ctrlList.indexOf(cur);
    if (key === 'ArrowLeft')  { if (ci > 0) kbFocus(ctrlList[ci-1]); return; }
    if (key === 'ArrowRight') { if (ci < ctrlList.length-1) kbFocus(ctrlList[ci+1]); return; }
    if (key === 'ArrowDown') {
      if (cur === volInput) {
        let v = Math.max(0, Math.round((parseFloat(volInput.value)-0.1)*20)/20);
        volInput.value = v; try { setVol(v); } catch(err){} return;
      }
      /* FIX: fsbtn ↓ → × Fermé (closebtn) si pas fullscreen */
      if (cur === fsbtn) {
        if (!isFullScreen() && closeBtn) { kbFocus(closeBtn); return; }
        return;
      }
      /* autres boutons ctrlrow ↓ → < Préc. (prevNav) si pas fullscreen */
      if (!isFullScreen() && prevNav) { kbFocus(prevNav); return; }
      return;
    }
    if (key === 'ArrowUp') {
      if (cur === volInput) {
        let v = Math.min(1, Math.round((parseFloat(volInput.value)+0.1)*20)/20);
        volInput.value = v; try { setVol(v); } catch(err){} return;
      }
      if (retryVisible) { kbFocus(retrybtn); return; }
      return;
    }
    if (key === 'Enter') {
      if (cur === ppbtn)    { try { togglePlay(); } catch(err){} return; }
      if (cur === cbtnPrev) { try { prevCh(); } catch(err){} return; }
      if (cur === cbtnNext) { try { nextCh(); } catch(err){} return; }
      if (cur === stopbtn)  { try { stopStream(); } catch(err){} return; }
      if (cur === fsbtn)    { try { toggleFS(); } catch(err){} return; }
    }
    return;
  }

  /* pbar */
  if (isInPbar) {
    const pi = pbarList.indexOf(cur);
    if (key === 'ArrowLeft')  { if (pi > 0) kbFocus(pbarList[pi-1]); return; }
    if (key === 'ArrowRight') { if (pi < pbarList.length-1) kbFocus(pbarList[pi+1]); return; }
    if (key === 'ArrowDown')  return;
    if (key === 'ArrowUp') {
      /* FIX: × Fermé ↑ → fsbtn ; Préc./Suiv. ↑ → cbtnPrev (preuve) */
      if (cur === closeBtn) { if (fsbtn) { kbFocus(fsbtn); return; } }
      if (cbtnPrev) kbFocus(cbtnPrev);
      return;
    }
    if (key === 'Enter') {
      if (cur === prevNav)  { try { prevCh(); } catch(err){} return; }
      if (cur === nextNav)  { try { nextCh(); } catch(err){} return; }
      if (cur === closeBtn) { try { closePlayer(); } catch(err){} return; }
    }
    return;
  }

  /* Réessayer */
  if (isRetry) {
    if (key === 'ArrowDown') { if (cbtnPrev) kbFocus(cbtnPrev); return; }
    if (key === 'ArrowUp' || key === 'ArrowLeft' || key === 'ArrowRight') return;
    if (key === 'Enter') { try { retryStream(); } catch(err){} return; }
  }
}

/* Timer ctrlrow */
function resetPlayerNavTimer() {
  clearTimeout(KBN.playerOvTimer);
  KBN.playerOvTimer = setTimeout(hideOv, 5000);
}

/* ============================================================
   MODALE SOURCE — navigation interne
   FIX: inclut Annuler et Ajouter
   ============================================================ */
function handleModalKey(e) {
  if (e.key === 'Escape') { closeModal(); return; }

  const focusable = Array.from(document.querySelectorAll(
    '#srcModal .src-type-btn, #srcModal input:not([type=file]):not([disabled]), #srcModal .file-drop, #srcModal .mbtn-cancel, #srcModal .mbtn-add:not([disabled])'
  )).filter(function(el) { return el.offsetParent !== null; });

  if (!focusable.length) return;

  let ci = focusable.indexOf(KBN.cur);
  if (ci === -1) ci = focusable.indexOf(document.activeElement);

  const goNext = function() {
    e.preventDefault();
    _modalFocus(focusable[(ci >= focusable.length-1) ? 0 : ci+1]);
  };
  const goPrev = function() {
    e.preventDefault();
    _modalFocus(focusable[(ci <= 0) ? focusable.length-1 : ci-1]);
  };

  if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey))  { goNext(); return; }
  if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft'  || (e.key === 'Tab' && e.shiftKey))   { goPrev(); return; }

  if (e.key === 'Enter') {
    const active = KBN.cur || document.activeElement;
    if (!active) return;
    if (active.tagName === 'BUTTON' || active.classList.contains('src-type-btn') || active.classList.contains('file-drop')) {
      active.click();
    }
  }
}

/* ============================================================
   MODALE CONFIRMATION — navigation interne
   ============================================================ */
function handleConfirmModalKey(e) {
  if (e.key === 'Escape') { document.getElementById('confirmModal').style.display = 'none'; return; }

  const btns = Array.from(document.querySelectorAll('#confirmModal .mbtn-cancel, #confirmModal .mbtn-add'));
  if (!btns.length) return;

  let ci = btns.indexOf(KBN.cur);
  if (ci === -1) ci = btns.indexOf(document.activeElement);

  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Tab') {
    e.preventDefault();
    const next = (e.key === 'ArrowLeft' || (e.key==='Tab'&&e.shiftKey))
      ? (ci <= 0 ? btns.length-1 : ci-1)
      : (ci >= btns.length-1 ? 0 : ci+1);
    _modalFocus(btns[next]);
    return;
  }
  if (e.key === 'Enter') {
    const active = KBN.cur || document.activeElement;
    if (active) active.click();
  }
}

/* ============================================================
   TRACK CLICS
   ============================================================ */
document.addEventListener('click', function(e) {
  const card = e.target.closest('#chgrid .gcard');
  if (card) { KBN.lastGrid = card; kbFocus(card); }
  const citem = e.target.closest('#clist .citem');
  if (citem) KBN.lastClist = citem;
}, true);

/* ============================================================
   FIX: Restore focus après stop/closePlayer
   ============================================================ */
(function patchPlayerClose() {
  var _origClose = window.closePlayer;
  var _origStop  = window.stopStream;

  function restoreAfterPlayer() {
    setTimeout(function() {
      /* Nettoyer le focus player */
      if (KBN.cur) { KBN.cur.classList.remove('kbf'); KBN.cur = null; }
      /* Aller au lastGrid */
      if (KBN.lastGrid && document.contains(KBN.lastGrid)) {
        kbFocus(KBN.lastGrid); return;
      }
      var cards = getGridCards();
      if (cards.length) { kbFocus(cards[0]); return; }
      var tabSrc = document.getElementById('tabC');
      if (tabSrc) kbFocus(tabSrc);
    }, 100);
  }

  window.closePlayer = function() {
    if (typeof _origClose === 'function') _origClose.apply(this, arguments);
    restoreAfterPlayer();
  };
  window.stopStream = function() {
    if (typeof _origStop === 'function') _origStop.apply(this, arguments);
    restoreAfterPlayer();
  };
})();

/* ============================================================
   INIT
   ============================================================ */
document.removeEventListener('keydown', onKey);
document.addEventListener('keydown', onKey);

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    if (!KBN.cur) {
      var tabSrc = document.getElementById('tabC');
      if (tabSrc) kbFocus(tabSrc);
    }
  }, 350);
});
