# 課程選課系統 E2E 自動化測試

## 專案簡介

本專案使用 Playwright 對課程選課系統進行端到端（E2E）自動化測試，涵蓋認證、課程查詢、選課作業、課表管理等核心功能。

## 測試架構

- **測試框架**: Playwright Test
- **測試模式**: Page Object Model (POM)
- **程式語言**: JavaScript
- **測試類型**: 功能測試、整合測試、UI 測試

## 環境需求

- Node.js 18+
- 課程選課系統後端運行在 `http://localhost:8000`
- 課程選課系統前端運行在 `http://localhost:5173`

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 安裝瀏覽器

```bash
npx playwright install
```

### 3. 設定環境變數

複製 `.env.test.example` 為 `.env.test` 並修改設定：

```bash
cp .env.test.example .env.test
```

### 4. 執行測試

```bash
# 執行所有測試
npm test

# 執行特定測試套件
npm run test:auth        # 認證測試
npm run test:course      # 課程查詢測試
npm run test:enrollment  # 選課作業測試
npm run test:mycourses   # 我的課表測試

# 有界面執行（可觀察測試過程）
npm run test:headed

# 除錯模式
npm run test:debug

# 開啟測試 UI
npm run test:ui
```

## 測試範圍

### 1. 認證功能測試 (`auth.spec.js`)
- ✅ 登入頁面元素顯示
- ✅ 學生帳號成功登入
- ✅ 錯誤密碼處理
- ✅ 空白欄位驗證
- ✅ 登出功能
- ✅ 登入狀態保持
- ✅ Session 管理

### 2. 課程查詢測試 (`course-query.spec.js`)
- ✅ 課程列表顯示
- ✅ 關鍵字搜尋
- ✅ 課程類型篩選
- ✅ 學期篩選
- ✅ 組合篩選
- ✅ 重置篩選
- ✅ 課程資訊顯示
- ✅ 響應式設計

### 3. 選課作業測試 (`enrollment.spec.js`)
- ✅ 成功選課
- ✅ 成功退選
- ✅ 重複選課防護
- ✅ 選課上限檢查
- ✅ 最低選課數檢查
- ✅ 時間衝突檢測
- ✅ 課程額滿處理
- ✅ 即時訊息提示

### 4. 我的課表測試 (`my-courses.spec.js`)
- ✅ 課表列表檢視
- ✅ 課表時間表檢視
- ✅ 視圖切換
- ✅ 從課表退選
- ✅ 學分統計
- ✅ 空課表提示
- ✅ 響應式設計

## 專案結構

```
course-selection-e2e/
├── tests/                    # 測試檔案
│   ├── auth.spec.js         # 認證測試
│   ├── course-query.spec.js # 課程查詢測試
│   ├── enrollment.spec.js   # 選課作業測試
│   └── my-courses.spec.js   # 我的課表測試
├── pages/                    # Page Object Model
│   ├── LoginPage.js         # 登入頁面物件
│   ├── CoursePage.js        # 課程頁面物件
│   ├── EnrollmentPage.js    # 選課頁面物件
│   └── MyCoursesPage.js     # 課表頁面物件
├── fixtures/                 # 測試資料與工具
│   ├── test-data.js         # 測試資料
│   └── helpers.js           # 輔助函數
├── playwright.config.js      # Playwright 設定
└── package.json             # 專案設定
```

## 測試資料

測試使用以下預設帳號：

- **學生帳號**: student001 / password123
- **教師帳號**: teacher001 / password123
- **管理員帳號**: admin / admin123

## 測試報告

測試完成後會自動生成報告：

```bash
# 查看 HTML 報告
npm run test:report

# 報告位置
playwright-report/index.html
```