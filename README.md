# PikaBoom

PikaBoom 是一個把孩子日常努力轉成冒險進度的網頁遊戲 MVP。這一版已經不只是展示稿，而是有前後台管理、孩子提交流程、家長審核流程，以及本機 SQLite 資料庫的可互動版本。

## 目前功能

- 孩子端首頁、今日任務、角色、地圖、圖鑑、成就頁
- 家長端首頁、任務管理、任務審核、報表頁
- SQLite 本機資料庫，自動建立初始孩子資料與預設任務
- 孩子可提交任務、領取獎勵
- 家長可新增任務、審核通過或退回
- 任務完成會推進等級、streak、星星幣與地圖進度

## 技術棧

- Next.js 16 App Router
- React 19
- Tailwind CSS
- better-sqlite3

## 本機開發

```bash
npm install
npm run dev
```

開發完成後可用下面指令驗證：

```bash
npm run build
```

## 資料儲存

- SQLite 資料庫位置：`data/pikaboom.db`
- 目前是單家庭模式，之後可再擴充 parent/child 真正登入與雲端同步

## 下一步建議

1. 接上正式登入與 parent/child 權限
2. 改成 Supabase / Postgres 雲端資料庫
3. 補任務照片證明、每週挑戰、成就事件系統
4. 增加正式的 UI 動畫與結算演出
