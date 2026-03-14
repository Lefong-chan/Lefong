(function(){
var s=document.createElement('style');
s.textContent=':focus{outline:none!important}.kbf{outline:2px solid #e50914!important;outline-offset:3px!important;box-shadow:0 0 0 4px rgba(229,9,20,.25)!important;position:relative!important;z-index:9999!important;}';
document.head.appendChild(s);
})();

var KBN={cur:null,lastGrid:null,lastClist:null,lastSidebar:null,playerOvTimer:null,numBuf:'',numTimer:null};

function kbFocus(el){
  if(!el)return;
  if(KBN.cur&&KBN.cur!==el){
    KBN.cur.classList.remove('kbf');
    if(KBN.cur.tagName==='INPUT'||KBN.cur.tagName==='TEXTAREA')KBN.cur.blur();
  }
  KBN.cur=el;
  el.classList.add('kbf');
  try{el.scrollIntoView({block:'nearest',behavior:'smooth'});}catch(e){}
  if(el.tagName==='INPUT'||el.tagName==='TEXTAREA')el.focus();
}

function isPV(){var pv=document.getElementById('playerview');return pv&&pv.style.display!=='none'&&pv.style.display!=='';}
function isWV(){var w=document.getElementById('welcomeScr');return w&&w.style.display!=='none'&&w.style.display!=='';}
function isGV(){var gv=document.getElementById('gridview');return gv&&gv.style.display!=='none'&&gv.style.display!=='';}
function isFS(){return!!(document.fullscreenElement||document.webkitFullscreenElement||document.mozFullScreenElement);}
function isTabA(w){var c=document.getElementById(w==='sources'?'tabC':'tabCh');return c&&c.classList.contains('active');}
function isSub(){var s=document.getElementById('chsubpanel');return s&&s.style.display!=='none'&&s.style.display!=='';}
function isCmdO(){var c=document.getElementById('cmdbg');return c&&c.classList.contains('open');}
function isSrcM(){var s=document.getElementById('srcModal');return s&&s.classList.contains('open');}
function isConM(){var c=document.getElementById('confirmModal');return c&&c.style.display==='flex';}

function gSrc(){return Array.from(document.querySelectorAll('#srcItems .src-item'));}
function gReg(){return Array.from(document.querySelectorAll('#regionItems .src-item[data-region-id]'));}
function gClist(){return Array.from(document.querySelectorAll('#clist .citem'));}
function gChlist(){return Array.from(document.querySelectorAll('#chlist .chitem'));}
function gCards(){return Array.from(document.querySelectorAll('#chgrid .gcard'));}
function gWurl(){return document.querySelector('.welcome-cards .wcard:first-child');}
function gWfile(){return document.querySelector('.welcome-cards .wcard:last-child');}

function getCols(){
  var grid=document.getElementById('chgrid');
  if(!grid)return 1;
  if(grid.classList.contains('list'))return 1;
  var tpl=window.getComputedStyle(grid).gridTemplateColumns;
  if(!tpl||tpl==='none')return 1;
  return tpl.split(' ').filter(Boolean).length||1;
}

function goRight(){
  if(!isWV()){
    var g=(KBN.lastGrid&&document.contains(KBN.lastGrid))?KBN.lastGrid:(gCards()[0]||null);
    if(g){kbFocus(g);return;}
  }
  var wu=gWurl();if(wu)kbFocus(wu);
}

function goFootUp(){
  if(KBN.lastGrid&&document.contains(KBN.lastGrid)){kbFocus(KBN.lastGrid);return;}
  var cards=gCards();
  if(cards.length&&isGV()){kbFocus(cards[0]);return;}
  var wu=gWurl();if(wu)kbFocus(wu);
}

function openDelModal(){
  if(!KBN.cur)return;
  var item=KBN.cur.closest('.src-item[data-src-idx]');
  if(!item)return;
  var idx=parseInt(item.dataset.srcIdx);
  if(!isNaN(idx))try{delSource({stopPropagation:function(){}},idx);}catch(e){}
}

function mFocus(el){
  if(!el)return;
  if(KBN.cur)KBN.cur.classList.remove('kbf');
  KBN.cur=el;el.classList.add('kbf');
  if(el.tagName==='INPUT'||el.tagName==='TEXTAREA')el.focus();
  else if(el.focus)el.focus();
  try{el.scrollIntoView({block:'nearest'});}catch(e){}
}

function getSidebarLast(){
  return KBN.lastSidebar&&document.contains(KBN.lastSidebar)?KBN.lastSidebar:null;
}

function onKey(e){
  if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();openCmd();return;}

  if(e.key==='Escape'){
    if(isCmdO()){closeCmd();return;}
    if(isSrcM()){closeModal();return;}
    if(isConM()){document.getElementById('confirmModal').style.display='none';return;}
    if(isFS())try{(document.exitFullscreen||document.webkitExitFullscreen||document.mozCancelFullScreen).call(document);}catch(err){}
    return;
  }

  if(isCmdO()){
    var items=document.querySelectorAll('#cmdlist .cmditem');
    if(e.key==='ArrowDown'){e.preventDefault();cmdSelIdx=Math.min(cmdSelIdx+1,items.length-1);items.forEach(function(it,i){it.classList.toggle('sel',i===cmdSelIdx);});}
    else if(e.key==='ArrowUp'){e.preventDefault();cmdSelIdx=Math.max(cmdSelIdx-1,0);items.forEach(function(it,i){it.classList.toggle('sel',i===cmdSelIdx);});}
    else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();closeCmd();}
    else if(e.key==='Enter'&&cmdSelIdx>=0)try{cmdPlay(parseInt(items[cmdSelIdx].dataset.idx));}catch(err){}
    return;
  }

  if(isSrcM()){handleSrcModal(e);return;}
  if(isConM()){handleConModal(e);return;}

  if(e.key==='Delete'||e.key==='Supr'||e.keyCode===46){
    var tag=document.activeElement&&document.activeElement.tagName;
    if(tag==='INPUT'||tag==='TEXTAREA')return;
    openDelModal();return;
  }

  var navKeys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter'];
  if(navKeys.indexOf(e.key)===-1){
    if(isPV()&&/^[0-9]$/.test(e.key)){handleNumKey(e.key);}
    return;
  }

  if(isPV()){handlePlayer(e);return;}

  if(!KBN.cur||!document.contains(KBN.cur)){
    var ts=document.getElementById('tabC');if(ts)kbFocus(ts);
    e.preventDefault();return;
  }

  e.preventDefault();
  var cur=KBN.cur;

  if(cur.classList.contains('sbtab')){hSbtab(cur,e.key);return;}
  if(cur.classList.contains('src-item')&&cur.closest('#srcItems')){hSrcItem(cur,e.key);return;}
  if(cur.classList.contains('add-src-btn')){hAddBtn(e.key);return;}
  if(cur.classList.contains('src-item')&&cur.closest('#regionItems')){hRegion(cur,e.key);return;}
  if(cur.id==='chpname'||cur.classList.contains('chpname')){hChpname(e.key);return;}
  if(cur.classList.contains('citem')){hClist(cur,e.key);return;}
  if(cur.classList.contains('chitem')){hChlist(cur,e.key);return;}
  if(cur.id==='chfilter'||cur.classList.contains('chfinput')){hChfinput(e.key);return;}
  if(cur.id==='backToGroups'||cur.classList.contains('backbtn')){hBackbtn(e.key);return;}
  if(cur.classList.contains('vbtn')&&(cur.getAttribute('onclick')||'').indexOf("'grid'")!==-1){hVbtnGrid(e.key);return;}
  if(cur.classList.contains('vbtn')&&(cur.getAttribute('onclick')||'').indexOf("'list'")!==-1){hVbtnList(e.key);return;}
  if(cur.classList.contains('gcard')){hGrid(cur,e.key);return;}
  if(cur.id==='msearch'){hMsearch(e.key);return;}
  if(cur.classList.contains('hbtn')&&cur.classList.contains('desktop-only')){hHbtnDesk(e.key);return;}
  if(cur.classList.contains('hbtn')&&cur.classList.contains('red')){hHbtnRed(e.key);return;}
  if(cur.classList.contains('footlink')&&(cur.getAttribute('href')||'').indexOf('tel:')===0){hFootPhone(e.key);return;}
  if(cur.classList.contains('footlink')&&(cur.getAttribute('href')||'').indexOf('facebook')!==-1){hFootFb(e.key);return;}
  if(cur.classList.contains('wcard')&&cur===gWurl()){hWcardUrl(e.key);return;}
  if(cur.classList.contains('wcard')&&cur===gWfile()){hWcardFile(e.key);return;}
}

function hSbtab(cur,key){
  var tS=document.getElementById('tabC'),tCh=document.getElementById('tabCh');
  var isSrc=(cur===tS),isCh=(cur===tCh);
  if(key==='ArrowLeft'){if(isCh)kbFocus(tS);return;}
  if(key==='ArrowRight'){if(isSrc){kbFocus(tCh);return;}if(isCh){goRight();return;}return;}
  if(key==='ArrowUp'){var ms=document.getElementById('msearch');if(ms)kbFocus(ms);return;}
  if(key==='ArrowDown'){
    if(isSrc){
      if(isTabA('sources')){
        var srcs=gSrc();if(srcs.length){kbFocus(srcs[0]);return;}
        var btn=document.querySelector('.add-src-btn');if(btn){kbFocus(btn);return;}
        var regs=gReg();if(regs.length){kbFocus(regs[0]);return;}
      }else{
        if(isTabA('channels')&&!isSub()){var ci=gClist();if(ci.length){kbFocus(ci[0]);return;}}
        if(isTabA('channels')&&isSub()){var backb=document.getElementById('backToGroups');if(backb){kbFocus(backb);return;}}
        var fl=document.querySelector('.footlinks .footlink');if(fl)kbFocus(fl);
      }
      return;
    }
    if(isCh){
      if(isTabA('channels')){
        if(!isSub()){var citems=gClist();if(citems.length){kbFocus(citems[0]);return;}}
        if(isSub()){var backb2=document.getElementById('backToGroups');if(backb2){kbFocus(backb2);return;}}
        var fl2=document.querySelector('.footlinks .footlink');if(fl2)kbFocus(fl2);
      }else{
        var srcs2=gSrc();if(srcs2.length){kbFocus(srcs2[0]);return;}
        var btn2=document.querySelector('.add-src-btn');if(btn2)kbFocus(btn2);
      }
      return;
    }
  }
  if(key==='Enter'){if(isSrc)switchTab('sources');if(isCh)switchTab('channels');}
}

function hSrcItem(cur,key){
  var srcs=gSrc(),idx=srcs.indexOf(cur);
  if(key==='ArrowLeft'){openDelModal();return;}
  if(key==='ArrowRight'){KBN.lastSidebar=cur;goRight();return;}
  if(key==='ArrowUp'){
    if(idx===0){var t=document.getElementById('tabCh');if(t)kbFocus(t);}
    else kbFocus(srcs[idx-1]);
    return;
  }
  if(key==='ArrowDown'){
    if(idx===srcs.length-1){var b=document.querySelector('.add-src-btn');if(b)kbFocus(b);}
    else kbFocus(srcs[idx+1]);
    return;
  }
  if(key==='Enter'){var si=parseInt(cur.dataset.srcIdx);if(!isNaN(si))try{loadSource(si);}catch(e){}}
}

function hAddBtn(key){
  if(key==='ArrowLeft')return;
  if(key==='ArrowRight'){KBN.lastSidebar=document.querySelector('.add-src-btn');goRight();return;}
  if(key==='ArrowUp'){var srcs=gSrc();if(srcs.length){kbFocus(srcs[srcs.length-1]);return;}var t=document.getElementById('tabCh');if(t)kbFocus(t);return;}
  if(key==='ArrowDown'){var regs=gReg();if(regs.length)kbFocus(regs[0]);return;}
  if(key==='Enter')try{openModal();}catch(e){}
}

function hRegion(cur,key){
  var regs=gReg(),idx=regs.indexOf(cur);
  if(key==='ArrowLeft')return;
  if(key==='ArrowRight'){KBN.lastSidebar=cur;goRight();return;}
  if(key==='ArrowUp'){
    if(idx===0){var b=document.querySelector('.add-src-btn');if(b){kbFocus(b);return;}}
    kbFocus(regs[Math.max(idx-1,0)]);return;
  }
  if(key==='ArrowDown'){
    if(idx===regs.length-1){var fl=document.querySelector('.footlinks .footlink');if(fl)kbFocus(fl);return;}
    kbFocus(regs[idx+1]);return;
  }
  if(key==='Enter'){var rid=cur.dataset.regionId;if(rid)try{loadRegion(rid);}catch(e){}}
}

function hChpname(key){
  if(key==='ArrowLeft')return;
  if(key==='ArrowRight'){goRight();return;}
  if(key==='ArrowUp'){var t=document.getElementById('tabCh');if(t)kbFocus(t);return;}
  if(key==='ArrowDown'){var items=gClist();if(items.length)kbFocus(items[0]);return;}
}

function hClist(cur,key){
  var items=gClist(),idx=items.indexOf(cur);
  if(key==='ArrowLeft')return;
  if(key==='ArrowRight'){KBN.lastSidebar=cur;goRight();return;}
  if(key==='ArrowUp'){
    if(idx===0){var chpn=document.getElementById('chpname');if(chpn){kbFocus(chpn);return;}var t=document.getElementById('tabCh');if(t)kbFocus(t);return;}
    kbFocus(items[idx-1]);return;
  }
  if(key==='ArrowDown'){
    if(idx===items.length-1){var fl=document.querySelector('.footlinks .footlink');if(fl){kbFocus(fl);return;}}
    kbFocus(items[idx+1]);return;
  }
  if(key==='Enter'){KBN.lastClist=cur;cur.click();setTimeout(function(){var ch=gChlist();if(ch.length)kbFocus(ch[0]);},80);}
}

function hChlist(cur,key){
  var items=gChlist(),idx=items.indexOf(cur);
  if(key==='ArrowLeft'){
    var lc=(KBN.lastClist&&document.contains(KBN.lastClist))?KBN.lastClist:(gClist().find(function(c){return c.classList.contains('active');})||gClist()[0]);
    if(lc)kbFocus(lc);return;
  }
  if(key==='ArrowRight'){goRight();return;}
  if(key==='ArrowUp'){if(idx===0){var chf=document.getElementById('chfilter');if(chf)kbFocus(chf);return;}kbFocus(items[idx-1]);return;}
  if(key==='ArrowDown'){
    if(idx===items.length-1){var fl=document.querySelector('.footlinks .footlink');if(fl){kbFocus(fl);return;}}
    kbFocus(items[idx+1]);return;
  }
  if(key==='Enter')cur.click();
}

function hChfinput(key){
  if(key==='ArrowLeft')return;
  if(key==='ArrowRight'){goRight();return;}
  if(key==='ArrowUp'){var back=document.getElementById('backToGroups');if(back)kbFocus(back);return;}
  if(key==='ArrowDown'){var items=gChlist();if(items.length)kbFocus(items[0]);return;}
  if(key==='Enter'){var el=document.getElementById('chfilter');if(el)el.blur();}
}

function hBackbtn(key){
  if(key==='ArrowLeft'){
    var lc=(KBN.lastClist&&document.contains(KBN.lastClist))?KBN.lastClist:(gClist().find(function(c){return c.classList.contains('active');})||gClist()[0]);
    if(lc)kbFocus(lc);return;
  }
  if(key==='ArrowRight'){goRight();return;}
  if(key==='ArrowUp'){var t=document.getElementById('tabCh');if(t)kbFocus(t);return;}
  if(key==='ArrowDown'){var chf=document.getElementById('chfilter');if(chf)kbFocus(chf);return;}
  if(key==='Enter'){
    var lc=(KBN.lastClist&&document.contains(KBN.lastClist))?KBN.lastClist:(gClist().find(function(c){return c.classList.contains('active');})||gClist()[0]);
    if(lc)kbFocus(lc);
    try{backToGroups();}catch(e){}
  }
}

function hVbtnGrid(key){
  var vbtns=Array.from(document.querySelectorAll('.vbtn'));
  var vlist=vbtns.find(function(b){return(b.getAttribute('onclick')||'').indexOf("'list'")!==-1;});
  if(key==='ArrowLeft'){var t=document.getElementById('tabCh');if(t)kbFocus(t);return;}
  if(key==='ArrowRight'){if(vlist)kbFocus(vlist);return;}
  if(key==='ArrowUp'){var h=document.querySelector('.hbtn.red');if(h)kbFocus(h);return;}
  if(key==='ArrowDown'){var g=(KBN.lastGrid&&document.contains(KBN.lastGrid))?KBN.lastGrid:(gCards()[0]||null);if(g)kbFocus(g);return;}
  if(key==='Enter'){var vg=vbtns.find(function(b){return(b.getAttribute('onclick')||'').indexOf("'grid'")!==-1;});if(vg)try{setView('grid',vg);}catch(e){}}
}

function hVbtnList(key){
  var vbtns=Array.from(document.querySelectorAll('.vbtn'));
  var vgrid=vbtns.find(function(b){return(b.getAttribute('onclick')||'').indexOf("'grid'")!==-1;});
  if(key==='ArrowLeft'){if(vgrid)kbFocus(vgrid);return;}
  if(key==='ArrowRight')return;
  if(key==='ArrowUp'){var h=document.querySelector('.hbtn.red');if(h)kbFocus(h);return;}
  if(key==='ArrowDown'){var g=(KBN.lastGrid&&document.contains(KBN.lastGrid))?KBN.lastGrid:(gCards()[0]||null);if(g)kbFocus(g);return;}
  if(key==='Enter'){var vl=vbtns.find(function(b){return(b.getAttribute('onclick')||'').indexOf("'list'")!==-1;});if(vl)try{setView('list',vl);}catch(e){}}
}

function hGrid(cur,key){
  var cards=gCards(),idx=cards.indexOf(cur),cols=getCols();
  if(key==='ArrowLeft'){
    var isFirstRow=(cols>1)?(idx%cols===0):(idx===0);
    if(idx===0||isFirstRow){
      var sb=getSidebarLast();
      if(sb){kbFocus(sb);return;}
      if(KBN.lastClist&&document.contains(KBN.lastClist)){kbFocus(KBN.lastClist);return;}
      var tS=document.getElementById('tabC');if(tS)kbFocus(tS);
      return;
    }
    kbFocus(cards[idx-1]);return;
  }
  if(key==='ArrowRight'){if(cols===1)return;if(idx<cards.length-1)kbFocus(cards[idx+1]);return;}
  if(key==='ArrowUp'){
    var above=idx-cols;
    if(above<0){var vbtns=Array.from(document.querySelectorAll('.vbtn'));var inactive=vbtns.find(function(b){return!b.classList.contains('active');});if(inactive)kbFocus(inactive);return;}
    kbFocus(cards[above]);return;
  }
  if(key==='ArrowDown'){
    var below=idx+cols;
    if(below>=cards.length){var fl=document.querySelector('.footlinks .footlink');if(fl)kbFocus(fl);return;}
    kbFocus(cards[below]);return;
  }
  if(key==='Enter'){KBN.lastGrid=cur;cur.click();}
}

function hMsearch(key){
  if(key==='ArrowLeft'||key==='ArrowUp')return;
  if(key==='ArrowRight'){var hd=document.querySelector('.hbtn.desktop-only');if(hd){kbFocus(hd);return;}var hr=document.querySelector('.hbtn.red');if(hr)kbFocus(hr);return;}
  if(key==='ArrowDown'){var t=document.getElementById('tabC');if(t)kbFocus(t);return;}
  if(key==='Enter'){var ms=document.getElementById('msearch');if(ms)ms.blur();}
}

function hHbtnDesk(key){
  if(key==='ArrowUp')return;
  if(key==='ArrowLeft'){var ms=document.getElementById('msearch');if(ms)kbFocus(ms);return;}
  if(key==='ArrowRight'){var hr=document.querySelector('.hbtn.red');if(hr)kbFocus(hr);return;}
  if(key==='ArrowDown'){
    var vbtns=Array.from(document.querySelectorAll('.vbtn'));
    var inactive=vbtns.find(function(b){return!b.classList.contains('active');});
    if(inactive&&isGV()){kbFocus(inactive);return;}
    var wu=gWurl();if(wu)kbFocus(wu);return;
  }
  if(key==='Enter')try{openCmd();}catch(e){}
}

function hHbtnRed(key){
  if(key==='ArrowUp'||key==='ArrowRight')return;
  if(key==='ArrowLeft'){var hd=document.querySelector('.hbtn.desktop-only');if(hd){kbFocus(hd);return;}var ms=document.getElementById('msearch');if(ms)kbFocus(ms);return;}
  if(key==='ArrowDown'){
    var vbtns=Array.from(document.querySelectorAll('.vbtn'));
    var inactive=vbtns.find(function(b){return!b.classList.contains('active');});
    if(inactive&&isGV()){kbFocus(inactive);return;}
    var wu=gWurl();if(wu)kbFocus(wu);return;
  }
  if(key==='Enter')try{openModal();}catch(e){}
}

function hFootPhone(key){
  if(key==='ArrowLeft'||key==='ArrowDown')return;
  if(key==='ArrowRight'){var fl=document.querySelectorAll('.footlinks .footlink');if(fl.length>1)kbFocus(fl[1]);return;}
  if(key==='ArrowUp'){goFootUp();return;}
  if(key==='Enter'&&KBN.cur)KBN.cur.click();
}

function hFootFb(key){
  if(key==='ArrowRight'||key==='ArrowDown')return;
  if(key==='ArrowLeft'){var fl=document.querySelectorAll('.footlinks .footlink');if(fl.length>0)kbFocus(fl[0]);return;}
  if(key==='ArrowUp'){goFootUp();return;}
  if(key==='Enter'&&KBN.cur)KBN.cur.click();
}

function hWcardUrl(key){
  if(key==='ArrowRight'){var wf=gWfile();if(wf)kbFocus(wf);return;}
  if(key==='ArrowLeft'){var t=document.getElementById('tabC');if(t)kbFocus(t);return;}
  if(key==='ArrowUp'){var hr=document.querySelector('.hbtn.red');if(hr)kbFocus(hr);return;}
  if(key==='ArrowDown'){var fl=document.querySelector('.footlinks .footlink');if(fl)kbFocus(fl);return;}
  if(key==='Enter')try{openModal('url');}catch(e){}
}

function hWcardFile(key){
  if(key==='ArrowRight')return;
  if(key==='ArrowLeft'){var wu=gWurl();if(wu)kbFocus(wu);return;}
  if(key==='ArrowUp'){var hr=document.querySelector('.hbtn.red');if(hr)kbFocus(hr);return;}
  if(key==='ArrowDown'){var fl=document.querySelector('.footlinks .footlink');if(fl)kbFocus(fl);return;}
  if(key==='Enter')try{openModal('file');}catch(e){}
}

function handlePlayer(e){
  var key=e.key;
  showOv();resetPOvTimer();
  var pv=document.getElementById('playerview');
  var ctrlrow=pv?pv.querySelector('.ctrlrow'):null;
  var cbP=ctrlrow?ctrlrow.querySelector('.cbtn:first-child'):null;
  var ppb=document.getElementById('ppbtn');
  var cbN=ppb?ppb.nextElementSibling:null;
  var stb=cbN?cbN.nextElementSibling:null;
  var vol=document.getElementById('volr');
  var fsb=pv?pv.querySelector('.fsbtn'):null;
  var prv=pv?pv.querySelector('.navbtn:first-child'):null;
  var nxt=pv?pv.querySelector('.navbtn:nth-child(2)'):null;
  var cls=pv?pv.querySelector('.closebtn'):null;
  var rtb=pv?pv.querySelector('.retrybtn'):null;
  var rtbVis=rtb&&rtb.offsetParent!==null;
  var ctrlL=[cbP,ppb,cbN,stb,vol,fsb].filter(Boolean);
  var pbarL=[prv,nxt,cls].filter(Boolean);
  var inCtrl=KBN.cur&&ctrlL.indexOf(KBN.cur)!==-1;
  var inPbar=KBN.cur&&pbarL.indexOf(KBN.cur)!==-1;
  var inRtb=KBN.cur===rtb;

  if(!KBN.cur||!pv||!pv.contains(KBN.cur)){if(cbP){kbFocus(cbP);e.preventDefault();return;}}

  e.preventDefault();
  var cur=KBN.cur;

  if(inCtrl){
    var ci=ctrlL.indexOf(cur);
    if(key==='ArrowLeft'){if(ci>0)kbFocus(ctrlL[ci-1]);return;}
    if(key==='ArrowRight'){if(ci<ctrlL.length-1)kbFocus(ctrlL[ci+1]);return;}
    if(key==='ArrowDown'){
      if(cur===vol){var v=Math.max(0,Math.round((parseFloat(vol.value)-0.1)*20)/20);vol.value=v;try{setVol(v);}catch(er){}return;}
      if(!isFS()&&cls){kbFocus(cls);return;}
      return;
    }
    if(key==='ArrowUp'){
      if(cur===vol){var v2=Math.min(1,Math.round((parseFloat(vol.value)+0.1)*20)/20);vol.value=v2;try{setVol(v2);}catch(er){}return;}
      if(rtbVis){kbFocus(rtb);return;}
      return;
    }
    if(key==='Enter'){
      if(cur===ppb)try{togglePlay();}catch(er){}
      else if(cur===cbP)try{prevCh();}catch(er){}
      else if(cur===cbN)try{nextCh();}catch(er){}
      else if(cur===stb)try{stopStream();}catch(er){}
      else if(cur===fsb)try{toggleFS();}catch(er){}
    }
    return;
  }

  if(inPbar){
    var pi=pbarL.indexOf(cur);
    if(key==='ArrowLeft'){if(pi>0)kbFocus(pbarL[pi-1]);return;}
    if(key==='ArrowRight'){if(pi<pbarL.length-1)kbFocus(pbarL[pi+1]);return;}
    if(key==='ArrowDown')return;
    if(key==='ArrowUp'){if(cur===cls){if(fsb)kbFocus(fsb);return;}if(cbP)kbFocus(cbP);return;}
    if(key==='Enter'){
      if(cur===prv)try{prevCh();}catch(er){}
      else if(cur===nxt)try{nextCh();}catch(er){}
      else if(cur===cls)try{closePlayer();}catch(er){}
    }
    return;
  }

  if(inRtb){
    if(key==='ArrowDown'){if(cbP)kbFocus(cbP);return;}
    if(key==='ArrowUp'||key==='ArrowLeft'||key==='ArrowRight')return;
    if(key==='Enter')try{retryStream();}catch(er){}
  }
}

function resetPOvTimer(){
  clearTimeout(KBN.playerOvTimer);
  KBN.playerOvTimer=setTimeout(hideOv,5000);
}

function handleNumKey(digit){
  if(!isPV())return;
  clearTimeout(KBN.numTimer);
  KBN.numBuf+=digit;
  if(KBN.numBuf.length>=5){
    var idx=parseInt(KBN.numBuf)-1;
    KBN.numBuf='';
    if(idx>=0&&idx<channels.length)try{playCh(idx);}catch(e){}
    return;
  }
  KBN.numTimer=setTimeout(function(){
    var idx=parseInt(KBN.numBuf)-1;
    KBN.numBuf='';
    if(idx>=0&&idx<channels.length)try{playCh(idx);}catch(e){}
  },3000);
}

function handleSrcModal(e){
  if(e.key==='Escape'){closeModal();return;}
  var focusable=Array.from(document.querySelectorAll('#srcModal .src-type-btn,#srcModal input:not([type=file]):not([disabled]),#srcModal .file-drop,#srcModal .mbtn-cancel,#srcModal .mbtn-add:not([disabled])')).filter(function(el){return el.offsetParent!==null;});
  if(!focusable.length)return;
  var ci=focusable.indexOf(KBN.cur);if(ci===-1)ci=focusable.indexOf(document.activeElement);
  var goN=function(){e.preventDefault();mFocus(focusable[(ci>=focusable.length-1)?0:ci+1]);};
  var goP=function(){e.preventDefault();mFocus(focusable[(ci<=0)?focusable.length-1:ci-1]);};
  if(e.key==='ArrowDown'||e.key==='ArrowRight'||(e.key==='Tab'&&!e.shiftKey)){goN();return;}
  if(e.key==='ArrowUp'||e.key==='ArrowLeft'||(e.key==='Tab'&&e.shiftKey)){goP();return;}
  if(e.key==='Enter'){var a=KBN.cur||document.activeElement;if(a&&(a.tagName==='BUTTON'||a.classList.contains('src-type-btn')||a.classList.contains('file-drop')))a.click();}
}

function handleConModal(e){
  if(e.key==='Escape'){document.getElementById('confirmModal').style.display='none';return;}
  var btns=Array.from(document.querySelectorAll('#confirmModal .mbtn-cancel,#confirmModal .mbtn-add'));
  if(!btns.length)return;
  var ci=btns.indexOf(KBN.cur);if(ci===-1)ci=btns.indexOf(document.activeElement);
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'||e.key==='Tab'){
    e.preventDefault();
    var next=(e.key==='ArrowLeft'||(e.key==='Tab'&&e.shiftKey))?(ci<=0?btns.length-1:ci-1):(ci>=btns.length-1?0:ci+1);
    mFocus(btns[next]);return;
  }
  if(e.key==='Enter'){var a=KBN.cur||document.activeElement;if(a)a.click();}
}

document.addEventListener('click',function(e){
  var card=e.target.closest('#chgrid .gcard');
  if(card){KBN.lastGrid=card;kbFocus(card);}
  var citem=e.target.closest('#clist .citem');
  if(citem)KBN.lastClist=citem;
  var sbItem=e.target.closest('#srcItems .src-item,#regionItems .src-item,.add-src-btn');
  if(sbItem)KBN.lastSidebar=sbItem;
},true);

(function(){
  var _origClose=window.closePlayer;
  var _origStop=window.stopStream;
  function restoreAfter(){
    setTimeout(function(){
      if(KBN.cur){KBN.cur.classList.remove('kbf');KBN.cur=null;}
      if(KBN.lastGrid&&document.contains(KBN.lastGrid)){kbFocus(KBN.lastGrid);return;}
      var cards=gCards();
      if(cards.length){kbFocus(cards[0]);return;}
      var t=document.getElementById('tabC');if(t)kbFocus(t);
    },100);
  }
  window.closePlayer=function(){if(typeof _origClose==='function')_origClose.apply(this,arguments);restoreAfter();};
  window.stopStream=function(){if(typeof _origStop==='function')_origStop.apply(this,arguments);restoreAfter();};
})();

document.removeEventListener('keydown',onKey);
document.addEventListener('keydown',onKey);

document.addEventListener('DOMContentLoaded',function(){
  setTimeout(function(){if(!KBN.cur){var t=document.getElementById('tabC');if(t)kbFocus(t);}},350);
});
