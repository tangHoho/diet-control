/* ============================================================
   計算頁：這一餐、搜尋加入、今日摘要、食譜、額外攝取
   ============================================================ */
/* ---------- 計算 ---------- */
function foodOf(it){ if(it.id!=null&&foodById(it.id)) return foodById(it.id); return {n:it.n||'未命名',u:it.u||'份',k:it.k||0,p:it.p||0,cb:it.cb||0,custom:true}; }
function keyOf(it){ return it.id!=null?'f'+it.id:it.cid; }
function nut(f,amt){const m=f.u?amt:amt/100;return {k:f.k*m,p:f.p*m,cb:f.cb*m};}
function totals(items){return items.reduce((a,it)=>{if(it.pending){a.pending++;return a;}const n=nut(foodOf(it),it.amt);a.k+=n.k;a.p+=n.p;a.cb+=n.cb;return a;},{k:0,p:0,cb:0,pending:0});}
function fmtAmt(f,amt){return f.u?amt+' '+f.u:amt+' g';}
/* 顯示用名稱：括號改半形；括號內兩字以上才換行 */
function dn(n){return String(n).replace(/（/g,'(').replace(/）/g,')');}
function dnTile(n){
  let s=dn(n), paren='';
  const m=s.match(/\((.+?)\)$/); if(m){ s=s.slice(0,m.index); paren=m[1].length>=2?'<br>('+m[1]+')':'('+m[1]+')'; }
  if(s.length>5) s=s.slice(0,5)+'<br>'+s.slice(5);   // 主名稱超過 5 字在第 5 字後換行
  return s+paren;
}
function setMetric(id,val,unit,target,raw,okMin,okMax){const el=document.getElementById(id);el.querySelector('b').textContent=val+unit;el.querySelector('.bar i').style.width=Math.min(100,raw/target*100)+'%';el.className='metric '+(raw>okMax?'over':(raw>=okMin?'ok':''));}

function addFood(id,fromLib){
  const f=foodById(id); if(!f) return; const ex=meal.find(m=>m.id===id);
  if(ex) ex.amt+= f.u?1:50; else meal.push({id,amt:f.d});
  renderMeal(); toast('已加入 '+dn(f.n)+(fromLib?'（到「計算」查看）':''));
  document.getElementById('quickAdd').value=''; quickSearch('');
}
function changeAmt(key,dir){const it=meal.find(m=>keyOf(m)===key);if(!it)return;const f=foodOf(it);
  const step=f.u?1:(f.n==='無糖豆漿'?100:(f.c==='澱粉'||f.c==='主蛋白'||f.c==='副蛋白'?25:50));
  it.amt=Math.max(0,it.amt+dir*step); if(it.amt===0) meal=meal.filter(m=>keyOf(m)!==key); renderMeal();}
function setAmt(key,v){const it=meal.find(m=>keyOf(m)===key);if(!it)return;let n=parseFloat(v);if(isNaN(n)||n<0)n=0;it.amt=n;if(n===0)meal=meal.filter(m=>keyOf(m)!==key);renderMeal();}
function setCustomNut(key,field,v){const it=meal.find(m=>keyOf(m)===key);if(!it||it.id!=null)return;const n=parseFloat(v);it[field]=isNaN(n)?0:n;if(it.k||it.p||it.cb)it.pending=false;renderMeal();}
function removeFood(key){meal=meal.filter(m=>keyOf(m)!==key);renderMeal();}
function clearMeal(){meal=[];document.getElementById('mealTitle').textContent='這一餐';renderMeal();}

function quickSearch(q){
  q=q.trim(); const box=document.getElementById('quickResults');
  if(!q){box.innerHTML='';return;}
  const hits=allFoods().filter(f=>f.n.includes(q)||(f.note||'').includes(q)).slice(0,6);
  box.innerHTML=hits.map(f=>{const n=nut(f,f.d);return `<div class="item"><div class="info"><div class="name">${dn(f.n)}</div><div class="sub">${fmtAmt(f,f.d)}・${Math.round(n.k)} kcal・蛋白 ${n.p.toFixed(0)}g</div></div><button class="icon-btn orange" onclick='addFood(${JSON.stringify(f.id)})'>＋</button></div>`;}).join('')||'<div class="empty">找不到，可到食材庫「新增食材」或用「額外攝取」文字加入</div>';
}

function renderMeal(){
  const t=totals(meal);
  setMetric('mKcal',Math.round(t.k),'',mealKcal(),t.k,mealKcal()*0.875,mealKcal()*1.1);
  setMetric('mPro',t.p.toFixed(0),'g',mealPro(),t.p,mealPro()*0.9,mealPro()*1.35);
  setMetric('mCarb',t.cb.toFixed(0),'g',50,t.cb,35,60);
  document.getElementById('picked').innerHTML=meal.map(it=>{const f=foodOf(it);const n=nut(f,it.amt);const key=keyOf(it);
    const sub=it.pending?`<div class="sub warn">待估算，可先填數字</div>`:`<div class="sub">${Math.round(n.k)} kcal・蛋白 ${n.p.toFixed(0)}g・碳水 ${n.cb.toFixed(0)}g</div>`;
    const edit=f.custom?`<div class="edit"><label><input type="number" inputmode="decimal" placeholder="0" value="${it.k||''}" onchange="setCustomNut('${key}','k',this.value)">kcal</label><label><input type="number" inputmode="decimal" placeholder="0" value="${it.p||''}" onchange="setCustomNut('${key}','p',this.value)">蛋白g</label><label><input type="number" inputmode="decimal" placeholder="0" value="${it.cb||''}" onchange="setCustomNut('${key}','cb',this.value)">碳水g</label></div>`:'';
    return `<div class="item" style="flex-wrap:wrap"><div class="info" style="flex:1 1 140px"><div class="name">${dn(f.n)}${f.custom?' <span class="tag">額外</span>':''}</div>${sub}${edit}</div>
      <div class="qty"><button onclick="changeAmt('${key}',-1)">−</button><input type="number" inputmode="decimal" min="0" step="${f.u?1:5}" value="${it.amt}" onchange="setAmt('${key}',this.value)"><em>${f.u||'g'}</em><button onclick="changeAmt('${key}',1)">＋</button></div>
      <button class="del" onclick="removeFood('${key}')">×</button></div>`;}).join('');
  document.getElementById('emptyHint').style.display=meal.length?'none':'block';
  const pend=meal.filter(m=>m.pending).length; const base=document.getElementById('mealTitle').dataset.name||'這一餐';
  document.getElementById('mealTitle').textContent=base+(pend?`（${pend} 項待估算）`:'');
}
function setMealName(n){const el=document.getElementById('mealTitle');el.dataset.name=n||'';el.textContent=n||'這一餐';document.getElementById('logName').value=n||'';}

/* ---------- 今日摘要 ---------- */
function renderToday(){
  const d=todayStr(); const ms=log.filter(l=>normDate(l.date)===d);
  const K=ms.reduce((a,l)=>a+l.k,0), P=ms.reduce((a,l)=>a+l.p,0);
  const b=kcalBand();
  document.getElementById('todayKcal').innerHTML=`${K}<small>/ ${SET.kcal.toLocaleString()} kcal</small>`;
  document.getElementById('todayPro').textContent=`蛋白 ${P.toFixed(0)} / ${SET.pro}g`;
  const bar=document.getElementById('todayBar'); bar.querySelector('i').style.width=Math.min(100,K/SET.kcal*100)+'%';
  bar.className='bar '+(K>b[1]?'over':(K>=b[0]?'ok':''));
  const names=slotNames(); const slotOf=n=>ms.filter(l=>l.slot===n);
  const extra=ms.filter(l=>!names.includes(l.slot));
  document.getElementById('todaySlots').innerHTML=names.map(n=>{const m=slotOf(n);const k=m.reduce((a,l)=>a+l.k,0);return `<div class="slot ${m.length?'done':''}"><small>${n}</small><b>${m.length?k+' kcal':'尚未紀錄'}</b></div>`;}).join('')
    +(extra.length?`<div class="slot done"><small>加餐</small><b>${extra.reduce((a,l)=>a+l.k,0)} kcal</b></div>`:'');
  const dt=new Date(); document.getElementById('todayLabel').textContent=`${dt.getMonth()+1}/${dt.getDate()}（${'日一二三四五六'[dt.getDay()]}）`;
}

/* ---------- 食譜 ---------- */
function saveRecipe(){if(!meal.length){toast('這一餐還沒有食材');return;}
  const name=prompt('食譜名稱',document.getElementById('mealTitle').dataset.name||'')||('食譜 '+(saved.length+1));
  saved.push({name,items:meal.map(m=>({...m}))});persist.recipes();toast('已存成食譜');}
function renderRecipes(){const box=document.getElementById('recipeList');
  if(!saved.length){box.innerHTML='<div class="empty">還沒有食譜。組好一餐後按「存成食譜」。</div>';return;}
  box.innerHTML=saved.map((r,i)=>{const t=totals(r.items);return `<div class="item"><div class="info"><div class="name">${r.name}</div><div class="sub">${Math.round(t.k)} kcal・蛋白 ${t.p.toFixed(0)}g・${r.items.map(it=>dn(foodOf(it).n)).join('、')}</div></div><button class="btn sm sec" onclick="loadRecipe(${i})">載入</button><button class="del" onclick="delRecipe(${i})">×</button></div>`;}).join('');}
function loadRecipe(i){meal=saved[i].items.map(m=>({...m}));setMealName(saved[i].name);renderMeal();closeSheet();toast('已載入');}
function delRecipe(i){if(!confirm('刪除「'+saved[i].name+'」？'))return;saved.splice(i,1);persist.recipes();renderRecipes();}
function mealText(items,name){const t=totals(items);return (name||'這一餐')+'\n'+items.map(it=>{const f=foodOf(it);return '・'+f.n+' '+fmtAmt(f,it.amt)+(it.pending?'（待估算）':'');}).join('\n')+`\n合計 ${Math.round(t.k)} kcal・蛋白 ${t.p.toFixed(0)}g・碳水 ${t.cb.toFixed(0)}g`;}
function copyText(txt,msg){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(()=>toast(msg||'已複製'));}else prompt('複製這段文字',txt);}
function copyMeal(){if(!meal.length){toast('這一餐還沒有食材');return;}copyText(mealText(meal,document.getElementById('mealTitle').dataset.name));}

/* ---------- 額外攝取 ---------- */
async function addExtra(){
  const txt=document.getElementById('extraText').value.trim(); if(!txt) return;
  const st=document.getElementById('extraStatus');
  const parts=txt.split(/[、,，;；\n]+/).map(x=>x.trim()).filter(Boolean);
  const mk=(name,vals,pending)=>({cid:'c'+Date.now()+Math.random().toString(36).slice(2,6),n:name,u:'份',amt:1,k:vals?+vals.kcal||0:0,p:vals?+vals.protein||0:0,cb:vals?+vals.carb||0:0,pending,src:name});
  if(ESTIMATE_URL && user){
    st.textContent='估算中…';
    try{const d=await estimatePost(txt);
      if(!d.ok||!Array.isArray(d.items)) throw new Error(d.error||'估算失敗');
      d.items.forEach(x=>meal.push(mk(x.name,x,false)));
      document.getElementById('extraText').value='';st.textContent='';renderMeal();closeSheet();toast('已估算 '+d.items.length+' 項，數字可直接修改');return;
    }catch(e){st.textContent='估算失敗（'+e.message+'），先留空，同步時再補算。';}
  }else st.textContent=user?'未設定估算服務，已加入，可手動填數字。':'登入後才能自動估算；已加入，可手動填數字。';
  parts.forEach(pn=>meal.push(mk(pn,null,true)));
  document.getElementById('extraText').value='';renderMeal();setTimeout(closeSheet,900);
}
async function resolvePending(){
  if(!ESTIMATE_URL||!user) return 0;
  const targets=[];meal.forEach(it=>{if(it.pending)targets.push({it,entry:null});});log.forEach(l=>(l.items||[]).forEach(it=>{if(it.pending)targets.push({it,entry:l});}));
  if(!targets.length) return 0;
  const text=[...new Set(targets.map(t=>t.it.src||t.it.n))].join('、'); let fixed=0;
  try{const d=await estimatePost(text);if(!d.ok||!Array.isArray(d.items))return 0;const touched=new Set();
    targets.forEach(t=>{const hit=d.items.find(x=>x.name===(t.it.src||t.it.n))||d.items.find(x=>x.name.includes(t.it.n)||t.it.n.includes(x.name));if(!hit)return;t.it.k=+hit.kcal||0;t.it.p=+hit.protein||0;t.it.cb=+hit.carb||0;t.it.pending=false;fixed++;if(t.entry)touched.add(t.entry);});
    touched.forEach(l=>{const tt=totals(l.items);l.k=Math.round(tt.k);l.p=+tt.p.toFixed(1);l.cb=+tt.cb.toFixed(1);persist.updLog(l);});
    persist.log();renderMeal();renderLog();
  }catch(e){}
  return fixed;
}
