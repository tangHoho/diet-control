// 只需要設定一次。之後更新 index.html 不會動到這個檔案。
window.APP_CONFIG = {
  // Firebase 專案設定：Firebase 控制台 → 專案設定 → 一般 → 你的應用程式 → SDK 設定 → 「設定」
  firebase: {
    apiKey: "AIzaSyBQVuqLRIW_BPqYzSBBvcTZc35yICLn3Rc",
    authDomain: "dailycontrol-148c5.firebaseapp.com",
    projectId: "dailycontrol-148c5",
    appId: "1:740168186141:web:15d65089d6d8add5c949f4"
  },
  // Apps Script 網址（結尾 /exec）：只負責 AI 估算，需要登入才會呼叫
  estimateUrl: "https://script.google.com/macros/s/AKfycbwxZp6cpql4UX9mcF0IyE4En__PLCrXY8U5mUoBpP-AAVHdgK3xT392ztV0063i_dFq/exec",
  // 舊的試算表 Apps Script 網址：登入後可一次性把舊紀錄匯入帳號（沒有可留空）
  legacySheetUrl: "https://script.google.com/macros/s/AKfycbwxZp6cpql4UX9mcF0IyE4En__PLCrXY8U5mUoBpP-AAVHdgK3xT392ztV0063i_dFq/exec"
};
