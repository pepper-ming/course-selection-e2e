import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// 載入測試環境變數
dotenv.config({ path: '.env.test' });

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 10000 // 增加預期等待時間
  },
  fullyParallel: false, // 避免選課衝突，循序執行
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // 本地環境也允許重試
  workers: 1, // 強制單線程執行
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  
  use: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000, // 增加動作超時時間
    locale: 'zh-TW',
    
    // 測試環境的預設視窗大小
    viewport: { width: 1280, height: 720 },
    
    // 忽略 HTTPS 錯誤（開發環境）
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
    // 暫時只用 Chrome 進行測試，避免並發問題
  ],

  webServer: [
    {
      command: 'python manage.py runserver 8000',
      url: 'http://localhost:8000/api/courses/',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      cwd: process.env.BACKEND_PATH || '../course_selection_project',
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      cwd: process.env.FRONTEND_PATH || '../course-selection-frontend',
    }
  ],
});