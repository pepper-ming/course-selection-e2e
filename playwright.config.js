import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// 載入測試環境變數
dotenv.config({ path: '.env.test' });

export default defineConfig({
  testDir: './tests',
  timeout: 90 * 1000, // 增加到 90 秒
  expect: {
    timeout: 20000 // 增加預期等待時間到 20 秒
  },
  fullyParallel: false, // 避免選課衝突
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 1, // CI 環境多重試
  workers: 1, // 強制單線程執行避免資料競爭
  
  // 測試報告 - 修正報告配置
  reporter: [
    ['html', { 
      outputFolder: 'playwright-report',
      open: 'never', // 避免自動開啟
      host: '127.0.0.1',
      port: 9323
    }],
    ['list', { printSteps: true }], // 顯示詳細步驟
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  
  // 全域設定
  globalSetup: './global-setup.js',
  globalTeardown: './global-teardown.js',
  
  use: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:5173',
    
    // 追蹤和除錯
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // 超時設定 - 增加超時時間
    actionTimeout: 30000, // 增加動作超時時間
    navigationTimeout: 45000, // 增加導航超時時間
    
    // 地區設定
    locale: 'zh-TW',
    timezoneId: 'Asia/Taipei',
    
    // 視窗設定
    viewport: { width: 1280, height: 720 },
    
    // 開發環境設定
    ignoreHTTPSErrors: true,
    
    // 額外的瀏覽器選項
    launchOptions: {
      slowMo: process.env.DEBUG === 'true' ? 1000 : 100, // 稍微放慢避免競爭條件
    },
    
    // HTTP 請求設定
    extraHTTPHeaders: {
      'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8'
    }
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
      teardown: 'cleanup'
    },
    {
      name: 'cleanup',
      testMatch: /.*\.cleanup\.js/
    },
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
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
          ]
        }
      },
      dependencies: ['setup']
    }
  ],

  // 自動啟動服務 - 移除自動啟動，改為手動檢查
  // webServer: [] // 註解掉自動啟動，避免衝突
});