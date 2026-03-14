// keypress.js — v3 FINAL
// Fanovana tena misy:
//   1. Nesorina tanteraka ny debounce timestamp nk (io no nasakana ny fihetsika voalohany)
//   2. HUD: mampiseho chiffre 5 (_ _ _ _ _), miseho AVY HATRANY rehefa manindry chiffre
//   3. Timeout 3s aorian'ny chiffre farany vao miova chaîne
//   4. mkHud() mamorona #nh indray mandeha fotsiny (tsy misy doublon)

(function(){
  if(document.getElementById('kp-style'))return;
  var st=document.createElement('style');
  st.id='kp-style';
  st.textContent=
    ':focus{outline:none!important}'+
    '.kbf{box-shadow:0 0 0 3px #e50914,0 0 0 5px rgba(229,9,20,.25)!important;}'+
    '#ch-badge{position:absolute;top:10px;right:10px;z-index:199;background:rgba(0,0,0,.78);border:1px solid rgba(229,9,20,.5);border-radius:6px;padding:4px 9px;font-family:"Barlow Condensed",sans-serif;font-size:.78rem;font-weight:700;letter-spacing:1px;color:rgba(255,255,255,.85);pointer-events:none;display:none}'+
    '#nh{position:absolute;top:10px;right:10px;z-index:200;background:rgba(0,0,0,.85);border:2px solid rgba(229,9,20,.65);border-radius:10px;padding:9px 16px 7px;display:none;flex-direction:column;align-items:center;gap:5px;pointer-events:none}'+
    '#nhd{display:flex;gap:7px}'+
    '.nd{width:20px;height:26px;border-bottom:2px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-family:"Barlow Condensed",sans-serif;font-size:1.05rem;font-weight:700;color:#fff}'+
    '.nd.f{border-color:#e50914;color:#e50914}'+
    '#nhl{font-family:"Barlow Condensed",sans-serif;font-size:.58rem;letter-spacing:1.5px;color:rgba(255,255,255,.4);text-transform:uppercase}';
  document.head.appendChild(st);
})();

var K={
  c:null,
  g:null,
  s:null,
  lc:null,
  pt:null,
  nb:'',
  nt:null,
  nh:null
  // nk NESORINA — io no nasakana ny fihetsika voalohany
};

function kF(el){
  if(!el)return;
  if(K.c&&K.c!==el){K.c.classList.remove('kbf');if(K.c.tagName==='INPUT')K.c.blur();}
  K.c=el;el.classList.add('kbf');
  if(el.tagName==='INPUT'){el.focus();return;}
  try{
    var p=el.parentElement;
    while(p){var o=getComputedStyle(p).overflowY;if(o==='auto'||o==='scroll'){var r=el.getBoundingClientRect(),pr=p.getBoundingClientRect();if(r.bottom>pr.bottom-4)p.scrollTop+=r.bottom-pr.bottom+12;else if(r.top<pr.top+4)p.scrollTop-=pr.top-r.top+12;break;}p=p.parentElement;}
  }catch(e){}
}
function mF(el){if(!el)return;if(K.c)K.c.classList.remove('kbf');K.c=el;el.classList.add('kbf');if(el.tagName==='INPUT')el.focus();else if(el.focus)el.focus();}

function $i(id){return document.getElementById(id);}
function $q(sel){return document.querySelector(sel);}
function $a(sel){return Array.from(document.querySelectorAll(sel));}
function vis(id){var e=$i(id);return e&&e.style.display!==''&&e.style.display!=='none';}
function isPV(){return vis('playerview');}
function isFS(){return!!(document.fullscreenElement||document.webkitFullscreenElement||document.mozFullScreenElement);}
function isSub(){return vis('chsubpanel');}
function isCO(){var e=$i('cmdbg');return e&&e.classList.contains('open');}
function isSM(){var e=$i('srcModal');return e&&e.classList.contains('open');}
function isCM(){var e=$i('confirmModal');return e&&e.style.display==='flex';}
function isTA(w){var e=$i(w==='s'?'tabC':'tabCh');return e&&e.classList.contains('active');}
function isGV(){return vis('gridview');}
function gSI(){return $a('#srcItems .src-item');}
function gRI(){return $a('#regionItems .src-item[data-region-id]');}
function gCL(){return $a('#clist .citem');}
function gCH(){return $a('#chlist .chitem');}
function gGC(){return $a('#chgrid .gcard');}
function gWU(){return $q('.welcome-cards .wcard:first-child');}
function gWF(){return $q('.welcome-cards .wcard:last-child');}
function gCols(){
  var g=$i('chgrid');if(!g||g.classList.contains('list'))return 1;
  var t=getComputedStyle(g).gridTemplateColumns;
  return t&&t!=='none'?t.split(' ').filter(Boolean).length||1:1;
}
function gR(){
  if(!vis('welcomeScr')){var g=K.g&&document.contains(K.g)?K.g:gGC()[0]||null;if(g){kF(g);return;}}
  var w=gWU();if(w)kF(w);
}
function gFU(){
  var g=K.g&&document.contains(K.g)?K.g:null;if(g){kF(g);return;}
  var cs=gGC();if(cs.length&&isGV()){kF(cs[0]);return;}
  var w=gWU();if(w)kF(w);
}
function oDM(){
  if(!K.c)return;
  var it=K.c.closest('.src-item[data-src-idx]');if(!it)return;
  var i=parseInt(it.dataset.srcIdx);if(!isNaN(i))try{delSource({stopPropagation:function(){}},i);}catch(e){}
}

// ── Badge ──────────────────────────────────────────────────
function mkBadge(){
  var pw=$i('pwrap');if(!pw)return null;
  var b=$i('ch-badge');
  if(!b){b=document.createElement('div');b.id='ch-badge';pw.appendChild(b);}
  return b;
}
function showBadge(){
  var b=mkBadge();if(!b)return;
  if(typeof curChIdx!=='undefined'&&curChIdx>=0&&typeof channels!=='undefined'&&channels.length){
    b.textContent='Ch.'+(curChIdx+1)+' / '+channels.length;b.style.display='block';
  }
}
function hideBadge(){var b=$i('ch-badge');if(b)b.style.display='none';}

// ── HUD chiffre — 5 cases, créé une seule fois ────────────
var _hudBuilt=false;
function mkHud(){
  var pw=$i('pwrap');if(!pw)return null;
  if(!_hudBuilt){
    // Supprime tout #nh existant (doublon)
    var old=$i('nh');if(old)old.parentNode.removeChild(old);
    var h=document.createElement('div');
    h.id='nh';
    h.innerHTML='<div id="nhd"></div><div id="nhl">Ch. direct</div>';
    pw.appendChild(h);
    _hudBuilt=true;
  }
  return $i('nh');
}
function rHud() {
  var h = mkHud(); if (!h) return;
  var d = $i('nhd'); if (!d) return;
  var s = '';
  for (var i = 0; i < 5; i++) {
    s += '<span class="nd' + (i < K.nb.length ? ' f' : '') + '">' + (i < K.nb.length ? K.nb[i] : '_') + '</span>';
  }
  d.innerHTML = s;
  h.style.display = 'flex';
  hideBadge();
}

function hHud(){var h=$i('nh');if(h)h.style.display='none';}

function rPOT(){
  clearTimeout(K.pt);
  K.pt=setTimeout(function(){try{hideOv();}catch(e){}hideBadge();},5000);
}

// ══════════════════════════════════════════════════════════
// MAIN KEY HANDLER — sans debounce timestamp
// ══════════════════════════════════════════════════════════
function onKey(e){
  if(e.repeat)return; // auto-repeat TV remote seulement

  if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();try{openCmd();}catch(x){}return;}

  if(e.key==='Escape'){
    if(isCO()){try{closeCmd();}catch(x){}return;}
    if(isSM()){try{closeModal();}catch(x){}return;}
    if(isCM()){var cm=$i('confirmModal');if(cm)cm.style.display='none';return;}
    if(isFS())try{(document.exitFullscreen||document.webkitExitFullscreen||document.mozCancelFullScreen).call(document);}catch(x){}
    return;
  }

  var mk={MediaPlayPause:1,MediaTrackNext:1,MediaTrackPrevious:1,MediaStop:1};
  if(mk[e.key]){
    if(isPV()){
      e.preventDefault();
      if(e.key==='MediaPlayPause')try{togglePlay();}catch(x){}
      else if(e.key==='MediaTrackNext')try{nextCh();}catch(x){}
      else if(e.key==='MediaTrackPrevious')try{prevCh();}catch(x){}
      else if(e.key==='MediaStop')try{stopStream();}catch(x){}
    }
    return;
  }

  if(isCO()){hCmd(e);return;}
  if(isSM()){hSMod(e);return;}
  if(isCM()){hCMod(e);return;}

  if(e.key==='Delete'||e.key==='Supr'||e.keyCode===46){
    var tg=document.activeElement&&document.activeElement.tagName;
    if(tg==='INPUT'||tg==='TEXTAREA')return;
    if(K.c&&K.c.closest('.src-item[data-src-idx]'))oDM();
    return;
  }

  // Chiffres plein écran → changement de chaîne
  if(isPV()&&isFS()&&/^[0-9]$/.test(e.key)){
    e.preventDefault();
    hNum(e.key);
    return;
  }

  var nav={ArrowLeft:1,ArrowRight:1,ArrowUp:1,ArrowDown:1,Enter:1};
  if(!nav[e.key])return;
  if(isPV()){hPl(e);return;}
  if(!K.c||!document.contains(K.c)){var ts=$i('tabC');if(ts)kF(ts);e.preventDefault();return;}
  e.preventDefault();
  var c=K.c;
  if(c.classList.contains('sbtab')){hST(c,e.key);return;}
  if(c.classList.contains('src-item')&&c.closest('#srcItems')){hSI(c,e.key);return;}
  if(c.classList.contains('add-src-btn')){hAB(e.key);return;}
  if(c.classList.contains('src-item')&&c.closest('#regionItems')){hRG(c,e.key);return;}
  if(c.id==='chpname'||c.classList.contains('chpname')){hPN(e.key);return;}
  if(c.classList.contains('citem')){hCI(c,e.key);return;}
  if(c.classList.contains('chitem')){hHI(c,e.key);return;}
  if(c.id==='chfilter'){hCF(e.key);return;}
  if(c.id==='backToGroups'||c.classList.contains('backbtn')){hBB(e.key);return;}
  if(c.classList.contains('vbtn')){
    var oc=c.getAttribute('onclick')||'';
    if(oc.indexOf("'grid'")!==-1)hVG(e.key); else hVL(e.key);
    return;
  }
  if(c.classList.contains('gcard')){hGC(c,e.key);return;}
  if(c.id==='msearch'){hMS(e.key);return;}
  if(c.classList.contains('hbtn')){
    if(c.classList.contains('desktop-only'))hHD(e.key); else hHR(e.key);
    return;
  }
  if(c.classList.contains('footlink')){
    var hr=c.getAttribute('href')||'';
    if(hr.indexOf('tel:')===0)hFP(e.key); else hFF(e.key);
    return;
  }
  if(c.classList.contains('wcard')){
    if(c===gWU())hWU(e.key); else hWF(e.key);
    return;
  }
}

// ══════════════════════════════════════════════════════════
// hNum — 1 touche = affichage immédiat, 5 chiffres max, 3s timeout
// ══════════════════════════════════════════════════════════
function hNum(d) {
  clearTimeout(K.nt); clearTimeout(K.nh);
  K.nb += d;
  
  rHud();
  try { showOv(); } catch (x) {}
  rPOT();

  if (K.nb.length >= 5) {
    var nb = K.nb; K.nb = ''; 
    K.nh = setTimeout(hHud, 600); // Manala ny HUD rehefa afaka 0.6s
    var idx = parseInt(nb) - 1;
    if (idx >= 0 && typeof channels !== 'undefined' && idx < channels.length) {
      try { playCh(idx); } catch (x) {}
    }
    return;
  }

  K.nt = setTimeout(function() {
    var nb = K.nb; K.nb = ''; 
    K.nh = setTimeout(hHud, 600);
    var idx = parseInt(nb) - 1;
    if (idx >= 0 && typeof channels !== 'undefined' && idx < channels.length) {
      try { playCh(idx); } catch (x) {}
    }
  }, 3000);
}

function hCmd(e){
  var it=$a('#cmdlist .cmditem');
  if(e.key==='ArrowDown'){e.preventDefault();cmdSelIdx=Math.min(cmdSelIdx+1,it.length-1);it.forEach(function(x,i){x.classList.toggle('sel',i===cmdSelIdx);});}
  else if(e.key==='ArrowUp'){e.preventDefault();cmdSelIdx=Math.max(cmdSelIdx-1,0);it.forEach(function(x,i){x.classList.toggle('sel',i===cmdSelIdx);});}
  else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();try{closeCmd();}catch(x){}}
  else if(e.key==='Enter'&&cmdSelIdx>=0)try{cmdPlay(parseInt(it[cmdSelIdx].dataset.idx));}catch(x){}
}

function hST(c,k){
  var tS=$i('tabC'),tC=$i('tabCh'),iS=(c===tS),iC=(c===tC);
  if(k==='ArrowLeft'){if(iC)kF(tS);return;}
  if(k==='ArrowRight'){if(iS)kF(tC);else if(iC)gR();return;}
  if(k==='ArrowUp'){var m=$i('msearch');if(m)kF(m);return;}
  if(k==='ArrowDown'){
    if(iS&&isTA('s')){var s=gSI();if(s.length)return kF(s[0]);var b=$q('.add-src-btn');if(b)return kF(b);var r=gRI();if(r.length)kF(r[0]);return;}
    if(iS){if(isTA('c')&&!isSub()){var ci=gCL();if(ci.length)return kF(ci[0]);}if(isTA('c')&&isSub()){var bk=$i('backToGroups');if(bk)return kF(bk);}var f=$q('.footlinks .footlink');if(f)kF(f);return;}
    if(iC&&isTA('c')){if(!isSub()){var ct=gCL();if(ct.length)return kF(ct[0]);}var bk2=$i('backToGroups');if(bk2)return kF(bk2);var f2=$q('.footlinks .footlink');if(f2)kF(f2);return;}
    if(iC){var s2=gSI();if(s2.length)return kF(s2[0]);var b2=$q('.add-src-btn');if(b2)kF(b2);}
  }
  if(k==='Enter'){if(iS)try{switchTab('sources');}catch(x){}if(iC)try{switchTab('channels');}catch(x){}}
}
function hSI(c,k){
  var s=gSI(),i=s.indexOf(c);
  if(k==='ArrowLeft'){oDM();return;}
  if(k==='ArrowRight'){K.s=c;gR();return;}
  if(k==='ArrowUp'){kF(i===0?$i('tabCh'):s[i-1]);return;}
  if(k==='ArrowDown'){var b=i===s.length-1?$q('.add-src-btn'):s[i+1];if(b)kF(b);return;}
  if(k==='Enter'){var si=parseInt(c.dataset.srcIdx);if(!isNaN(si))try{loadSource(si);}catch(x){}}
}
function hAB(k){
  if(k==='ArrowLeft')return;
  if(k==='ArrowRight'){K.s=$q('.add-src-btn');gR();return;}
  if(k==='ArrowUp'){var s=gSI();kF(s.length?s[s.length-1]:$i('tabCh'));return;}
  if(k==='ArrowDown'){var r=gRI();if(r.length)kF(r[0]);return;}
  if(k==='Enter')try{openModal();}catch(x){}
}
function hRG(c,k){
  var r=gRI(),i=r.indexOf(c);
  if(k==='ArrowLeft')return;
  if(k==='ArrowRight'){K.s=c;gR();return;}
  if(k==='ArrowUp'){kF(i===0?$q('.add-src-btn')||c:r[i-1]);return;}
  if(k==='ArrowDown'){if(i===r.length-1){var f=$q('.footlinks .footlink');if(f)kF(f);}else kF(r[i+1]);return;}
  if(k==='Enter'){var rid=c.dataset.regionId;if(rid)try{loadRegion(rid);}catch(x){}}
}
function hPN(k){
  if(k==='ArrowLeft')return;
  if(k==='ArrowRight'){gR();return;}
  if(k==='ArrowUp'){kF($i('tabCh'));return;}
  if(k==='ArrowDown'){var it=gCL();if(it.length)kF(it[0]);return;}
}
function hCI(c,k){
  var it=gCL(),i=it.indexOf(c);
  if(k==='ArrowLeft')return;
  if(k==='ArrowRight'){K.s=c;gR();return;}
  if(k==='ArrowUp'){if(i===0){kF($i('tabCh'));return;}kF(it[i-1]);return;}
  if(k==='ArrowDown'){if(i===it.length-1){var f=$q('.footlinks .footlink');if(f)kF(f);}else kF(it[i+1]);return;}
  if(k==='Enter'){K.lc=c;c.click();setTimeout(function(){var h=gCH();if(h.length)kF(h[0]);},80);}
}
function hHI(c,k){
  var it=gCH(),i=it.indexOf(c);
  if(k==='ArrowLeft'){var lc=K.lc&&document.contains(K.lc)?K.lc:gCL().find(function(x){return x.classList.contains('active');})||gCL()[0];if(lc)kF(lc);return;}
  if(k==='ArrowRight'){gR();return;}
  if(k==='ArrowUp'){kF(i===0?$i('chfilter'):it[i-1]);return;}
  if(k==='ArrowDown'){if(i===it.length-1){var f=$q('.footlinks .footlink');if(f)kF(f);}else kF(it[i+1]);return;}
  if(k==='Enter')c.click();
}
function hCF(k){
  if(k==='ArrowLeft')return;
  if(k==='ArrowRight'){gR();return;}
  if(k==='ArrowUp'){var b=$i('backToGroups');if(b)kF(b);return;}
  if(k==='ArrowDown'){var it=gCH();if(it.length)kF(it[0]);return;}
  if(k==='Enter'){var e=$i('chfilter');if(e)e.blur();}
}
function hBB(k){
  var lc=K.lc&&document.contains(K.lc)?K.lc:gCL().find(function(x){return x.classList.contains('active');})||gCL()[0];
  if(k==='ArrowLeft'){if(lc)kF(lc);return;}
  if(k==='ArrowRight'){gR();return;}
  if(k==='ArrowUp'){kF($i('tabCh'));return;}
  if(k==='ArrowDown'){var cf=$i('chfilter');if(cf)kF(cf);return;}
  if(k==='Enter'){if(lc)kF(lc);try{backToGroups();}catch(x){}}
}
function hVG(k){
  var vb=$a('.vbtn'),vl=vb.find(function(b){return(b.getAttribute('onclick')||'').indexOf("'list'")!==-1;});
  if(k==='ArrowLeft'){kF($i('tabCh'));return;}
  if(k==='ArrowRight'){if(vl)kF(vl);return;}
  if(k==='ArrowUp'){var h=$q('.hbtn.red');if(h)kF(h);return;}
  if(k==='ArrowDown'){var g=K.g&&document.contains(K.g)?K.g:gGC()[0];if(g)kF(g);return;}
  if(k==='Enter'){var vg=vb.find(function(b){return(b.getAttribute('onclick')||'').indexOf("'grid'")!==-1;});if(vg)try{setView('grid',vg);}catch(x){}}
}
function hVL(k){
  var vb=$a('.vbtn'),vg=vb.find(function(b){return(b.getAttribute('onclick')||'').indexOf("'grid'")!==-1;});
  if(k==='ArrowLeft'){if(vg)kF(vg);return;}
  if(k==='ArrowRight')return;
  if(k==='ArrowUp'){var h=$q('.hbtn.red');if(h)kF(h);return;}
  if(k==='ArrowDown'){var g=K.g&&document.contains(K.g)?K.g:gGC()[0];if(g)kF(g);return;}
  if(k==='Enter'){var vl=vb.find(function(b){return(b.getAttribute('onclick')||'').indexOf("'list'")!==-1;});if(vl)try{setView('list',vl);}catch(x){}}
}
function hGC(c,k){
  var cs=gGC(),i=cs.indexOf(c),cols=gCols();
  if(k==='ArrowLeft'){
    if(i===0||(cols>1&&i%cols===0)){if(K.s&&document.contains(K.s)){kF(K.s);return;}if(K.lc&&document.contains(K.lc)){kF(K.lc);return;}kF($i('tabC'));return;}
    kF(cs[i-1]);return;
  }
  if(k==='ArrowRight'){if(cols>1&&i<cs.length-1)kF(cs[i+1]);return;}
  if(k==='ArrowUp'){var ab=i-cols;if(ab<0){var vb=$a('.vbtn');var inv=vb.find(function(b){return!b.classList.contains('active');});if(inv)kF(inv);return;}kF(cs[ab]);return;}
  if(k==='ArrowDown'){var bl=i+cols;if(bl>=cs.length){var f=$q('.footlinks .footlink');if(f)kF(f);return;}kF(cs[bl]);return;}
  if(k==='Enter'){K.g=c;c.click();}
}
function hMS(k){
  if(k==='ArrowLeft'||k==='ArrowUp')return;
  if(k==='ArrowRight'){var hd=$q('.hbtn.desktop-only');if(hd){kF(hd);return;}var hr=$q('.hbtn.red');if(hr)kF(hr);return;}
  if(k==='ArrowDown'){kF($i('tabC'));return;}
  if(k==='Enter'){var m=$i('msearch');if(m)m.blur();}
}
function hHD(k){
  if(k==='ArrowUp')return;
  if(k==='ArrowLeft'){var m=$i('msearch');if(m)kF(m);return;}
  if(k==='ArrowRight'){var hr=$q('.hbtn.red');if(hr)kF(hr);return;}
  if(k==='ArrowDown'){var vb=$a('.vbtn'),inv=vb.find(function(b){return!b.classList.contains('active');});if(inv&&isGV())return kF(inv);var w=gWU();if(w)kF(w);return;}
  if(k==='Enter')try{openCmd();}catch(x){}
}
function hHR(k){
  if(k==='ArrowUp'||k==='ArrowRight')return;
  if(k==='ArrowLeft'){var hd=$q('.hbtn.desktop-only');if(hd)return kF(hd);var m=$i('msearch');if(m)kF(m);return;}
  if(k==='ArrowDown'){var vb=$a('.vbtn'),inv=vb.find(function(b){return!b.classList.contains('active');});if(inv&&isGV())return kF(inv);var w=gWU();if(w)kF(w);return;}
  if(k==='Enter')try{openModal();}catch(x){}
}
function hFP(k){
  if(k==='ArrowLeft'||k==='ArrowDown')return;
  if(k==='ArrowRight'){var fl=$a('.footlinks .footlink');if(fl[1])kF(fl[1]);return;}
  if(k==='ArrowUp')gFU();
  if(k==='Enter'&&K.c)K.c.click();
}
function hFF(k){
  if(k==='ArrowRight'||k==='ArrowDown')return;
  if(k==='ArrowLeft'){var fl=$a('.footlinks .footlink');if(fl[0])kF(fl[0]);return;}
  if(k==='ArrowUp')gFU();
  if(k==='Enter'&&K.c)K.c.click();
}
function hWU(k){
  if(k==='ArrowRight'){var wf=gWF();if(wf)kF(wf);return;}
  if(k==='ArrowLeft'){kF($i('tabC'));return;}
  if(k==='ArrowUp'){var hr=$q('.hbtn.red');if(hr)kF(hr);return;}
  if(k==='ArrowDown'){var f=$q('.footlinks .footlink');if(f)kF(f);return;}
  if(k==='Enter')try{openModal('url');}catch(x){}
}
function hWF(k){
  if(k==='ArrowRight')return;
  if(k==='ArrowLeft'){var wu=gWU();if(wu)kF(wu);return;}
  if(k==='ArrowUp'){var hr=$q('.hbtn.red');if(hr)kF(hr);return;}
  if(k==='ArrowDown'){var f=$q('.footlinks .footlink');if(f)kF(f);return;}
  if(k==='Enter')try{openModal('file');}catch(x){}
}
function hPl(e){
  var k=e.key;
  try{showOv();}catch(x){}rPOT();
  var pv=$i('playerview');
  var cr=pv&&pv.querySelector('.ctrlrow');
  var cbP=cr&&cr.querySelector('.cbtn:first-child');
  var ppb=$i('ppbtn');
  var cbN=ppb&&ppb.nextElementSibling;
  var stb=cbN&&cbN.nextElementSibling;
  var vol=$i('volr');
  var fsb=pv&&pv.querySelector('.fsbtn');
  var prv=pv&&pv.querySelector('.navbtn:first-child');
  var nxt=pv&&pv.querySelector('.navbtn:nth-child(2)');
  var cls=pv&&pv.querySelector('.closebtn');
  var rtb=pv&&pv.querySelector('.retrybtn');
  var rtV=rtb&&rtb.offsetParent!==null;
  var cL=[cbP,ppb,cbN,stb,vol,fsb].filter(Boolean);
  var pL=[prv,nxt,cls].filter(Boolean);
  if(!K.c||!pv||!pv.contains(K.c)){if(cbP){kF(cbP);e.preventDefault();}return;}
  e.preventDefault();
  var c=K.c;
  var iC=cL.indexOf(c)!==-1,ci=cL.indexOf(c);
  var iP=pL.indexOf(c)!==-1,pi=pL.indexOf(c);
  if(iC){
    if(k==='ArrowLeft'){if(ci>0)kF(cL[ci-1]);return;}
    if(k==='ArrowRight'){if(ci<cL.length-1)kF(cL[ci+1]);return;}
    if(k==='ArrowDown'){
      if(c===vol){var v=Math.max(0,Math.round((parseFloat(vol.value)-.1)*20)/20);vol.value=v;try{setVol(v);}catch(x){}return;}
      if(!isFS()&&cls){kF(cls);return;}return;
    }
    if(k==='ArrowUp'){
      if(c===vol){var v2=Math.min(1,Math.round((parseFloat(vol.value)+.1)*20)/20);vol.value=v2;try{setVol(v2);}catch(x){}return;}
      if(rtV){kF(rtb);return;}return;
    }
    if(k==='Enter'){
      if(c===ppb)try{togglePlay();}catch(x){}
      else if(c===cbP)try{prevCh();}catch(x){}
      else if(c===cbN)try{nextCh();}catch(x){}
      else if(c===stb)try{stopStream();}catch(x){}
      else if(c===fsb)try{toggleFS();}catch(x){}
    }
    return;
  }
  if(iP){
    if(k==='ArrowLeft'){if(pi>0)kF(pL[pi-1]);return;}
    if(k==='ArrowRight'){if(pi<pL.length-1)kF(pL[pi+1]);return;}
    if(k==='ArrowDown')return;
    if(k==='ArrowUp'){if(c===cls&&fsb){kF(fsb);return;}if(cbP)kF(cbP);return;}
    if(k==='Enter'){
      if(c===prv)try{prevCh();}catch(x){}
      else if(c===nxt)try{nextCh();}catch(x){}
      else if(c===cls)try{closePlayer();}catch(x){}
    }
    return;
  }
  if(c===rtb){
    if(k==='ArrowDown'&&cbP){kF(cbP);return;}
    if(k==='Enter')try{retryStream();}catch(x){}
  }
}
function hSMod(e){
  if(e.key==='Escape'){try{closeModal();}catch(x){}return;}
  var fo=$a('#srcModal .src-type-btn,#srcModal input:not([type=file]):not([disabled]),#srcModal .file-drop,#srcModal .mbtn-cancel,#srcModal .mbtn-add:not([disabled])').filter(function(x){return x.offsetParent!==null;});
  if(!fo.length)return;
  var ci=fo.indexOf(K.c);if(ci===-1)ci=fo.indexOf(document.activeElement);
  var gN=function(){e.preventDefault();mF(fo[ci>=fo.length-1?0:ci+1]);};
  var gP=function(){e.preventDefault();mF(fo[ci<=0?fo.length-1:ci-1]);};
  if(e.key==='ArrowDown'||e.key==='ArrowRight'||(e.key==='Tab'&&!e.shiftKey)){gN();return;}
  if(e.key==='ArrowUp'||e.key==='ArrowLeft'||(e.key==='Tab'&&e.shiftKey)){gP();return;}
  if(e.key==='Enter'){var a=K.c||document.activeElement;if(a&&(a.tagName==='BUTTON'||a.classList.contains('src-type-btn')||a.classList.contains('file-drop')))a.click();}
}
function hCMod(e){
  if(e.key==='Escape'){var cm=$i('confirmModal');if(cm)cm.style.display='none';return;}
  var bt=$a('#confirmModal .mbtn-cancel,#confirmModal .mbtn-add');if(!bt.length)return;
  var ci=bt.indexOf(K.c);if(ci===-1)ci=bt.indexOf(document.activeElement);
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'||e.key==='Tab'){
    e.preventDefault();var nx=(e.key==='ArrowLeft'||(e.key==='Tab'&&e.shiftKey))?(ci<=0?bt.length-1:ci-1):(ci>=bt.length-1?0:ci+1);mF(bt[nx]);return;
  }
  if(e.key==='Enter'){var a=K.c||document.activeElement;if(a)a.click();}
}

document.addEventListener('click',function(e){
  var ca=e.target.closest('#chgrid .gcard');if(ca){K.g=ca;kF(ca);}
  var ci=e.target.closest('#clist .citem');if(ci)K.lc=ci;
  var si=e.target.closest('#srcItems .src-item,#regionItems .src-item,.add-src-btn');if(si)K.s=si;
},true);

(function(){
  var _oP=window.playCh,_oSO=window.showOv,_oHO=window.hideOv;
  window.playCh=function(idx){
    if(typeof _oP==='function')_oP.apply(this,arguments);
    var cs=gGC();
    for(var i=0;i<cs.length;i++){if(cs[i].getAttribute('onclick')==='playCh('+idx+')'){{K.g=cs[i];break;}}}
    setTimeout(showBadge,150);
  };
  if(_oSO)window.showOv=function(){_oSO.apply(this,arguments);setTimeout(showBadge,10);};
  if(_oHO)window.hideOv=function(){_oHO.apply(this,arguments);hideBadge();};
  var oC=window.closePlayer,oS=window.stopStream;
  function rA(){
    hHud();hideBadge();K.nb='';clearTimeout(K.nt);clearTimeout(K.nh);
    setTimeout(function(){
      if(K.c){K.c.classList.remove('kbf');K.c=null;}
      if(K.g&&document.contains(K.g)){kF(K.g);return;}
      var cs=gGC();if(cs.length){kF(cs[0]);return;}
      kF($i('tabC'));
    },100);
  }
  window.closePlayer=function(){if(typeof oC==='function')try{oC.apply(this,arguments);}catch(x){}rA();};
  window.stopStream=function(){if(typeof oS==='function')try{oS.apply(this,arguments);}catch(x){}rA();};
})();

document.removeEventListener('keydown',onKey);
document.addEventListener('keydown',onKey,{passive:false});
document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){if(!K.c){var t=$i('tabC');if(t)kF(t);}},350);});
