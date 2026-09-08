/* ============================================================
   飲控紀錄、趨勢圖、明細、備份
   ============================================================ */
/* ---------- 飲控紀錄 ---------- */
function logMeal(){
  if(!meal.length) return;
  const date=normDate(document.getElementById('logDate').value||todayStr());
  const slot=document.getElementById('logSlot').value;
  const name=document.getElementById('logName').value.trim()||foodOf(meal[0]).n+' 餐';
  const t=totals(meal);
  const entry={date,slot,name,items:meal.map(m=>m.id!=null?{id:m.id,amt:m.amt,n:foodOf(m).n,u:foodOf(m).u||'g'}:{cid:m.cid,n:m.n,u:m.u||'份',amt:m.amt,k:m.k,p:m.p,cb:m.cb,pending:!!m.pending,src:m.src}),k:Math.round(t.k),p:+t.p.toFixed(1),cb:+t.cb.toFixed(1),ts:Date.now()};
  log.push(entry);persist.addLog(entry);
  closeSheet();renderLog();renderToday();clearMeal();
  toast('已紀錄 '+date+' '+slot+(t.pending?'（'+t.pending+' 項待估算）':''));
}
function delLog(ts){if(!confirm('刪除這筆紀錄？'))return;log=log.filter(l=>l.ts!==ts);persist.delLog(ts);renderLog();renderToday();}
function reloadLog(ts){const l=log.find(x=>x.ts===ts);if(!l)return;meal=l.items.filter(it=>it.id==null||foodExists(it.id)).map(it=>({...it}));setMealName(l.name);renderMeal();showTab('calc');toast('已載入到計算');}
function toggleDetail(){const p=document.getElementById('detailPanel');const on=p.style.display==='none';p.style.display=on?'block':'none';document.getElementById('detailBtn').style.display=on?'none':'block';if(on)renderLog();}
function closeDetail(){logShow=7;document.getElementById('detailPanel').style.display='none';document.getElementById('detailBtn').style.display='block';document.getElementById('logSearch').value='';}
function showDetail(date){document.getElementById('logSearch').value=date;const p=document.getElementById('detailPanel');p.style.display='block';document.getElementById('detailBtn').style.display='none';renderLog();setTimeout(()=>{const el=document.getElementById('logList');if(el)el.scrollIntoView({behavior:'smooth',block:'start'});},50);}
function renderLog(){
  normalizeLog(); renderCharts();
  const byDateAll={};log.forEach(l=>{(byDateAll[l.date]=byDateAll[l.date]||[]).push(l);});
  const allDates=Object.keys(byDateAll).sort().reverse(); const days=allDates.length;
  const avgKAll=days?Math.round(allDates.reduce((a,d)=>a+byDateAll[d].reduce((x,l)=>x+l.k,0),0)/days):0;
  const avgPAll=days?Math.round(allDates.reduce((a,d)=>a+byDateAll[d].reduce((x,l)=>x+l.p,0),0)/days):0;
  document.querySelector('#sDays b').textContent=days;document.querySelector('#sKcal b').textContent=avgKAll;document.querySelector('#sPro b').textContent=avgPAll+'g';
  if(document.getElementById('detailPanel').style.display==='none') return;
  const q=(document.getElementById('logSearch').value||'').trim().toLowerCase();
  const byDate={};
  allDates.forEach(d=>{const ms=q?byDateAll[d].filter(l=>d.includes(q)||l.name.toLowerCase().includes(q)||l.slot.includes(q)||(l.items||[]).some(it=>String(it.n).includes(q))):byDateAll[d];if(ms.length)byDate[d]=ms;});
  const dates=Object.keys(byDate).sort().reverse();
  const box=document.getElementById('logList');
  if(!dates.length){box.innerHTML='<div class="card"><div class="empty">'+(q?'找不到符合的紀錄':'還沒有紀錄。到「計算」組好一餐後按「紀錄這一餐」。')+'</div></div>';return;}
  const shown=dates.slice(0,logShow); const today=todayStr();
  box.innerHTML=shown.map((d,i)=>{const ms=byDate[d].sort((a,b)=>a.ts-b.ts);const K=ms.reduce((a,l)=>a+l.k,0),P=ms.reduce((a,l)=>a+l.p,0);const b=kcalBand();const cls=K>b[1]?'over':(K>=b[0]&&P>=SET.pro?'ok':'');
    const open=(i===0||d===today||q)?' open':'';
    return `<details class="logday"${open}><summary><div class="dh"><b>${d}</b><span class="n">${ms.length} 餐</span><span class="${cls}">${K} kcal・蛋白 ${P.toFixed(0)}g</span></div></summary>${ms.map(l=>`<div class="item"><div class="info"><div class="name"><span class="tag">${l.slot}</span>${l.name}</div><div class="sub">${l.k} kcal・蛋白 ${l.p.toFixed(0)}g・碳水 ${l.cb.toFixed(0)}g</div><div class="sub">${l.items.map(it=>dn(it.n)+' '+fmtAmt(foodOf(it),it.amt)+(it.pending?'(待估算)':'')).join('、')}</div>${l.items.some(it=>it.pending)?'<div class="sub warn">有項目待估算，熱量未含</div>':''}</div><button class="btn sm sec" onclick="reloadLog(${l.ts})">載入</button><button class="del" onclick="delLog(${l.ts})">×</button></div>`).join('')}</details>`;}).join('')
    +(dates.length>logShow?`<button class="more" onclick="logShow+=10;renderLog()">顯示更早的紀錄（還有 ${dates.length-logShow} 天）</button>`:'');
}
function exportLog(){copyText(JSON.stringify({log,saved,exported:new Date().toISOString()}),'備份已複製，貼到備忘錄保存');}
function importLog(){const txt=prompt('貼上之前匯出的備份內容');if(!txt)return;try{const d=JSON.parse(txt);if(Array.isArray(d.log)){const have=new Set(log.map(l=>l.ts));d.log.forEach(l=>{if(!have.has(l.ts)){log.push(l);if(user)FB.setLog(l).catch(()=>{});}});persist.log();}if(Array.isArray(d.saved)){d.saved.forEach(r=>{if(!saved.some(x=>x.name===r.name))saved.push(r);});persist.recipes();}renderLog();renderToday();toast('已匯入');}catch(e){toast('格式不對');}}
function copyLogText(){const byDate={};log.forEach(l=>{(byDate[l.date]=byDate[l.date]||[]).push(l);});const txt=Object.keys(byDate).sort().map(d=>{const ms=byDate[d];const K=ms.reduce((a,l)=>a+l.k,0),P=ms.reduce((a,l)=>a+l.p,0);return d+'  '+K+' kcal / 蛋白 '+P.toFixed(0)+'g\n'+ms.map(l=>'  '+l.slot+' '+l.name+'  '+l.k+' kcal / '+l.p.toFixed(0)+'g').join('\n');}).join('\n');if(!txt){toast('還沒有紀錄');return;}copyText(txt);}

/* ---------- 趨勢圖 ---------- */
function setRange(n){chartRange=n;document.querySelectorAll('#chartTabs .chip').forEach(b=>b.classList.toggle('on',n?b.textContent.startsWith(n+' '):b.textContent==='全部'));renderCharts();}
function dailySeries(){
  const byDate={};log.forEach(l=>{const key=normDate(l.date);const d=byDate[key]=byDate[key]||{k:0,p:0};d.k+=l.k;d.p+=l.p;});
  const dates=Object.keys(byDate).sort(); if(!dates.length) return [];
  const first=new Date(dates[0]),last=new Date(dates[dates.length-1]);let end=new Date(todayStr());if(last>end)end=last;let start=new Date(first);
  if(chartRange){const s2=new Date(end);s2.setDate(s2.getDate()-chartRange+1);if(s2>start)start=s2;}
  const out=[];for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');out.push({date:key,label:(d.getMonth()+1)+'/'+d.getDate(),k:byDate[key]?byDate[key].k:null,p:byDate[key]?byDate[key].p:null});}
  out.forEach((o,i)=>{const win=out.slice(Math.max(0,i-6),i+1).filter(x=>x.k!==null);o.ak=win.length?win.reduce((a,x)=>a+x.k,0)/win.length:null;o.ap=win.length?win.reduce((a,x)=>a+x.p,0)/win.length:null;});
  return out;
}
function svgChart(series,key,avgKey,opt){
  const W=680,H=190,L=44,R=10,T=16,B=26,n=series.length,iw=W-L-R,ih=H-T-B;
  const vals=series.map(s=>s[key]).filter(v=>v!==null);let max=Math.max(opt.max,...vals,1);max=Math.ceil(max/opt.tick)*opt.tick;
  const y=v=>T+ih-(v/max)*ih,bw=iw/n,barW=Math.max(2,bw*0.6);let g='';
  if(opt.band)g+=`<rect x="${L}" y="${y(opt.band[1])}" width="${iw}" height="${y(opt.band[0])-y(opt.band[1])}" style="fill:#ff7a1a;opacity:.13"/>`;
  if(opt.line)g+=`<line x1="${L}" x2="${L+iw}" y1="${y(opt.line)}" y2="${y(opt.line)}" style="stroke:#ff7a1a" stroke-dasharray="4 4" stroke-width="1.5"/>`;
  for(let v=0;v<=max;v+=opt.tick)g+=`<line x1="${L}" x2="${L+iw}" y1="${y(v)}" y2="${y(v)}" style="stroke:#2a2a2a" stroke-width="1"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end" font-size="10" style="fill:#9a9a9a">${v}</text>`;
  series.forEach((s,i)=>{if(s[key]===null)return;const x=L+bw*i+(bw-barW)/2,v=s[key];const col=opt.band?(v>opt.band[1]?'#e05353':(v>=opt.band[0]?'#5fbf6a':'#ff7a1a')):(v>=opt.line?'#5fbf6a':'#ff7a1a');g+=`<rect x="${x.toFixed(1)}" y="${y(v).toFixed(1)}" width="${barW.toFixed(1)}" height="${(T+ih-y(v)).toFixed(1)}" fill="${col}" rx="1" style="cursor:pointer" onclick="showDetail('${s.date}')"><title>${s.date}：${Math.round(v)}${opt.unit}</title></rect>`;});
  const pts=series.map((s,i)=>s[avgKey]===null?null:`${(L+bw*i+bw/2).toFixed(1)},${y(s[avgKey]).toFixed(1)}`).filter(Boolean);if(pts.length>1)g+=`<polyline points="${pts.join(' ')}" fill="none" stroke="#fff" stroke-width="1.5" opacity=".85"/>`;
  const step=Math.ceil(n/8);series.forEach((s,i)=>{if(i%step===0||i===n-1)g+=`<text x="${L+bw*i+bw/2}" y="${H-8}" text-anchor="middle" font-size="10" style="fill:#9a9a9a">${s.label}</text>`;});
  g+=`<text x="${L}" y="${T-5}" font-size="11" style="fill:#ff7a1a">${opt.title}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${g}</svg>`;
}
function renderCharts(){const series=dailySeries();const box=document.getElementById('chartBox');if(!series.length){box.style.display='none';return;}box.style.display='block';
  document.getElementById('chartKcal').innerHTML=svgChart(series,'k','ak',{title:'每日熱量 kcal',max:Math.ceil(SET.kcal*1.15/100)*100,tick:SET.kcal>=3000?800:400,band:kcalBand(),unit:' kcal'});
  document.getElementById('chartPro').innerHTML=svgChart(series,'p','ap',{title:'每日蛋白質 g',max:Math.ceil(SET.pro*1.3/50)*50,tick:50,line:SET.pro,unit:'g'});}
