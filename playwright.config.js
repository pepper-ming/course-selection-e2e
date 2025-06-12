import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// 載入測試環境變數
dotenv.config({ path: '.env.test' });

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  fullyParallel: false, // 避免選課衝突，循序執行
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
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
    actionTimeout: 10000,
    locale: 'zh-TW',
    
    // 測試環境的預設視窗大小
    viewport: { width: 1280, height: 720 },
    
    // 忽略 HTTPS 錯誤（開發環境）
    ignoreHTTPSErrors: true,
    
    // 測試帳號資訊（可從環境變數讀取）
    testUser: {
      username: process.env.TEST_USER || 'student001',
      password: process.env.TEST_PASSWORD || 'password123'
    }
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    }
  ],

  webServer: [
    {
      command: 'cd ../course_selection_project && python manage.py runserver',
      port: 8000,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'cd ../course-selection-frontend && npm run dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    }
  ],
});