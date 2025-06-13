import { test } from '@playwright/test';

test.describe('測試環境設定', () => {
  test('初始化測試環境', async ({ page }) => {
    console.log('🚀 初始化測試環境...');
    
    // 檢查前端服務
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 清理任何現有的登入狀態
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('✅ 測試環境初始化完成');
  });
});