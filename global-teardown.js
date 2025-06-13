// global-teardown.js
import { chromium } from '@playwright/test';
import { testUsers } from './fixtures/test-data.js';

async function globalTeardown() {
  console.log('🧹 開始全域清理...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // 清理測試使用者的選課資料
    console.log('🗑️ 清理測試資料...');
    
    // 登入測試帳號
    await page.goto('http://localhost:5173/login');
    await page.fill('input[id="username"]', testUsers.student1.username);
    await page.fill('input[id="password"]', testUsers.student1.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5173/courses', { timeout: 10000 });
    
    // 進入課表頁面
    await page.goto('http://localhost:5173/my-courses');
    await page.waitForLoadState('networkidle');
    
    // 清理多餘的選課記錄（保留最低 2 門）
    const withdrawButtons = await page.locator('button:has-text("退選")').all();
    const buttonsToClick = withdrawButtons.length > 2 ? withdrawButtons.slice(0, -2) : [];
    
    for (let i = 0; i < buttonsToClick.length; i++) {
      try {
        page.once('dialog', dialog => dialog.accept());
        await buttonsToClick[i].click();
        await page.waitForTimeout(1000);
      } catch (error) {
        console.warn(`清理第 ${i + 1} 筆選課記錄失敗:`, error.message);
      }
    }
    
    console.log('✅ 測試資料清理完成');
    
    // 生成測試摘要
    await generateTestSummary();
    
  } catch (error) {
    console.error('❌ 全域清理失敗:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log('🎉 全域清理完成');
}

async function generateTestSummary() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // 讀取測試結果
    const resultsPath = 'test-results/results.json';
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      
      const summary = {
        總測試數: results.suites?.reduce((total, suite) => total + (suite.specs?.length || 0), 0) || 0,
        通過數: results.suites?.reduce((total, suite) => 
          total + (suite.specs?.filter(spec => spec.tests?.[0]?.results?.[0]?.status === 'passed').length || 0), 0) || 0,
        失敗數: results.suites?.reduce((total, suite) => 
          total + (suite.specs?.filter(spec => spec.tests?.[0]?.results?.[0]?.status === 'failed').length || 0), 0) || 0,
        執行時間: results.stats?.duration || 0,
        生成時間: new Date().toLocaleString('zh-TW')
      };
      
      // 寫入摘要檔案
      fs.writeFileSync('test-results/summary.json', JSON.stringify(summary, null, 2), 'utf8');
      
      console.log('📊 測試摘要:');
      console.log(`   總測試數: ${summary.總測試數}`);
      console.log(`   通過數: ${summary.通過數}`);
      console.log(`   失敗數: ${summary.失敗數}`);
      console.log(`   執行時間: ${Math.round(summary.執行時間 / 1000)}秒`);
    }
  } catch (error) {
    console.warn('⚠️ 無法生成測試摘要:', error.message);
  }
}

export default globalTeardown;