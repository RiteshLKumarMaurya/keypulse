(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const state = { extractText:'', keys:[], a:[], b:[], nameA:'File A', nameB:'File B', mode:'variable', search:'' };
  const PAYMENT_CONFIG = { upiId: '8651600737@ptaxis', name: 'Ritesh Kumar' };
  const STORAGE = { history: 'keypulse_history_v1', mode: 'keypulse_compare_mode_v1' };
  let history = loadHistory();
  let pasteHistoryTimer = null;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // Robust .env-ish parser. Values are held only in memory for an intentional Value/Both comparison.
  function parse(text){
    const map = new Map();
    for (const raw of String(text || '').split(/\r?\n/)) {
      let line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      line = line.replace(/^export\s+/, '');
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/);
      if (!match) continue;
      const key = match[1];
      if (!map.has(key)) map.set(key, { key, value: cleanValue(match[2]) });
    }
    return [...map.values()];
  }
  function cleanValue(v){
    let value = String(v).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) return value.slice(1,-1);
    return value.replace(/\s+#.*$/, '').trim();
  }
  function loadHistory(){
    try { const raw=localStorage.getItem(STORAGE.history); const parsed=raw?JSON.parse(raw):[]; return Array.isArray(parsed)?parsed.slice(0,20):[]; }
    catch { return []; }
  }
  function saveHistory(entry){
    history=[{...entry,id:crypto.randomUUID?.()||String(Date.now()+Math.random()),time:Date.now()},...history].slice(0,20);
    try { localStorage.setItem(STORAGE.history,JSON.stringify(history)); } catch {}
    renderHistory();
  }
  function clearHistory(){
    history=[]; try{localStorage.removeItem(STORAGE.history)}catch{}; renderHistory(); toast('Local history cleared');
  }
  function timeAgo(ts){
    const sec=Math.max(1,Math.floor((Date.now()-ts)/1000));
    if(sec<60)return 'just now'; const min=Math.floor(sec/60); if(min<60)return `${min}m ago`; const hr=Math.floor(min/60); if(hr<24)return `${hr}h ago`; const d=Math.floor(hr/24); return `${d}d ago`;
  }
  function renderHistory(){
    const list=$('#historyList'), count=$('#historyCount'); if(!list||!count)return; count.textContent=`${history.length} ${history.length===1?'event':'events'}`;
    if(!history.length){list.innerHTML='<div class="history-empty"><span>◌</span><b>No local history yet</b><small>Your extraction and comparison activity will appear here.</small></div>';return;}
    list.innerHTML=history.map((h,i)=>{
      const compare=h.kind==='compare';
      const title=compare?`${esc(h.a)} ↔ ${esc(h.b)}`:`${esc(h.file||'Pasted config')}`;
      const detail=compare?`${h.missing} missing · ${h.extra} extra · ${h.different} different · ${h.match} matching · ${esc(h.mode)}`:`${h.keys} variable${h.keys===1?'':'s'} extracted · values discarded`;
      return `<button class="history-item" type="button" data-history-index="${i}"><span class="history-icon ${compare?'compare':'extract'}">${compare?'↔':'⌁'}</span><span class="history-copy"><b>${title}</b><small>${detail}</small></span><time>${timeAgo(h.time)}</time><span class="history-arrow">↗</span></button>`;
    }).join('');
  }
  function setExtract(text, fileName='Pasted config', record=true){ state.extractText=text; state.keys=parse(text).map(x=>x.key); renderExtract(); if(record && state.keys.length) saveHistory({kind:'extract',file:fileName,keys:state.keys.length}); }

  function animateNumber(el, target){
    const from = Number(el.dataset.value || 0), to = Number(target || 0), start = performance.now(), duration = 520;
    cancelAnimationFrame(el._countRAF);
    const tick = now => {
      const p = Math.min(1,(now-start)/duration), eased = 1-Math.pow(1-p,3);
      el.textContent = Math.round(from+(to-from)*eased);
      if(p<1) el._countRAF=requestAnimationFrame(tick); else el.dataset.value=String(to);
    };
    el._countRAF=requestAnimationFrame(tick);
  }

  function renderExtract(){
    const out=$('#extractOutput'), meta=$('#extractMeta'), copy=$('#copyKeys'), dl=$('#downloadKeys');
    meta.textContent=`${state.keys.length} ${state.keys.length===1?'variable':'variables'} · values removed`;
    $('#outputFoot').textContent = state.keys.length ? `${state.keys.length} safe names ready` : 'Waiting for input';
    if(!state.keys.length){ out.innerHTML='<div class="empty"><div>⌁</div><strong>No variables yet</strong><span>Upload or paste KEY=value content.</span></div>'; copy.disabled=true; dl.disabled=true; return; }
    out.innerHTML=state.keys.map((k,i)=>`<div class="key reveal-row"><i>${String(i+1).padStart(2,'0')}</i><code>${esc(k)}</code><span>KEY</span></div>`).join('');
    copy.disabled=false; dl.disabled=false;
  }

  function allRows(){
    const a=new Map(state.a.map(x=>[x.key,x])), b=new Map(state.b.map(x=>[x.key,x]));
    const keys=[...new Set([...a.keys(),...b.keys()])].sort((x,y)=>x.localeCompare(y));
    return keys.map(key=>{
      const x=a.get(key), y=b.get(key);
      let type='match', status='Matching';
      if(!x){type='extra';status='Extra in B';}
      else if(!y){type='missing';status='Missing in B';}
      else if((state.mode==='value'||state.mode==='both') && x.value!==y.value){type='different';status=state.mode==='value'?'Value differs':'Different';}
      return {key,valueA:x?.value,valueB:y?.value,type,status};
    });
  }
  function getRows(){
    const q=state.search.trim().toLowerCase();
    return allRows().filter(r=>!q||`${r.key} ${r.status} ${r.valueA||''} ${r.valueB||''}`.toLowerCase().includes(q));
  }
  function updateCounts(){
    const base=allRows(), counts={missing:0,extra:0,different:0,match:0};
    base.forEach(r=>counts[r.type]++);
    animateNumber($('#missingCount'),counts.missing); animateNumber($('#extraCount'),counts.extra); animateNumber($('#differentCount'),counts.different); animateNumber($('#matchCount'),counts.match);
    return {base,counts};
  }
  function renderCompare(){
    const {base,counts}=updateCounts(), rows=getRows();
    const loaded=state.a.length&&state.b.length;
    let summary = !loaded ? 'Upload both files to see a direct comparison.' : `${counts.missing} missing in B · ${counts.extra} extra in B · ${counts.different} different · ${counts.match} matching`;
    if(state.search.trim()) summary += ` · ${rows.length} result${rows.length===1?'':'s'} shown`;
    $('#summary').textContent=summary;
    const box=$('#comparison');
    if(!loaded){box.innerHTML='<div class="empty"><div>↔</div><strong>Nothing compared yet</strong><span>Choose two files above.</span></div>';return;}
    if(!rows.length){box.innerHTML='<div class="empty"><div>⌕</div><strong>No matching results</strong><span>Try another search.</span></div>';return;}
    box.innerHTML=rows.map(r=>{
      const showValues=state.mode!=='variable' && r.valueA!==undefined && r.valueB!==undefined;
      return `<div class="row ${r.type}"><div class="row-top"><code>${esc(r.key)}</code><span class="status">${r.status}</span></div>${showValues?`<div class="values"><div><b>A:</b> ${esc(maskValue(r.valueA))}</div><div><b>B:</b> ${esc(maskValue(r.valueB))}</div></div>`:''}</div>`;
    }).join('');
    requestAnimationFrame(()=>$$('.row').forEach((el,i)=>{el.style.setProperty('--i',i)}));
  }
  function maskValue(v){
    // Show values only when the user explicitly selected Value/Both.
    return String(v ?? '');
  }

  async function readFile(file){ return file ? await file.text() : ''; }
  async function loadCompare(file,side){
    if(!file)return;
    const entries=parse(await readFile(file));
    if(side==='a'){state.a=entries;state.nameA=file.name;$('#nameA').textContent=file.name;$('#metaA').textContent=`${entries.length} ${entries.length===1?'variable':'variables'} loaded`;}
    else{state.b=entries;state.nameB=file.name;$('#nameB').textContent=file.name;$('#metaB').textContent=`${entries.length} ${entries.length===1?'variable':'variables'} loaded`;}
    toast(`${side==='a'?'File A':'File B'} loaded · ${entries.length} variables`); renderCompare();
    if(state.a.length && state.b.length){ const c=updateCounts().counts; saveHistory({kind:'compare',a:state.nameA,b:state.nameB,mode:state.mode,missing:c.missing,extra:c.extra,different:c.different,match:c.match}); }
  }
  function download(name,text){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),700); }
  function toast(message){ const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),1800); }

  function wireFile(box,input,side){
    const zone=$(box), field=$(input);
    zone.addEventListener('click',e=>{if(e.target!==field)field.click();});
    zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('dragging');});
    zone.addEventListener('dragleave',()=>zone.classList.remove('dragging'));
    zone.addEventListener('drop',async e=>{e.preventDefault();zone.classList.remove('dragging');await loadCompare(e.dataTransfer.files[0],side)});
    field.addEventListener('change',async e=>{await loadCompare(e.target.files[0],side);field.value='';});
  }

  // Extraction upload/paste
  $('#extractDrop').addEventListener('click',e=>{if(e.target.id!=='extractFile')$('#extractFile').click()});
  $('#extractDrop').addEventListener('dragover',e=>{e.preventDefault();$('#extractDrop').classList.add('dragging')});
  $('#extractDrop').addEventListener('dragleave',()=>$('#extractDrop').classList.remove('dragging'));
  $('#extractDrop').addEventListener('drop',async e=>{e.preventDefault();$('#extractDrop').classList.remove('dragging');if(e.dataTransfer.files[0]){setExtract(await readFile(e.dataTransfer.files[0]), e.dataTransfer.files[0].name);toast('Config loaded locally');}});
  $('#extractFile').addEventListener('change',async e=>{setExtract(await readFile(e.target.files[0]), e.target.files[0].name);e.target.value='';toast('Config loaded locally')});
  $('#extractText').addEventListener('input',e=>{ setExtract(e.target.value,'Pasted config',false); clearTimeout(pasteHistoryTimer); pasteHistoryTimer=setTimeout(()=>{if(state.keys.length) saveHistory({kind:'extract',file:'Pasted config',keys:state.keys.length});},900); });
  $('#demoExtract').addEventListener('click',()=>setExtract(`# Database\nDATABASE_URL=postgres://user:password@example.com/db\nDATABASE_POOL=10\n\n# Auth\nexport JWT_SECRET="super-secret-value"\nNEXT_PUBLIC_APP_URL=https://example.com\nAPI_KEY=abc123\nREDIS_URL=redis://:secret@localhost:6379`, 'example.env'));
  $('#copyKeys').addEventListener('click',async()=>{await navigator.clipboard.writeText(state.keys.join('\n'));toast(`${state.keys.length} variable names copied`);});
  $('#downloadKeys').addEventListener('click',()=>{download('variable-names.txt',state.keys.join('\n')+'\n');toast('Safe variable list downloaded')});

  // Comparison
  wireFile('#fileBoxA','#fileA','a'); wireFile('#fileBoxB','#fileB','b');
  $$('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>{state.mode=btn.dataset.mode;$$('[data-mode]').forEach(x=>x.classList.toggle('active',x===btn));renderCompare();toast(`Comparing by ${btn.textContent}`)}));
  $('#compareSearch').addEventListener('input',e=>{state.search=e.target.value;renderCompare()});
  window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#compareSearch').focus();$('#compareSearch').select()}});
  $('#demoCompare').addEventListener('click',()=>{
    state.a=parse(`DATABASE_URL=postgres://old.example/db\nJWT_SECRET=abc\nAPI_KEY=one\nSHARED=true\nPORT=3000`);
    state.b=parse(`DATABASE_URL=postgres://new.example/db\nJWT_SECRET=abc\nNEW_API_KEY=two\nSHARED=true\nPORT=3000\nSENTRY_DSN=demo`);
    state.nameA='production.env';state.nameB='staging.env';$('#nameA').textContent=state.nameA;$('#metaA').textContent=`${state.a.length} variables loaded`;$('#nameB').textContent=state.nameB;$('#metaB').textContent=`${state.b.length} variables loaded`;renderCompare(); const c=updateCounts().counts; saveHistory({kind:'compare',a:state.nameA,b:state.nameB,mode:state.mode,missing:c.missing,extra:c.extra,different:c.different,match:c.match}); toast('Comparison demo loaded');
  });


  // History interactions — only metadata is stored, never config values.
  $('#clearHistory')?.addEventListener('click',clearHistory);
  $('#historyList')?.addEventListener('click',e=>{const item=e.target.closest('[data-history-index]'); if(!item)return; const h=history[Number(item.dataset.historyIndex)]; if(!h)return; if(h.kind==='compare'){state.search='';$('#compareSearch').value='';document.querySelector('#compare')?.scrollIntoView({behavior:'smooth',block:'start'});toast(`Reopening ${h.a} ↔ ${h.b} history`);} else {document.querySelector('#extractDrop')?.scrollIntoView({behavior:'smooth',block:'center'});toast('History stores metadata only — original file contents were never saved');}});

  // Payment footer + QR dissolve/reappear effect. Payment completion is never verified by this site.
  function setupPayment(){
    const modal=$('#paymentModal'), open=$('#supportBtn'), close=$('#closePayment'), qr=$('#paymentQr'), wrap=$('#qrWrap'), scan=$('#scanQr');
    if($('#year')) $('#year').textContent=new Date().getFullYear();
    const setOpen=v=>{modal.classList.toggle('open',v);modal.setAttribute('aria-hidden',String(!v));document.body.classList.toggle('modal-open',v);};
    open?.addEventListener('click',()=>setOpen(true));
    close?.addEventListener('click',()=>setOpen(false));
    modal?.addEventListener('click',e=>{if(e.target.matches('[data-close-payment]'))setOpen(false)});
    window.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});
    let qrTimers=[];
    const clearQrTimers=()=>{qrTimers.forEach(clearTimeout);qrTimers=[]};
    $$('#qrWrap .qr-cloud i').forEach((el,i)=>{const dirs=[[1,-1],[-1,-1],[1,1],[-1,1],[.4,-1],[-.6,-.8]];el.style.setProperty('--dx',dirs[i][0]*70+'px');el.style.setProperty('--dy',dirs[i][1]*80+'px');});
    const dissolve=()=>{
      if(!wrap||wrap.classList.contains('dissolving')) return;
      clearQrTimers();
      wrap.classList.remove('thank-you','reappearing');
      void wrap.offsetWidth;
      wrap.classList.add('dissolving');
      scan?.setAttribute('disabled','true');
      scan?.setAttribute('aria-busy','true');
      const burst=$('#successBurst'); burst?.classList.remove('show'); void burst?.offsetWidth; burst?.classList.add('show');
      qrTimers.push(setTimeout(()=>wrap.classList.add('thank-you'),650));
      qrTimers.push(setTimeout(()=>wrap.classList.remove('dissolving'),1450));
      qrTimers.push(setTimeout(()=>{
        wrap.classList.remove('thank-you');
        void wrap.offsetWidth;
        wrap.classList.add('reappearing');
      },1950));
      qrTimers.push(setTimeout(()=>{
        wrap.classList.remove('reappearing');
        scan?.removeAttribute('disabled');
        scan?.removeAttribute('aria-busy');
      },2850));
    };
    wrap?.addEventListener('click',e=>{if(e.target.closest('#scanQr')) return; dissolve();});
    scan?.addEventListener('click',e=>{e.stopPropagation(); dissolve();});
    $('#copyUpi')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(PAYMENT_CONFIG.upiId);toast('UPI ID copied');}catch{toast(PAYMENT_CONFIG.upiId)}});
  }

  // Micro-interactions: ripple, magnetic buttons, cursor light, card tilt.
  document.addEventListener('pointerdown',e=>{const target=e.target.closest('.magnetic,.interactive,.btn');if(!target)return;const r=document.createElement('span');r.className='ripple';const rect=target.getBoundingClientRect();r.style.left=`${e.clientX-rect.left}px`;r.style.top=`${e.clientY-rect.top}px`;target.appendChild(r);setTimeout(()=>r.remove(),650);});
  const glow=$('#cursorGlow'); window.addEventListener('pointermove',e=>{glow.style.transform=`translate3d(${e.clientX-90}px,${e.clientY-90}px,0)`});
  $$('.magnetic').forEach(el=>el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();const x=(e.clientX-r.left-r.width/2)*.10,y=(e.clientY-r.top-r.height/2)*.10;el.style.transform=`translate(${x}px,${y}px)`}));
  $$('.magnetic').forEach(el=>el.addEventListener('pointerleave',()=>el.style.transform=''));
  $$('.tilt').forEach(card=>card.addEventListener('pointermove',e=>{if(innerWidth<900)return;const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform=`perspective(1100px) rotateX(${-y*2}deg) rotateY(${x*2}deg) translateY(-2px)`}));
  $$('.tilt').forEach(card=>card.addEventListener('pointerleave',()=>card.style.transform=''));
  const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in');io.unobserve(entry.target)}}),{threshold:.08}); $$('.reveal').forEach(x=>io.observe(x));
  window.addEventListener('scroll',()=>{const h=document.documentElement.scrollHeight-innerHeight;$('#progress').style.width=`${h?scrollY/h*100:0}%`},{passive:true});

  try { const savedMode=localStorage.getItem(STORAGE.mode); if(['variable','value','both'].includes(savedMode)){state.mode=savedMode;$$('[data-mode]').forEach(x=>x.classList.toggle('active',x.dataset.mode===savedMode));} } catch {}
  $$('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>{try{localStorage.setItem(STORAGE.mode,state.mode)}catch{}}));
  setExtract(''); renderCompare(); renderHistory(); setupPayment();
})();
