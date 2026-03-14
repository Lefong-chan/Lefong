(function(){
var st=document.createElement('style');
st.textContent=':focus{outline:none!important}'
+'.kbf{box-shadow:0 0 0 3px #e50914,0 0 0 5px rgba(229,9,20,.25)!important;}'
+'#num-hud{position:absolute;top:14px;right:14px;z-index:200;background:rgba(0,0,0,.85);border:2px solid rgba(229,9,20,.65);border-radius:10px;padding:9px 16px 7px;display:flex;flex-direction:column;align-items:center;gap:5px;pointer-events:none;}'
+'#num-hud.nh-hide{display:none}'
+'#nhd{display:flex;gap:7px}'
+'.nd{width:20px;height:26px;border-bottom:2px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-family:"Barlow Condensed",sans-serif;font-size:1.05rem;font-weight:700;color:#fff}'
+'.nd.nf{border-color:#e50914;color:#e50914}'
+'#nhl{font-family:"Barlow Condensed",sans-serif;font-size:.58rem;letter-spacing:1.5px;color:rgba(255,255,255,.4);text-transform:uppercase}';
document.head.appendChild(st);
})();

var KBN={c:null,lG:null,lC:null,lS:null,pT:null,nb:'',nT:null,nHT:null};

function kF(el){
  if(!el)return;
  if(KBN.c&&KBN.c!==el){KBN.c.classList.remove('kbf');if(KBN.c.tagName==='INPUT'||KBN.c.tagName==='TEXTAREA')KBN.c.blur();}
  KBN.c=el;
  el.classList.add('kbf');
  var tag=el.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA'){el.focus();return;}
  try{var p=el.parentElement;while(p){var ov=getComputedStyle(p).overflowY;if(ov==='auto'||ov==='scroll'){var r=el.getBoundingClientRect(),pr=p.getBoundingClientRect();if(r.bottom>pr.bottom)p.scrollTop+=r.bottom-pr.bottom+8;else if(r.top<pr.top)p.scrollTop-=pr.top-r.top+8;break;}p=p.parentElement;}}catch(e){}
}

function mF(el){if(!el)return;if(KBN.c)KBN.c.classList.remove('kbf');KBN.c=el;el.classList.add('kbf');if(el.tagName==='INPUT'||el.tagName==='TEXTAREA')el.focus();else if(el.focus)el.focus();}

function isPV(){var e=document.getElementById('playerview');return e&&e.style.display!==''&&e.style.display!=='none';}
function isWV(){var e=document.getElementById('welcomeScr');return e&&e.style.display!==''&&e.style.display!=='none';}
function isGV(){var e=document.getElementById('gridview');return e&&e.style.display!==''&&e.style.display!=='none';}
function isFS(){return!!(document.fullscreenElement||document.webkitFullscreenElement||document.mozFullScreenElement);}
function isSub(){var e=document.getElementById('chsubpanel');return e&&e.style.display!==''&&e.style.display!=='none';}
function isCO(){var e=document.getElementById('cmdbg');return e&&e.classList.contains('open');}
function isSM(){var e=document.getElementById('srcModal');return e&&e.classList.contains('open');}
function isCM(){var e=document.getElementById('confirmModal');return e&&e.style.display==='flex';}
function isTA(w){var e=document.getElementById(w==='s'?'tabC':'tabCh');return e&&e.classList.contains('active');}

function gSI(){return Array.from(document.querySelectorAll('#srcItems .src-item'));}
function gRI(){return Array.from(document.querySelectorAll('#regionItems .src-item[data-region-id]'));}
function gCL(){return Array.from(document.querySelectorAll('#clist .citem'));}
function gCH(){return Array.from(document.querySelectorAll('#chlist .chitem'));}
function gGC(){return Array.from(document.querySelectorAll('#chgrid .gcard'));}
function gWU(){return document.querySelector('.welcome-cards .wcard:first-child');}
function gWF(){return document.querySelector('.welcome-cards .wcard:last-child');}

function gCols(){
  var g=document.getElementById('chgrid');if(!g||g.classList.contains('list'))return 1;
  var t=getComputedStyle(g).gridTemplateColumns;
  return(t&&t!=='none')?t.split(' ').filter(Boolean).length||1:1;
}

function gR(){
  if(!isWV()){var g=KBN.lG&&document.contains(KBN.lG)?KBN.lG:(gGC()[0]||null);if(g){kF(g);return;}}
  var w=gWU();if(w)kF(w);
}

function gFU(){
  if(KBN.lG&&document.contains(KBN.lG)){kF(KBN.lG);return;}
  var c=gGC();if(c.length&&isGV()){kF(c[0]);return;}
  var w=gWU();if(w)kF(w);
}

function oDM(){
  if(!KBN.c)return;
  var it=KBN.c.closest('.src-item[data-src-idx]');if(!it)return;
  var i=parseInt(it.dataset.srcIdx);if(!isNaN(i))try{delSource({stopPropagation:function(){}},i);}catch(e){}
}

function gSL(){return KBN.lS&&document.contains(KBN.lS)?KBN.lS:null;}

function mkHud(){
  var pv=document.getElementById('playerview');if(!pv)return null;
  var h=document.getElementById('num-hud');
  if(!h){h=document.createElement('div');h.id='num-hud';h.classList.add('nh-hide');h.innerHTML='<div id="nhd"></div><div id="nhl">Ch. direct</div>';var pw=document.getElementById('pwrap');(pw||pv).appendChild(h);}
  return h;
}

function rHud(){
  var h=mkHud();if(!h)return;
  var d=document.getElementById('nhd');if(!d)return;
  var s='';for(var i=0;i<5;i++)s+='<span class="nd'+(i<KBN.nb.length?' nf':'')+'>'+(i<KBN.nb.length?KBN.nb[i]:'_')+'</span>';
  d.innerHTML=s;h.classList.remove('nh-hide');
}

function hHud(){var h=document.getElementById('num-hud');if(h)h.classList.add('nh-hide');}

function onKey(e){
  if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();openCmd();return;}
  if(e.key==='Escape'){
    if(isCO()){closeCmd();return;}
    if(isSM()){closeModal();return;}
    if(isCM()){document.getElementById('confirmModal').style.display='none';return;}
    if(isFS())try{(document.exitFullscreen||document.webkitExitFullscreen||document.mozCancelFullScreen).call(document);}catch(x){}
    return;
  }
  var mk={'MediaPlayPause':1,'MediaTrackNext':1,'MediaTrackPrevious':1,'MediaStop':1};
  if(mk[e.key]){if(isPV()){e.preventDefault();if(e.key==='MediaPlayPause')try{togglePlay();}catch(x){}else if(e.key==='MediaTrackNext')try{nextCh();}catch(x){}else if(e.key==='MediaTrackPrevious')try{prevCh();}catch(x){}else if(e.key==='MediaStop')try{stopStream();}catch(x){}}return;}
  if(isCO()){hCmd(e);return;}
  if(isSM()){hSMod(e);return;}
  if(isCM()){hCMod(e);return;}
  if(e.key==='Delete'||e.key==='Supr'||e.keyCode===46){var tg=document.activeElement&&document.activeElement.tagName;if(tg==='INPUT'||tg==='TEXTAREA')return;if(KBN.c&&KBN.c.closest('.src-item[data-src-idx]'))oDM();return;}
  var nv=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter'];
  if(nv.indexOf(e.key)===-1){if(isPV()&&isFS()&&/^[0-9]$/.test(e.key))hNum(e.key);return;}
  if(isPV()){hPl(e);return;}
  if(!KBN.c||!document.contains(KBN.c)){var ts=document.getElementById('tabC');if(ts)kF(ts);e.preventDefault();return;}
  e.preventDefault();
  var c=KBN.c;
  if(c.classList.contains('sbtab')){hST(c,e.key);return;}
  if(c.classList.contains('src-item')&&c.closest('#srcItems')){hSI(c,e.key);return;}
  if(c.classList.contains('add-src-btn')){hAB(e.key);return;}
  if(c.classList.contains('src-item')&&c.closest('#regionItems')){hRG(c,e.key);return;}
  if(c.id==='chpname'||c.classList.contains('chpname')){hPN(e.key);return;}
  if(c.classList.contains('citem')){hCI(c,e.key);return;}
  if(c.classList.contains('chitem')){hHI(c,e.key);return;}
  if(c.id==='chfilter'||c.classList.contains('chfinput')){hCF(e.key);return;}
  if(c.id==='backToGroups'||c.classList.contains('backbtn')){hBB(e.key);return;}
  if(c.classList.contains('vbtn')&&(c.getAttribute('onclick')||'').indexOf("'grid'")!==-1){hVG(e.key);return;}
  if(c.classList.contains('vbtn')&&(c.getAttribute('onclick')||'').indexOf("'list'")!==-1){hVL(e.key);return;}
  if(c.classList.contains('gcard')){hGC(c,e.key);return;}
  if(c.id==='msearch'){hMS(e.key);return;}
  if(c.classList.contains('hbtn')&&c.classList.contains('desktop-only')){hHD(e.key);return;}
  if(c.classList.contains('hbtn')&&c.classList.contains('red')){hHR(e.key);return;}
  if(c.classList.contains('footlink')&&(c.getAttribute('href')||'').indexOf('tel:')===0){hFP(e.key);return;}
  if(c.classList.contains('footlink')&&(c.getAttribute('href')||'').indexOf('facebook')!==-1){hFF(e.key);return;}
  if(c.classList.contains('wcard')&&c===gWU()){hWU(e.key);return;}
  if(c.classList.contains('wcard')&&c===gWF()){hWF(e.key);return;}
}

function hCmd(e){
  var it=document.querySelectorAll('#cmdlist .cmditem');
  if(e.key==='ArrowDown'){e.preventDefault();cmdSelIdx=Math.min(cmdSelIdx+1,it.length-1);it.forEach(function(x,i){x.classList.toggle('sel',i===cmdSelIdx);});}
  else if(e.key==='ArrowUp'){e.preventDefault();cmdSelIdx=Math.max(cmdSelIdx-1,0);it.forEach(function(x,i){x.classList.toggle('sel',i===cmdSelIdx);});}
  else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();closeCmd();}
  else if(e.key==='Enter'&&cmdSelIdx>=0)try{cmdPlay(parseInt(it[cmdSelIdx].dataset.idx));}catch(x){}
}

function hST(c,k){
  var tS=document.getElementById('tabC'),tC=document.getElementById('tabCh');
  var iS=(c===tS),iC=(c===tC);
  if(k==='ArrowLeft'){if(iC)kF(tS);return;}
  if(k==='ArrowRight'){if(iS){kF(tC);return;}if(iC)gR();return;}
  if(k==='ArrowUp'){var m=document.getElementById('msearch');if(m)kF(m);return;}
  if(k==='ArrowDown'){
    if(iS){
      if(isTA('s')){var s=gSI();if(s.length){kF(s[0]);return;}var b=document.querySelector('.add-src-btn');if(b){kF(b);return;}var r=gRI();if(r.length)kF(r[0]);}
      else{if(isTA('c')&&!isSub()){var ci=gCL();if(ci.length){kF(ci[0]);return;}}if(isTA('c')&&isSub()){var bk=document.getElementById('backToGroups');if(bk){kF(bk);return;}}var f=document.querySelector('.footlinks .footlink');if(f)kF(f);}
      return;
    }
    if(iC){
      if(isTA('c')){if(!isSub()){var ct=gCL();if(ct.length){kF(ct[0]);return;}}if(isSub()){var bk2=document.getElementById('backToGroups');if(bk2){kF(bk2);return;}}var f2=document.querySelector('.footlinks .footlink');if(f2)kF(f2);}
      else{var s2=gSI();if(s2.length){kF(s2[0]);return;}var b2=document.querySelector('.add-src-btn');if(b2)kF(b2);}
      return;
    }
  }
  if(k==='Enter'){if(iS)switchTab('sources');if(iC)switchTab('channels');}
}

function hSI(c,k){
  var s=gSI(),i=s.indexOf(c);
  if(k==='ArrowLeft'){oDM();return;}
  if(k==='ArrowRight'){KBN.lS=c;gR();return;}
  if(k==='ArrowUp'){if(i===0){var t=document.getElementById('tabCh');if(t)kF(t);}else kF(s[i-1]);return;}
  if(k==='ArrowDown'){if(i===s.length-1){var b=document.querySelector('.add-src-btn');if(b)kF(b);}else kF(s[i+1]);return;}
  if(k==='Enter'){var si=parseInt(c.dataset.srcIdx);if(!isNaN(si))try{loadSource(si);}catch(x){}}
}

function hAB(k){
  if(k==='ArrowLeft')return;
  if(k==='ArrowRight'){KBN.lS=document.querySelector('.add-src-btn');gR();return;}
  if(k==='ArrowUp'){var s=gSI();if(s.length){kF(s[s.length-1]);return;}var t=document.getElementById('tabCh');if(t)kF(t);return;}
  if(k==='ArrowDown'){var r=gRI();if(r.length)kF(r[0]);return;}
  if(k==='Enter')try{openModal();}catch(x){}
}

function hRG(c,k){
  var r=gRI(),i=r.indexOf(c);
  if(k==='ArrowLeft')return;
  if(k==='ArrowRight'){KBN.lS=c;gR();return;}
  if(k==='ArrowUp'){if(i===0){var b=document.querySelector('.add-src-btn');if(b){kF(b);return;}}kF(r[Math.max(i-1,0)]);return;}
  if(k==='ArrowDown'){if(i===r.length-1){var f=document.querySelector('.footlinks .footlink');if(f)kF(f);return;}kF(r[i+1]);return;}
  if(k==='Enter'){var rid=c.dataset.regionId;if(rid)try{loadRegion(rid);}catch(x){}}
}

function hPN(k){
  if(k==='ArrowLeft')return;
  if(k==='ArrowRight'){gR();return;}
  if(k==='ArrowUp'){var t=document.getElementById('tabCh');if(t)kF(t);return;}
  if(k==='ArrowDown'){var it=gCL();if(it.length)kF(it[0]);return;}
}

function hCI(c,k){
  var it=gCL(),i=it.indexOf(c);
  if(k==='ArrowLeft')return;
  if(k==='ArrowRight'){KBN.lS=c;gR();return;}
  if(k==='ArrowUp'){if(i===0){var p=document.getElementById('chpname');if(p){kF(p);return;}var t=document.getElementById('tabCh');if(t)kF(t);return;}kF(it[i-1]);return;}
  if(k==='ArrowDown'){if(i===it.length-1){var f=document.querySelector('.footlinks .footlink');if(f){kF(f);return;}}kF(it[i+1]);return;}
  if(k==='Enter'){KBN.lC=c;c.click();setTimeout(function(){var h=gCH();if(h.length)kF(h[0]);},80);}
}

function hHI(c,k){
  var it=gCH(),i=it.indexOf(c);
  if(k==='ArrowLeft'){var lc=KBN.lC&&document.contains(KBN.lC)?KBN.lC:(gCL().find(function(x){return x.classList.contains('active');})||gCL()[0]);if(lc)kF(lc);return;}
  if(k==='ArrowRight'){gR();return;}
  if(k==='ArrowUp'){if(i===0){var cf=document.getElementById('chfilter');if(cf)kF(cf);return;}kF(it[i-1]);return;}
  if(k==='ArrowDown'){if(i===it.length-1){var f=document.querySelector('.footlinks .footlink');if(f){kF(f);return;}}kF(it[i+1]);return;}
  if(k==='Enter')c.click();
}

function hCF(k){
  if(k==='ArrowLeft')return;
  if(k==='ArrowRight'){gR();return;}
  if(k==='ArrowUp'){var b=document.getElementById('backToGroups');if(b)kF(b);return;}
  if(k==='ArrowDown'){var it=gCH();if(it.length)kF(it[0]);return;}
  if(k==='Enter'){var e=document.getElementById('chfilter');if(e)e.blur();}
}

function hBB(k){
  var lc=KBN.lC&&document.contains(KBN.lC)?KBN.lC:(gCL().find(function(x){return x.classList.contains('active');})||gCL()[0]);
  if(k==='ArrowLeft'){if(lc)kF(lc);return;}
  if(k==='ArrowRight'){gR();return;}
  if(k==='ArrowUp'){var t=document.getElementById('tabCh');if(t)kF(t);return;}
  if(k==='ArrowDown'){var cf=document.getElementById('chfilter');if(cf)kF(cf);return;}
  if(k==='Enter'){if(lc)kF(lc);try{backToGroups();}catch(x){}}
}

function hVG(k){
  var vb=Array.from(document.querySelectorAll('.vbtn')),vl=vb.find(function(b){return(b.getAttribute('onclick')||'').indexOf("'list'")!==-1;});
  if(k==='ArrowLeft'){var t=document.getElementById('tabCh');if(t)kF(t);return;}
  if(k==='ArrowRight'){if(vl)kF(vl);return;}
  if(k==='ArrowUp'){var h=document.querySelector('.hbtn.red');if(h)kF(h);return;}
  if(k==='ArrowDown'){var g=KBN.lG&&document.contains(KBN.lG)?KBN.lG:(gGC()[0]||null);if(g)kF(g);return;}
  if(k==='Enter'){var vg=vb.find(function(b){return(b.getAttribute('onclick')||'').indexOf("'grid'")!==-1;});if(vg)try{setView('grid',vg);}catch(x){}}
}

function hVL(k){
  var vb=Array.from(document.querySelectorAll('.vbtn')),vg=vb.find(function(b){return(b.getAttribute('onclick')||'').indexOf("'grid'")!==-1;});
  if(k==='ArrowLeft'){if(vg)kF(vg);return;}
  if(k==='ArrowRight')return;
  if(k==='ArrowUp'){var h=document.querySelector('.hbtn.red');if(h)kF(h);return;}
  if(k==='ArrowDown'){var g=KBN.lG&&document.contains(KBN.lG)?KBN.lG:(gGC()[0]||null);if(g)kF(g);return;}
  if(k==='Enter'){var vl=vb.find(function(b){return(b.getAttribute('onclick')||'').indexOf("'list'")!==-1;});if(vl)try{setView('list',vl);}catch(x){}}
}

function hGC(c,k){
  var cs=gGC(),i=cs.indexOf(c),cols=gCols();
  if(k==='ArrowLeft'){
    var fR=(cols>1)?(i%cols===0):(i===0);
    if(i===0||fR){var sl=gSL();if(sl){kF(sl);return;}if(KBN.lC&&document.contains(KBN.lC)){kF(KBN.lC);return;}var ts=document.getElementById('tabC');if(ts)kF(ts);return;}
    kF(cs[i-1]);return;
  }
  if(k==='ArrowRight'){if(cols===1)return;if(i<cs.length-1)kF(cs[i+1]);return;}
  if(k==='ArrowUp'){var ab=i-cols;if(ab<0){var vb=Array.from(document.querySelectorAll('.vbtn'));var in2=vb.find(function(b){return!b.classList.contains('active');});if(in2)kF(in2);return;}kF(cs[ab]);return;}
  if(k==='ArrowDown'){var bl=i+cols;if(bl>=cs.length){var f=document.querySelector('.footlinks .footlink');if(f)kF(f);return;}kF(cs[bl]);return;}
  if(k==='Enter'){KBN.lG=c;c.click();}
}

function hMS(k){
  if(k==='ArrowLeft'||k==='ArrowUp')return;
  if(k==='ArrowRight'){var hd=document.querySelector('.hbtn.desktop-only');if(hd){kF(hd);return;}var hr=document.querySelector('.hbtn.red');if(hr)kF(hr);return;}
  if(k==='ArrowDown'){var t=document.getElementById('tabC');if(t)kF(t);return;}
  if(k==='Enter'){var m=document.getElementById('msearch');if(m)m.blur();}
}

function hHD(k){
  if(k==='ArrowUp')return;
  if(k==='ArrowLeft'){var m=document.getElementById('msearch');if(m)kF(m);return;}
  if(k==='ArrowRight'){var hr=document.querySelector('.hbtn.red');if(hr)kF(hr);return;}
  if(k==='ArrowDown'){var vb=Array.from(document.querySelectorAll('.vbtn'));var in2=vb.find(function(b){return!b.classList.contains('active');});if(in2&&isGV()){kF(in2);return;}var w=gWU();if(w)kF(w);return;}
  if(k==='Enter')try{openCmd();}catch(x){}
}

function hHR(k){
  if(k==='ArrowUp'||k==='ArrowRight')return;
  if(k==='ArrowLeft'){var hd=document.querySelector('.hbtn.desktop-only');if(hd){kF(hd);return;}var m=document.getElementById('msearch');if(m)kF(m);return;}
  if(k==='ArrowDown'){var vb=Array.from(document.querySelectorAll('.vbtn'));var in2=vb.find(function(b){return!b.classList.contains('active');});if(in2&&isGV()){kF(in2);return;}var w=gWU();if(w)kF(w);return;}
  if(k==='Enter')try{openModal();}catch(x){}
}

function hFP(k){
  if(k==='ArrowLeft'||k==='ArrowDown')return;
  if(k==='ArrowRight'){var fl=document.querySelectorAll('.footlinks .footlink');if(fl.length>1)kF(fl[1]);return;}
  if(k==='ArrowUp')gFU();
  if(k==='Enter'&&KBN.c)KBN.c.click();
}

function hFF(k){
  if(k==='ArrowRight'||k==='ArrowDown')return;
  if(k==='ArrowLeft'){var fl=document.querySelectorAll('.footlinks .footlink');if(fl.length>0)kF(fl[0]);return;}
  if(k==='ArrowUp')gFU();
  if(k==='Enter'&&KBN.c)KBN.c.click();
}

function hWU(k){
  if(k==='ArrowRight'){var wf=gWF();if(wf)kF(wf);return;}
  if(k==='ArrowLeft'){var t=document.getElementById('tabC');if(t)kF(t);return;}
  if(k==='ArrowUp'){var hr=document.querySelector('.hbtn.red');if(hr)kF(hr);return;}
  if(k==='ArrowDown'){var f=document.querySelector('.footlinks .footlink');if(f)kF(f);return;}
  if(k==='Enter')try{openModal('url');}catch(x){}
}

function hWF(k){
  if(k==='ArrowRight')return;
  if(k==='ArrowLeft'){var wu=gWU();if(wu)kF(wu);return;}
  if(k==='ArrowUp'){var hr=document.querySelector('.hbtn.red');if(hr)kF(hr);return;}
  if(k==='ArrowDown'){var f=document.querySelector('.footlinks .footlink');if(f)kF(f);return;}
  if(k==='Enter')try{openModal('file');}catch(x){}
}

function hPl(e){
  var k=e.key;
  showOv();rPOT();
  var pv=document.getElementById('playerview');
  var cr=pv?pv.querySelector('.ctrlrow'):null;
  var cbP=cr?cr.querySelector('.cbtn:first-child'):null;
  var ppb=document.getElementById('ppbtn');
  var cbN=ppb?ppb.nextElementSibling:null;
  var stb=cbN?cbN.nextElementSibling:null;
  var vol=document.getElementById('volr');
  var fsb=pv?pv.querySelector('.fsbtn'):null;
  var prv=pv?pv.querySelector('.navbtn:first-child'):null;
  var nxt=pv?pv.querySelector('.navbtn:nth-child(2)'):null;
  var cls=pv?pv.querySelector('.closebtn'):null;
  var rtb=pv?pv.querySelector('.retrybtn'):null;
  var rtV=rtb&&rtb.offsetParent!==null;
  var cL=[cbP,ppb,cbN,stb,vol,fsb].filter(Boolean);
  var pL=[prv,nxt,cls].filter(Boolean);
  var iC=KBN.c&&cL.indexOf(KBN.c)!==-1;
  var iP=KBN.c&&pL.indexOf(KBN.c)!==-1;
  var iR=KBN.c===rtb;
  if(!KBN.c||!pv||!pv.contains(KBN.c)){if(cbP){kF(cbP);e.preventDefault();return;}}
  e.preventDefault();
  var c=KBN.c;
  if(iC){
    var ci=cL.indexOf(c);
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
    var pi=pL.indexOf(c);
    if(k==='ArrowLeft'){if(pi>0)kF(pL[pi-1]);return;}
    if(k==='ArrowRight'){if(pi<pL.length-1)kF(pL[pi+1]);return;}
    if(k==='ArrowDown')return;
    if(k==='ArrowUp'){if(c===cls){if(fsb)kF(fsb);return;}if(cbP)kF(cbP);return;}
    if(k==='Enter'){
      if(c===prv)try{prevCh();}catch(x){}
      else if(c===nxt)try{nextCh();}catch(x){}
      else if(c===cls)try{closePlayer();}catch(x){}
    }
    return;
  }
  if(iR){
    if(k==='ArrowDown'){if(cbP)kF(cbP);return;}
    if(k==='Enter')try{retryStream();}catch(x){}
  }
}

function rPOT(){clearTimeout(KBN.pT);KBN.pT=setTimeout(hideOv,5000);}

function hNum(d){
  clearTimeout(KBN.nT);clearTimeout(KBN.nHT);
  KBN.nb+=d;rHud();showOv();rPOT();
  if(KBN.nb.length>=5){
    var i=parseInt(KBN.nb)-1;KBN.nb='';
    KBN.nHT=setTimeout(hHud,600);
    if(i>=0&&typeof channels!=='undefined'&&i<channels.length)try{playCh(i);}catch(x){}
    return;
  }
  KBN.nT=setTimeout(function(){var i=parseInt(KBN.nb)-1;KBN.nb='';KBN.nHT=setTimeout(hHud,600);if(i>=0&&typeof channels!=='undefined'&&i<channels.length)try{playCh(i);}catch(x){}},3000);
}

function hSMod(e){
  if(e.key==='Escape'){closeModal();return;}
  var fo=Array.from(document.querySelectorAll('#srcModal .src-type-btn,#srcModal input:not([type=file]):not([disabled]),#srcModal .file-drop,#srcModal .mbtn-cancel,#srcModal .mbtn-add:not([disabled])')).filter(function(x){return x.offsetParent!==null;});
  if(!fo.length)return;
  var ci=fo.indexOf(KBN.c);if(ci===-1)ci=fo.indexOf(document.activeElement);
  var gN=function(){e.preventDefault();mF(fo[(ci>=fo.length-1)?0:ci+1]);};
  var gP=function(){e.preventDefault();mF(fo[(ci<=0)?fo.length-1:ci-1]);};
  if(e.key==='ArrowDown'||e.key==='ArrowRight'||(e.key==='Tab'&&!e.shiftKey)){gN();return;}
  if(e.key==='ArrowUp'||e.key==='ArrowLeft'||(e.key==='Tab'&&e.shiftKey)){gP();return;}
  if(e.key==='Enter'){var a=KBN.c||document.activeElement;if(a&&(a.tagName==='BUTTON'||a.classList.contains('src-type-btn')||a.classList.contains('file-drop')))a.click();}
}

function hCMod(e){
  if(e.key==='Escape'){document.getElementById('confirmModal').style.display='none';return;}
  var bt=Array.from(document.querySelectorAll('#confirmModal .mbtn-cancel,#confirmModal .mbtn-add'));
  if(!bt.length)return;
  var ci=bt.indexOf(KBN.c);if(ci===-1)ci=bt.indexOf(document.activeElement);
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'||e.key==='Tab'){e.preventDefault();var nx=(e.key==='ArrowLeft'||(e.key==='Tab'&&e.shiftKey))?(ci<=0?bt.length-1:ci-1):(ci>=bt.length-1?0:ci+1);mF(bt[nx]);return;}
  if(e.key==='Enter'){var a=KBN.c||document.activeElement;if(a)a.click();}
}

document.addEventListener('click',function(e){
  var ca=e.target.closest('#chgrid .gcard');
  if(ca){KBN.lG=ca;kF(ca);}
  var ci=e.target.closest('#clist .citem');
  if(ci)KBN.lC=ci;
  var si=e.target.closest('#srcItems .src-item,#regionItems .src-item,.add-src-btn');
  if(si)KBN.lS=si;
},true);

(function(){
  var oC=window.closePlayer,oS=window.stopStream;
  function rA(){
    hHud();KBN.nb='';clearTimeout(KBN.nT);clearTimeout(KBN.nHT);
    setTimeout(function(){
      if(KBN.c){KBN.c.classList.remove('kbf');KBN.c=null;}
      if(KBN.lG&&document.contains(KBN.lG)){kF(KBN.lG);return;}
      var cs=gGC();if(cs.length){kF(cs[0]);return;}
      var t=document.getElementById('tabC');if(t)kF(t);
    },100);
  }
  window.closePlayer=function(){if(typeof oC==='function')oC.apply(this,arguments);rA();};
  window.stopStream=function(){if(typeof oS==='function')oS.apply(this,arguments);rA();};
})();

document.removeEventListener('keydown',onKey);
document.addEventListener('keydown',onKey);
document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){if(!KBN.c){var t=document.getElementById('tabC');if(t)kF(t);}},350);});
