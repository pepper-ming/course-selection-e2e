// global-setup.js
import { chromium } from '@playwright/test';
import { testUsers } from './fixtures/test-data.js';

async function globalSetup() {
  console.log('🚀 開始全域測試設定...');
  
  // 建立瀏覽器實例進行預備檢查
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // 檢查後端服務是否可用
    console.log('📡 檢查後端服務...');
    const backendResponse = await page.goto('http://localhost:8000/api/courses/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    if (!backendResponse.ok()) {
      throw new Error(`後端服務不可用: ${backendResponse.status()}`);
    }
    console.log('✅ 後端服務正常');
    
    // 檢查前端服務是否可用
    console.log('🌐 檢查前端服務...');
    const frontendResponse = await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    if (!frontendResponse.ok()) {
      throw new Error(`前端服務不可用: ${frontendResponse.status()}`);
    }
    console.log('✅ 前端服務正常');
    
    // 驗證測試帳號是否可用
    console.log('👤 驗證測試帳號...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[id="username"]', testUsers.student1.username);
    await page.fill('input[id="password"]', testUsers.student1.password);
    await page.click('button[type="submit"]');
    
    // 等待登入成功
    await page.waitForURL('http://localhost:5173/courses', { timeout: 10000 });
    console.log('✅ 測試帳號驗證成功');
    
    // 建立測試資料夾
    const fs = await import('fs');
    const path = await import('path');
    
    const dirs = ['screenshots', 'test-results', 'playwright-report'];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 建立目錄: ${dir}`);
      }
    }
    
    console.log('✅ 全域設定完成');
    
  } catch (error) {
    console.error('❌ 全域設定失敗:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;