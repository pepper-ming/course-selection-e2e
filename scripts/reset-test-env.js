import { chromium } from '@playwright/test';

async function resetTestEnvironment() {
  console.log('🧹 重置測試環境...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 登入
    await page.goto('http://localhost:5173/login');
    await page.fill('input[id="username"]', 'student001');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/courses');
    console.log('✅ 登入成功');
    
    // 進入我的課表
    await page.goto('http://localhost:5173/my-courses');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 退選所有課程
    let courseCount = await page.locator('.course-card').count();
    console.log(`找到 ${courseCount} 門已選課程`);
    
    while (courseCount > 0) {
      const withdrawBtn = page.locator('button:has-text("退選")').first();
      if (await withdrawBtn.isVisible()) {
        // 處理確認對話框
        page.once('dialog', dialog => dialog.accept());
        await withdrawBtn.click();
        await page.waitForTimeout(2000);
        courseCount = await page.locator('.course-card').count();
        console.log(`✅ 退選成功，剩餘 ${courseCount} 門課程`);
      } else {
        break;
      }
    }
    
    console.log('\n✅ 測試環境重置完成！');
    
  } catch (error) {
    console.error('❌ 重置失敗:', error.message);
  } finally {
    await browser.close();
  }
}

resetTestEnvironment().catch(console.error);