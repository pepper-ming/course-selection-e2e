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
    await page.waitForTimeout(2000); // 等待頁面完全載入
    
    // 清理多餘的選課記錄（保留最低 2 門）
    let attempts = 0;
    const maxAttempts = 10; // 最多嘗試 10 次
    
    while (attempts < maxAttempts) {
      // 重新獲取退選按鈕
      const withdrawButtons = await page.locator('button:has-text("退選")').all();
      console.log(`找到 ${withdrawButtons.length} 個退選按鈕`);
      
      // 如果只剩 2 門或更少，停止清理
      if (withdrawButtons.length <= 2) {
        console.log('已達到最低選課要求，停止清理');
        break;
      }
      
      try {
        // 點擊第一個退選按鈕
        const firstButton = withdrawButtons[0];
        
        // 檢查按鈕是否仍然可見和可點擊
        const isVisible = await firstButton.isVisible({ timeout: 2000 }).catch(() => false);
        const isEnabled = await firstButton.isEnabled({ timeout: 2000 }).catch(() => false);
        
        if (!isVisible || !isEnabled) {
          console.log('退選按鈕不可用，跳過');
          attempts++;
          continue;
        }
        
        // 設定對話框處理
        page.once('dialog', dialog => {
          console.log(`處理確認對話框: ${dialog.message()}`);
          dialog.accept();
        });
        
        console.log(`嘗試退選第 ${attempts + 1} 門課程...`);
        await firstButton.click();
        
        // 等待頁面更新
        await page.waitForTimeout(2000);
        await page.waitForLoadState('networkidle');
        
        console.log(`成功退選第 ${attempts + 1} 門課程`);
        attempts++;
        
      } catch (error) {
        console.warn(`退選第 ${attempts + 1} 門課程失敗: ${error.message}`);
        attempts++;
        
        // 如果是超時錯誤，等待更長時間再重試
        if (error.message.includes('Timeout')) {
          await page.waitForTimeout(3000);
        }
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