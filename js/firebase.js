/* ============================================================
   Firebase：Google 登入 + Firestore（ES module）
   ============================================================ */
/* Firebase：Google 登入 + Firestore（含離線快取）。config.js 沒有 firebase 設定時整段略過。 */
const cfg=(window.APP_CONFIG||{}).firebase;
window.FB={ready:false};
if(cfg&&cfg.apiKey){
  try{
    const {initializeApp}=await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const A=await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
    const F=await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    const app=initializeApp(cfg);
    const auth=A.getAuth(app);
    const db=F.initializeFirestore(app,{localCache:F.persistentLocalCache({tabManager:F.persistentMultipleTabManager()})});
    const provider=new A.GoogleAuthProvider();
    provider.setCustomParameters({prompt:'select_account'});   // 每次按登入都跳出帳號選擇
    const uid=()=>auth.currentUser&&auth.currentUser.uid;
    const col=name=>F.collection(db,'users',uid(),name);
    const unsub={};
    window.FB={
      ready:true,
      onAuth(cb){A.onAuthStateChanged(auth,u=>{Object.values(unsub).forEach(f=>f&&f());for(const k in unsub)delete unsub[k];cb(u);});},
      async signIn(){ try{ await A.signInWithPopup(auth,provider); }catch(e){ if(['auth/popup-blocked','auth/popup-closed-by-user','auth/operation-not-supported-in-this-environment','auth/cancelled-popup-request'].includes(e.code)){ await A.signInWithRedirect(auth,provider); } else throw e; } },
      signOut(){return A.signOut(auth);},
      idToken(){return auth.currentUser?auth.currentUser.getIdToken():Promise.resolve('');},
      listenLogs(cb){unsub.logs=F.onSnapshot(F.query(col('logs'),F.orderBy('ts','desc')),snap=>cb(snap.docs.map(d=>d.data())));},
      listenFoods(cb){unsub.foods=F.onSnapshot(F.doc(db,'users',uid(),'meta','foods'),d=>cb((d.exists()&&d.data().items)||[]));},
      saveFoods(items){return F.setDoc(F.doc(db,'users',uid(),'meta','foods'),{items:JSON.parse(JSON.stringify(items))});},
      listenRecipes(cb){unsub.rec=F.onSnapshot(F.doc(db,'users',uid(),'meta','recipes'),d=>cb((d.exists()&&d.data().items)||[]));},
      listenSettings(cb){unsub.set=F.onSnapshot(F.doc(db,'users',uid(),'meta','settings'),d=>cb(d.exists()?d.data():null));},
      setLog(e){return F.setDoc(F.doc(db,'users',uid(),'logs',String(e.ts)),JSON.parse(JSON.stringify(e)));},
      delLog(ts){return F.deleteDoc(F.doc(db,'users',uid(),'logs',String(ts)));},
      saveRecipes(items){return F.setDoc(F.doc(db,'users',uid(),'meta','recipes'),{items:JSON.parse(JSON.stringify(items))});},
      saveSettings(st){return F.setDoc(F.doc(db,'users',uid(),'meta','settings'),JSON.parse(JSON.stringify(st)),{merge:true});},
    };
    A.getRedirectResult(auth).catch(()=>{});
    window.dispatchEvent(new Event('fb-ready'));
  }catch(e){ window.dispatchEvent(new CustomEvent('fb-error',{detail:e.message})); }
}
