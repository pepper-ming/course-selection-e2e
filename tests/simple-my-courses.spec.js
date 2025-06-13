import { test, expect } from '@playwright/test';

test.describe('簡化版我的課表測試', () => {
  test('基本流程測試', async ({ page }) => {
    // 1. 直接訪問登入頁面
    await page.goto('http://localhost:5173/login');
    
    // 2. 等待頁面完全載入
    await page.waitForTimeout(3000);
    
    // 3. 填寫登入資訊
    await page.fill('input[id="username"]', 'student001');
    await page.fill('input[id="password"]', 'password123');
    
    // 4. 提交登入
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);
    
    // 5. 等待登入完成
    await page.waitForTimeout(3000);
    
    // 6. 直接訪問選課頁面
    await page.goto('http://localhost:5173/enrollment');
    await page.waitForTimeout(3000);
    
    // 7. 嘗試選第一門課
    const enrollButtons = await page.locator('button:has-text("選課")').all();
    if (enrollButtons.length > 0) {
      await enrollButtons[0].click();
      await page.waitForTimeout(2000);
    }
    
    // 8. 直接訪問我的課表
    await page.goto('http://localhost:5173/my-courses');
    await page.waitForTimeout(3000);
    
    // 9. 截圖最終結果
    await page.screenshot({ path: 'my-courses-final.png', fullPage: true });
    
    // 10. 基本斷言 - 只檢查頁面是否載入
    const pageTitle = await page.title();
    console.log('頁面標題:', pageTitle);
    
    const url = page.url();
    expect(url).toContain('my-courses');
  });
});