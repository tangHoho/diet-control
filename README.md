# DailyControl（PWA）

一天兩餐飲控 App：計算 / 食材庫 / 飲控紀錄 / 幫助。

## 部署
1. 把這個資料夾的檔案全部放到 repo 根目錄（index.html 要在最外層）。
2. Settings → Pages → Deploy from a branch → main / root。
3. 手機 Chrome 開網址 → 選單「加到主畫面」或「安裝應用程式」。

## 只需設定一次
`config.js` 填 Apps Script 的 /exec 網址。之後更新 index.html 直接覆蓋，config.js 不會被動到。

## 更新
覆蓋 index.html 後，把 sw.js 的 VERSION 改一下（v6 → v7），手機重開 App 就會拿到新版。
