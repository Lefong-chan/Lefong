const API_PROXY='/api/proxy';
const API_CHANNELS='/api/channels';
let sources=(()=>{try{return JSON.parse(localStorage.getItem('iptv_sources')||'[]');}catch(e){return[];}})();
let channels=[],filtered=[],curGroup=null,curChIdx=-1,curSrcIdx=-1,curRegion=null,hls=null,curSrcType='url',viewMode='grid',fileContent=null,cmdSelIdx=-1,regions=[],showingChSubpanel=false,ovTimer=null;

window.addEventListener('DOMContentLoaded',()=>{
  setStatus('load','Prêt');
  sources=sources.filter(s=>s.type!=='file');
  saveSources();
  loadRegions();
  renderSrcItems();
  (function autoLoad(){
    for(var _ai=sources.length-1;_ai>=0;_ai--){
      if(sources[_ai]&&sources[_ai].type==='url'&&sources[_ai].url){
        try{loadSource(_ai);}catch(err){showWelcome();}
        return;
      }
    }
    showWelcome();
  })();
  document.getElementById('msearch').addEventListener('input',e=>globalSearch(e.target.value));
  document.getElementById('chfilter').addEventListener('input',e=>renderChList(e.target.value));
  const fd=document.getElementById('fileDrop');
  fd.addEventListener('dragover',e=>{e.preventDefault();fd.classList.add('dragover');});
  fd.addEventListener('dragleave',()=>fd.classList.remove('dragover'));
  fd.addEventListener('drop',e=>{e.preventDefault();fd.classList.remove('dragover');const f=e.dataTransfer.files[0];if(f)readFile(f);});
  document.getElementById('fileInput').addEventListener('change',e=>{if(e.target.files[0])readFile(e.target.files[0]);});
  document.getElementById('confirmNo').onclick=()=>{document.getElementById('confirmModal').style.display='none';};
  const pwrap=document.getElementById('pwrap');
  if(pwrap){
    pwrap.addEventListener('click',function(e){if(e.target.closest('button')||e.target.closest('input'))return;toggleOv();});
    pwrap.addEventListener('mousemove',resetOvTimerIfVisible);
    pwrap.addEventListener('touchstart',resetOvTimerIfVisible,{passive:true});
  }
  document.getElementById('cmdbg').addEventListener('click',e=>{if(e.target===document.getElementById('cmdbg'))closeCmd();});
  document.getElementById('cmdinput').addEventListener('input',e=>renderCmd(e.target.value));
});

function loadRegions(){
  fetch(API_CHANNELS,{method:'GET',credentials:'omit'})
    .then(r=>r.json())
    .then(d=>{regions=d.regions||[];renderRegionItems();})
    .catch(()=>{document.getElementById('regionItems').innerHTML='<div class="region-loading" style="color:var(--accent)"><i class="fa-solid fa-circle-exclamation"></i> Erreur de chargement</div>';});
}

function renderRegionItems(){
  const el=document.getElementById('regionItems');
  if(!regions.length){el.innerHTML='';return;}
  el.innerHTML=regions.map(r=>`<div class="src-item ${curRegion===r.id?'active':''}" data-region-id="${esc(r.id)}"><div class="src-icon built-in"><span style="font-size:1rem;line-height:1">${r.icon}</span></div><div><div class="src-name">${esc(r.name)}</div><div class="src-meta">Région intégrée</div></div></div>`).join('');
  el.querySelectorAll('.src-item[data-region-id]').forEach(item=>{item.addEventListener('click',()=>loadRegion(item.dataset.regionId));});
}

function loadRegion(id){
  curRegion=id;curSrcIdx=-1;
  renderRegionItems();renderSrcItems();
  var region=null;
  for(var _i=0;_i<regions.length;_i++){if(regions[_i].id===id){region=regions[_i];break;}}
  var label=region?(region.icon+' '+region.name):id;
  showLoading('Chargement de '+label+'...');
  setStatus('load','Chargement...');
  var _res;
  fetch(API_CHANNELS+'?id='+encodeURIComponent(id),{method:'GET',credentials:'omit'})
    .then(r=>{_res=r;return r.json();})
    .then(d=>{if(!_res.ok)throw new Error(d.error||('Erreur HTTP '+_res.status));onChannelsLoaded(d.channels||[],label);})
    .catch(err=>{setStatus('err','Erreur');showToast('Erreur',err.message,'err');showWelcome();});
}

function setStatus(type,msg){document.getElementById('sdot').className='sdot '+type;document.getElementById('stxt').textContent=msg;}

function saveSources(){
  try{const toSave=sources.map(s=>({name:s.name,type:s.type,url:s.url,count:s.count}));localStorage.setItem('iptv_sources',JSON.stringify(toSave));}catch(e){}
}

function renderSrcItems(){
  const el=document.getElementById('srcItems');
  if(!sources.length){el.innerHTML='';return;}
  el.innerHTML=sources.map((s,i)=>`<div class="src-item ${curSrcIdx===i?'active':''}" data-src-idx="${i}"><div class="src-icon ${s.type==='file'?'file':'url'}"><i class="fa-solid ${s.type==='file'?'fa-file-lines':'fa-link'}"></i></div><div style="flex:1;min-width:0;overflow:hidden;cursor:pointer;"><div class="src-name">${esc(s.name)}</div><div class="src-meta">${s.type.toUpperCase()}${s.count!=null?' · '+s.count+' ch':''}</div></div><button class="src-del" onclick="delSource(event,${i})" title="Supprimer"><i class="fa-solid fa-trash"></i></button></div>`).join('');
  el.querySelectorAll('.src-item[data-src-idx]').forEach(item=>{
    const idx=parseInt(item.dataset.srcIdx);
    item.addEventListener('click',e=>{if(e.target.closest('.src-del'))return;try{loadSource(idx);}catch(err){}});
  });
}

function loadSource(idx){
  var src=sources[idx];if(!src)return;
  curSrcIdx=idx;curRegion=null;
  renderSrcItems();renderRegionItems();
  if(src.type==='file'){showToast('Info','Rechargez le fichier M3U depuis le bouton Ajouter.','');return;}
  showLoading('Chargement de '+src.name+'...');
  setStatus('load','Chargement...');
  var _res;
  fetch(API_PROXY+'?url='+encodeURIComponent(src.url),{method:'GET',credentials:'omit'})
    .then(r=>{_res=r;return r.json();})
    .then(d=>{if(!_res.ok)throw new Error(d.error||('Erreur HTTP '+_res.status));src.count=d.total;saveSources();renderSrcItems();onChannelsLoaded(d.channels||[],src.name);})
    .catch(err=>{setStatus('err','Erreur');showToast('Erreur',err.message,'err');showWelcome();});
}

function addSource(){
  var name=document.getElementById('srcName').value.trim();
  var btn=document.getElementById('addSrcBtn');
  if(!name){showToast('Erreur','Donnez un nom à la source.','err');return;}
  btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Chargement...';
  function onDone(){btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-plus"></i> Ajouter';}
  function onSuccess(data,srcName){
    saveSources();closeModal();curSrcIdx=sources.length-1;curRegion=null;
    renderSrcItems();renderRegionItems();onChannelsLoaded(data.channels||[],srcName);
    var total=data.total!=null?data.total:(data.channels?data.channels.length:0);
    showToast('Source ajoutée',total+' chaînes chargées.');onDone();
  }
  function onError(msg){showToast('Erreur',msg,'err');onDone();}
  if(curSrcType==='url'){
    var url=document.getElementById('m3uUrl').value.trim();
    if(!url){onError('URL M3U requise.');return;}
    var _res;
    fetch(API_PROXY+'?url='+encodeURIComponent(url),{method:'GET',credentials:'omit'})
      .then(r=>{_res=r;return r.json();})
      .then(d=>{if(!_res.ok)throw new Error(d.error||'Erreur API');if(!d)throw new Error("Aucune donnée reçue.");sources.push({type:'url',name:name,url:url,count:d.total});onSuccess(d,name);})
      .catch(e=>onError(e.message));
  }else if(curSrcType==='file'){
    if(!fileContent){onError('Sélectionnez un fichier M3U.');return;}
    var _res2;
    fetch(API_PROXY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:fileContent})})
      .then(r=>{_res2=r;return r.json();})
      .then(d=>{if(!_res2.ok)throw new Error(d.error||'Erreur API');if(!d)throw new Error("Aucune donnée reçue.");sources.push({type:'file',name:name,url:null,count:d.total});onSuccess(d,name);})
      .catch(e=>onError(e.message));
  }else{onError('Type de source inconnu.');}
}

function delSource(e,idx){
  try{
    e.stopPropagation();
    if(idx<0||idx>=sources.length)return;
    const src=sources[idx];if(!src)return;
    document.getElementById('confirmMsg').textContent='Supprimer la source « '+src.name+' » ?';
    const modal=document.getElementById('confirmModal');
    modal.style.display='flex';
    document.getElementById('confirmYes').onclick=()=>{
      try{
        modal.style.display='none';
        sources.splice(idx,1);saveSources();
        if(curSrcIdx===idx){curSrcIdx=-1;channels=[];filtered=[];showWelcome();setStatus('load','Prêt');}
        else if(curSrcIdx>idx){curSrcIdx--;}
        renderSrcItems();showToast('Source supprimée',src.name);
      }catch(err){}
    };
  }catch(err){}
}

function readFile(file){
  const reader=new FileReader();
  reader.onload=e=>{
    fileContent=e.target.result;
    document.getElementById('fileNameTxt').textContent=file.name;
    document.getElementById('fileName').classList.add('show');
    if(!document.getElementById('srcName').value.trim())document.getElementById('srcName').value=file.name.replace(/\.m3u8?$/i,'');
  };
  reader.readAsText(file);
}

function onChannelsLoaded(chs,label){
  channels=chs;curGroup=null;filtered=chs;
  setStatus('live',chs.length+' chaînes');
  showGrid();renderGrid(chs,label);renderGroupList(chs);renderChList('');
}

function showWelcome(){
  document.getElementById('welcomeScr').style.display='flex';
  document.getElementById('loadscr').style.display='none';
  document.getElementById('gridview').style.display='none';
  document.getElementById('playerview').style.display='none';
}
function showLoading(msg){
  document.getElementById('loadtxt').textContent=msg||'Chargement...';
  document.getElementById('welcomeScr').style.display='none';
  document.getElementById('loadscr').style.display='flex';
  document.getElementById('gridview').style.display='none';
  document.getElementById('playerview').style.display='none';
}
function showGrid(){
  document.getElementById('welcomeScr').style.display='none';
  document.getElementById('loadscr').style.display='none';
  document.getElementById('gridview').style.display='flex';
  document.getElementById('playerview').style.display='none';
}
function showPlayer(){
  document.getElementById('welcomeScr').style.display='none';
  document.getElementById('loadscr').style.display='none';
  document.getElementById('gridview').style.display='none';
  document.getElementById('playerview').style.display='flex';
}

function renderGrid(list,title){
  const grid=document.getElementById('chgrid');
  const ttl=document.getElementById('gridttl');
  const meta=document.getElementById('gridmeta');
  ttl.innerHTML=title?esc(title.toUpperCase())+' <span>CHAÎNES</span>':'TOUTES LES <span>CHAÎNES</span>';
  meta.textContent=list.length+' chaîne'+(list.length!==1?'s':'');
  if(!list.length){grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--t3);">Aucune chaîne trouvée.</div>';return;}
  grid.innerHTML=list.map((ch,i)=>{
    const realIdx=channels.indexOf(ch);
    const isActive=curChIdx===realIdx;
    const initials=esc(ch.name.slice(0,3).toUpperCase());
    const thumb=ch.logo
      ?`<img src="${esc(ch.logo)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="cardtxt" style="display:none">${initials}</span>`
      :`<span class="cardtxt">${initials}</span>`;
    return `<div class="gcard${isActive?' active':''}" onclick="playCh(${realIdx})" title="${esc(ch.name)}"><div class="cardthumb">${thumb}</div><span class="cardnum">${i+1}</span><div class="cardbody"><div class="cardname">${esc(ch.name)}</div>${ch.group?`<div class="cardgrp">${esc(ch.group)}</div>`:''}</div></div>`;
  }).join('');
}

function setView(mode,btn){
  viewMode=mode;
  document.querySelectorAll('.vbtn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('chgrid').className='chgrid '+mode;
  renderGrid(filtered);
}

function renderGroupList(chs){
  const groups=[...new Set(chs.map(c=>c.group||'').filter(Boolean))].sort();
  const el=document.getElementById('clist');
  const catIcons={'sport':'fa-futbol','sports':'fa-futbol','kids':'fa-child','enfants':'fa-child','news':'fa-newspaper','info':'fa-newspaper','music':'fa-music','musique':'fa-music','movie':'fa-film','movies':'fa-film','films':'fa-film','entertainment':'fa-star','divertissement':'fa-star','general':'fa-tv','culture':'fa-palette','auto':'fa-car','outdoor':'fa-tree','public':'fa-building','comedy':'fa-face-laugh'};
  function getIcon(group){
    const lower=group.toLowerCase();
    for(const[key,ico]of Object.entries(catIcons)){if(lower.includes(key))return ico;}
    return 'fa-folder';
  }
  el.innerHTML=[
    `<div class="citem${!curGroup?' active':''}" onclick="filterGroup(null)"><i class="cico fa-solid fa-border-all"></i><span class="cname">Toutes les chaînes</span><span class="ccnt">${chs.length}</span></div>`,
    ...groups.map(g=>{const cnt=chs.filter(c=>c.group===g).length;const ico=getIcon(g);return`<div class="citem${curGroup===g?' active':''}" data-group="${esc(g)}"><i class="cico fa-solid ${ico}"></i><span class="cname">${esc(g)}</span><span class="ccnt">${cnt}</span></div>`;})
  ].join('');
  el.querySelectorAll('.citem[data-group]').forEach(item=>{item.addEventListener('click',()=>filterGroup(item.dataset.group));});
}

function filterGroup(g){
  curGroup=g;
  filtered=g?channels.filter(c=>c.group===g):channels;
  renderGroupList(channels);
  renderGrid(filtered,g||'');
  document.getElementById('chpname').textContent=g||'Toutes les chaînes';
  document.getElementById('chfilter').value='';
  renderChList('');
  showChSubpanel(!!g);
  switchTab('channels');
}

function backToGroups(){
  showChSubpanel(false);curGroup=null;filtered=channels;
  renderGroupList(channels);renderGrid(channels,'');
}

function showChSubpanel(show){
  showingChSubpanel=show;
  const sub=document.getElementById('chsubpanel');
  const clist=document.getElementById('clist');
  const titleRow=document.querySelector('#panel-channels .src-list-title');
  if(show){sub.style.display='flex';clist.style.display='none';if(titleRow)titleRow.style.display='none';}
  else{sub.style.display='none';clist.style.display='block';if(titleRow)titleRow.style.display='flex';}
}

function renderChList(q){
  const src=filtered.filter(c=>!q||c.name.toLowerCase().includes(q.toLowerCase()));
  const el=document.getElementById('chlist');
  el.innerHTML=src.map((ch,i)=>{
    const realIdx=channels.indexOf(ch);
    const logoInner=ch.logo?`<img src="${esc(ch.logo)}" alt="" loading="lazy" onerror="this.style.display='none'">`:`<span>${esc(ch.name.slice(0,2).toUpperCase())}</span>`;
    return`<div class="chitem${curChIdx===realIdx?' active':''}" onclick="playCh(${realIdx})"><span class="chnbadge">${i+1}</span><div class="chlogo">${logoInner}</div><div class="chinfo"><div class="chn">${esc(ch.name)}</div>${ch.group?`<div class="chg">${esc(ch.group)}</div>`:''}</div><i class="fa-solid fa-play chpico"></i></div>`;
  }).join('');
}

function globalSearch(q){
  if(!channels.length)return;
  filtered=q?channels.filter(c=>c.name.toLowerCase().includes(q.toLowerCase())):(curGroup?channels.filter(c=>c.group===curGroup):channels);
  renderGrid(filtered,q?'"'+q+'"':'');
}

function playCh(idx){
  try{
    if(!channels||!channels.length)return;
    if(idx<0||idx>=channels.length)return;
    curChIdx=idx;
    const ch=channels[idx];
    if(!ch||!ch.url){showError('URL de chaîne manquante.');return;}
    showPlayer();
    document.getElementById('nowname').textContent=ch.name||'';
    document.getElementById('nowgrp').textContent=ch.group||'';
    document.getElementById('chcur').textContent=idx+1;
    document.getElementById('chtot').textContent=channels.length;
    document.getElementById('playerr').style.display='none';
    document.getElementById('spinov').style.display='flex';
    renderChList(document.getElementById('chfilter').value);
    startStream(ch.url);showOv();resetOvTimer();
  }catch(err){showError('Erreur lecture.');}
}

function isVidaaBrowser(){return /VIDAA/i.test(navigator.userAgent)||/HiSense/i.test(navigator.userAgent)||/Tizen/i.test(navigator.userAgent);}

function startStream(url){
  try{
    var vid=document.getElementById('vid');
    if(hls){try{hls.destroy();}catch(e){}hls=null;}
    var isVidaa=isVidaaBrowser();
    if(isVidaa){
      vid.src=url;vid.load();
      var pp=vid.play();
      if(pp&&typeof pp.then==='function'){pp.then(()=>hideSpinner()).catch(()=>startStreamHls(vid,url));}
      else{hideSpinner();}
      vid.addEventListener('playing',hideSpinner,{once:true});
      vid.addEventListener('error',()=>startStreamHls(vid,url),{once:true});
      return;
    }
    if(typeof Hls!=='undefined'&&Hls.isSupported()){startStreamHls(vid,url);}
    else if(vid.canPlayType('application/vnd.apple.mpegurl')){
      vid.src=url;vid.load();vid.play().catch(()=>{});
      vid.addEventListener('playing',hideSpinner,{once:true});
      vid.addEventListener('error',()=>showError('Format non supporté'),{once:true});
    }else{
      vid.src=url;vid.load();vid.play().catch(()=>{});
      vid.addEventListener('playing',hideSpinner,{once:true});
      vid.addEventListener('error',()=>showError('Format non supporté'),{once:true});
    }
  }catch(err){showError('Erreur démarrage flux.');}
}

function startStreamHls(vid,url){
  try{
    if(hls){try{hls.destroy();}catch(e){}hls=null;}
    if(typeof Hls!=='undefined'&&Hls.isSupported()){
      hls=new Hls({enableWorker:false,lowLatencyMode:false});
      hls.loadSource(url);hls.attachMedia(vid);
      hls.on(Hls.Events.MANIFEST_PARSED,()=>{vid.play().catch(()=>{});hideSpinner();});
      hls.on(Hls.Events.ERROR,(e,d)=>{if(d&&d.fatal)showError(d.details||'Erreur HLS');});
    }else{showError('Format HLS non supporté sur cet appareil.');}
  }catch(err){showError('Erreur HLS.');}
}

function hideSpinner(){document.getElementById('spinov').style.display='none';}

function showError(msg){
  document.getElementById('spinov').style.display='none';
  document.getElementById('playerr').style.display='flex';
  document.getElementById('errmsg').textContent=msg||'Impossible de lire cette chaîne.';
}

function retryStream(){if(curChIdx>=0)playCh(curChIdx);}
function prevCh(){if(curChIdx>0)playCh(curChIdx-1);}
function nextCh(){if(curChIdx<channels.length-1)playCh(curChIdx+1);}
function setVol(v){document.getElementById('vid').volume=parseFloat(v);}

function togglePlay(){
  const vid=document.getElementById('vid');
  const btn=document.getElementById('ppbtn');
  if(vid.paused){vid.play();btn.innerHTML='<i class="fa-solid fa-pause"></i>';}
  else{vid.pause();btn.innerHTML='<i class="fa-solid fa-play"></i>';}
}

function stopStream(){document.getElementById('vid').src='';closePlayer();}

function closePlayer(){
  if(hls){hls.destroy();hls=null;}
  document.getElementById('vid').src='';
  clearTimeout(ovTimer);showOv();
  if(channels.length)showGrid();else showWelcome();
}

function toggleFS(){
  const pw=document.getElementById('pwrap');
  if(!document.fullscreenElement)(pw.requestFullscreen||pw.webkitRequestFullscreen||pw.mozRequestFullScreen).call(pw);
  else(document.exitFullscreen||document.webkitExitFullscreen||document.mozCancelFullScreen).call(document);
}

function openModal(type){
  const t=type||'url';
  selectSrcType(t,document.getElementById('typeBtn-'+t));
  document.getElementById('srcModal').classList.add('open');
  document.getElementById('srcName').value='';
  document.getElementById('m3uUrl').value='';
  document.getElementById('fileNameTxt').textContent='';
  document.getElementById('fileName').classList.remove('show');
  fileContent=null;
}

function closeModal(){document.getElementById('srcModal').classList.remove('open');}

function selectSrcType(t,btn){
  curSrcType=t;
  document.querySelectorAll('.src-type-btn').forEach(b=>b.classList.remove('selected'));
  if(btn)btn.classList.add('selected');
  document.querySelectorAll('.type-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('panel-'+t).classList.add('active');
}

function openCmd(){
  document.getElementById('cmdbg').classList.add('open');
  document.getElementById('cmdinput').value='';
  document.getElementById('cmdinput').focus();
  renderCmd('');
}

function closeCmd(){document.getElementById('cmdbg').classList.remove('open');cmdSelIdx=-1;}

function renderCmd(q){
  const list=document.getElementById('cmdlist');
  cmdSelIdx=-1;
  if(!channels.length){list.innerHTML='<div class="cmdsec">Aucune source chargée</div>';return;}
  const res=q?channels.filter(c=>c.name.toLowerCase().includes(q.toLowerCase())).slice(0,30):channels.slice(0,30);
  if(!res.length){list.innerHTML='<div class="cmdsec">Aucun résultat</div>';return;}
  list.innerHTML='<div class="cmdsec">'+res.length+' résultat'+(res.length!==1?'s':'')+'</div>'+
    res.map(ch=>{
      const ri=channels.indexOf(ch);
      const logoInner=ch.logo?`<img src="${esc(ch.logo)}" alt="" loading="lazy" onerror="this.style.display='none'">`:`<span>${esc(ch.name.slice(0,2).toUpperCase())}</span>`;
      return`<div class="cmditem" data-idx="${ri}" onclick="cmdPlay(${ri})"><div class="cmdlogo">${logoInner}</div><div><div class="cmdcn">${esc(ch.name)}</div>${ch.group?`<div class="cmdcg">${esc(ch.group)}</div>`:''}</div></div>`;
    }).join('');
}

function cmdPlay(idx){closeCmd();playCh(idx);}

function onKey(e){}

function switchTab(tab){
  document.querySelectorAll('.sbtab').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.sbpanel').forEach(p=>p.classList.remove('active'));
  if(tab==='sources'){document.getElementById('tabC').classList.add('active');document.getElementById('panel-sources').classList.add('active');}
  else{document.getElementById('tabCh').classList.add('active');document.getElementById('panel-channels').classList.add('active');}
}

function mnGo(page){
  document.querySelectorAll('.mnbtn').forEach(b=>b.classList.remove('active'));
  if(page==='home'){document.getElementById('mn-home').classList.add('active');closeSb();if(!channels.length)showWelcome();else showGrid();}
  else if(page==='pays'){document.getElementById('mn-pays').classList.add('active');openSb();switchTab('sources');}
  else if(page==='chaines'){document.getElementById('mn-chaines').classList.add('active');openSb();switchTab('channels');}
  else if(page==='search'){document.getElementById('mn-search').classList.add('active');openCmd();}
}

function openSb(){document.getElementById('sidebar').classList.add('open');document.getElementById('sbov').classList.add('show');}
function closeSb(){document.getElementById('sidebar').classList.remove('open');document.getElementById('sbov').classList.remove('show');}

let toastTmr=null;
function showToast(title,sub,type){
  const t=document.getElementById('toast');
  document.getElementById('toastt').textContent=title;
  document.getElementById('toasts').textContent=sub||'';
  t.style.borderColor=type==='err'?'rgba(229,9,20,.4)':'var(--bd2)';
  t.classList.add('show');clearTimeout(toastTmr);
  toastTmr=setTimeout(()=>t.classList.remove('show'),3500);
}

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function showOv(){const ov=document.getElementById('playerov');if(!ov)return;ov.classList.remove('hidden');}
function hideOv(){const ov=document.getElementById('playerov');if(!ov)return;ov.classList.add('hidden');}
function resetOvTimer(){clearTimeout(ovTimer);ovTimer=setTimeout(hideOv,5000);}
function resetOvTimerIfVisible(){const ov=document.getElementById('playerov');if(!ov||ov.classList.contains('hidden'))return;resetOvTimer();}
function toggleOv(){
  const ov=document.getElementById('playerov');if(!ov)return;
  if(ov.classList.contains('hidden')){showOv();resetOvTimer();}
  else{clearTimeout(ovTimer);hideOv();}
}
