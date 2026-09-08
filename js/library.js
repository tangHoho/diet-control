/* ============================================================
   食材庫九宮格、五天菜單
   ============================================================ */
/* ---------- 食材庫 ---------- */
function renderLibTabs(){const cats=['全部',...new Set(allFoods().map(f=>f.c))];document.getElementById('libTabs').innerHTML=cats.map(c=>`<button class="chip ${c===curCat?'on':''}" onclick="setCat('${c}')">${c}</button>`).join('');}
function setCat(c){curCat=c;renderLibTabs();renderLib();}
function renderLib(){
  const q=document.getElementById('libSearch').value.trim();
  const list=allFoods().filter(f=>(curCat==='全部'||f.c===curCat)&&(!q||f.n.includes(q)||(f.note||'').includes(q)));
  document.getElementById('libCount').textContent=list.length+' 項';
  document.getElementById('libList').innerHTML=list.map(f=>{const n=nut(f,f.d);return `<button class="tile ${f.custom?'custom':''}" onclick='addFood(${JSON.stringify(f.id)},true)' title="${f.note||''}"><span class="plus">＋</span>${f.custom?`<span class="tdel" onclick="event.stopPropagation();delUserFood('${f.id}')">×</span>`:''}<span class="tn">${dnTile(f.n)}</span><span class="ta">${fmtAmt(f,f.d)}</span><span class="tk">${Math.round(n.k)} <small style="font-size:10px;font-weight:400">kcal</small></span><span class="tp">蛋白 ${n.p.toFixed(0)}g・碳水 ${n.cb.toFixed(0)}g</span></button>`;}).join('')||'<div class="empty" style="grid-column:1/-1">找不到</div>';
}
function renderDays(){
  document.getElementById('daysList').innerHTML=DAYS.map((d,di)=>`<details><summary><span>第 ${di+1} 天・${d.t}</span><span class="muted" style="font-weight:400;font-size:12px;margin-right:8px">${d.tag}</span></summary><div class="body">${d.meals.map((m,mi)=>{const items=m.map(([n,a])=>({id:byName(n).id,amt:a}));const t=totals(items);
    return `<div class="item"><div class="info"><div class="name"><span class="tag">第${mi?'二':'一'}餐</span>${m.map(([n,a])=>dn(n)).join('、')}</div><div class="sub">${Math.round(t.k)} kcal・蛋白 ${t.p.toFixed(0)}g・碳水 ${t.cb.toFixed(0)}g</div></div><button class="btn sm sec" onclick="loadDay(${di},${mi})">載入</button></div>`;}).join('')}</div></details>`).join('');
}
function loadDay(di,mi){meal=DAYS[di].meals[mi].map(([n,a])=>({id:byName(n).id,amt:a}));setMealName(`第${di+1}天 第${mi?'二':'一'}餐`);renderMeal();showTab('calc');toast('已載入到計算');}

/* ---------- 自訂食材 ---------- */
function openFoodSheet(){
  const sel=document.getElementById('ufCat');
  const cats=[...new Set(FOODS.map(f=>f.c))];
  sel.innerHTML=cats.map(c=>`<option>${c}</option>`).join('')+'<option>自訂</option>';
  ['ufName','ufK','ufP','ufCb','ufD','ufNote'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('ufUnit').value='g';
  ufUnitChanged();
  openSheet('food');
}
function ufUnitChanged(){
  const g=document.getElementById('ufUnit').value==='g';
  document.getElementById('ufPerLabel').textContent=g?'每 100g 的營養':'每 1 份的營養';
  document.getElementById('ufD').placeholder=g?'預設份量 g（例 150）':'預設份數（例 1）';
  document.getElementById('ufUnitName').style.display=g?'none':'block';
}
function saveUserFood(){
  const n=document.getElementById('ufName').value.trim();
  const k=+document.getElementById('ufK').value,p=+document.getElementById('ufP').value||0,cb=+document.getElementById('ufCb').value||0;
  const unitG=document.getElementById('ufUnit').value==='g';
  const d=+document.getElementById('ufD').value||(unitG?100:1);
  if(!n||!k){toast('請填名稱和熱量');return;}
  const f={id:'u'+Date.now(),c:document.getElementById('ufCat').value,n,k,p,cb,d,note:document.getElementById('ufNote').value.trim(),custom:true};
  if(!unitG) f.u=document.getElementById('ufUnitName').value.trim()||'份';
  USER_FOODS.push(f); persistFoods();
  renderLibTabs(); renderLib(); closeSheet(); toast('已新增 '+n);
}
function delUserFood(id){
  const f=foodById(id); if(!f) return;
  if(!confirm('刪除自訂食材「'+f.n+'」？已紀錄的餐不受影響。')) return;
  USER_FOODS=USER_FOODS.filter(x=>x.id!==id); persistFoods(); renderLibTabs(); renderLib();
}
