import { test } from '@playwright/test';

test.describe('測試環境清理', () => {
  test('清理測試環境', async ({ page }) => {
    console.log('🧹 清理測試環境...');
    
    // 訪問首頁確保可以連線
    try {
      await page.goto('/');
      
      // 清理瀏覽器狀態
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // 如果有登入狀態，先登出
      try {
        const logoutButton = await page.locator('button:has-text("登出")');
        if (await logoutButton.isVisible()) {
          await logoutButton.click();
          await page.waitForURL('/login');
        }
      } catch (error) {
        // 忽略登出錯誤，可能本來就沒有登入
      }
      
    } catch (error) {
      console.log('清理過程中發生錯誤:', error.message);
    }
    
    console.log('✅ 測試環境清理完成');
  });
});