import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// 載入測試環境變數
dotenv.config({ path: '.env.test' });

export default defineConfig({
  testDir: './tests',
  timeout: 60 * 1000, // 增加到 60 秒
  expect: {
    timeout: 15000 // 增加預期等待時間到 15 秒
  },
  fullyParallel: false, // 避免選課衝突
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 2, // 增加重試次數
  workers: 1, // 強制單線程執行避免資料競爭
  
  // 測試報告
  reporter: [
    ['html', { 
      outputFolder: 'playwright-report',
      open: 'never' // CI 環境不自動開啟
    }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  
  use: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:5173',
    
    // 追蹤和除錯
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // 超時設定
    actionTimeout: 20000, // 增加動作超時時間
    navigationTimeout: 30000, // 增加導航超時時間
    
    // 地區設定
    locale: 'zh-TW',
    timezoneId: 'Asia/Taipei',
    
    // 視窗設定
    viewport: { width: 1280, height: 720 },
    
    // 開發環境設定
    ignoreHTTPSErrors: true,
    
    // 額外的瀏覽器選項
    launchOptions: {
      slowMo: process.env.DEBUG === 'true' ? 1000 : 0, // 除錯時放慢速度
    }
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Chrome 特定設定
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-dev-shm-usage',
            '--no-sandbox'
          ]
        }
      }
    },
    
    // 可選的其他瀏覽器（開發完成後啟用）
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    
    // 行動裝置測試
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // 自動啟動服務
  webServer: [
    {
      command: 'cd ../course_selection_project && python manage.py runserver 8000',
      url: 'http://localhost:8000/api/courses/',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: {
        DJANGO_SETTINGS_MODULE: 'course_selection_project.settings'
      }
    },
    {
      command: 'cd ../course-selection-frontend && npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000
    }
  ],

  // 全域設定
  globalSetup: './global-setup.js', // 可選：全域設定檔
  globalTeardown: './global-teardown.js', // 可選：全域清理檔
});