import { test, expect } from '@playwright/test';
import { testUsers } from '../fixtures/test-data.js';
import { login } from '../fixtures/helpers.js';

test.describe('我的課表功能測試', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.student1);
    
    // 直接進入我的課表頁面
    await page.goto('/my-courses');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 檢查當前課程數
    const currentCourses = await page.locator('.course-card').count();
    console.log(`目前已選 ${currentCourses} 門課程`);
    
    // 如果課程不足，去選課
    if (currentCourses < 2) {
      await page.goto('/enrollment');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // 選課直到有至少2門
      let needToSelect = 2 - currentCourses;
      const enrollButtons = await page.locator('button:has-text("選課")').all();
      
      for (let i = 0; i < Math.min(needToSelect, enrollButtons.length); i++) {
        try {
          await enrollButtons[i].click();
          await page.waitForTimeout(2000);
          console.log(`選課 ${i + 1}/${needToSelect}`);
        } catch (error) {
          console.log('選課按鈕點擊失敗，繼續下一個');
        }
      }
      
      // 返回我的課表
      await page.goto('/my-courses');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
  });

  test('應該顯示我的課表頁面的所有元素', async ({ page }) => {
    // 檢查頁面標題
    await expect(page.locator('.page-header h1')).toHaveText('我的課表');
    await expect(page.locator('.page-header p')).toContainText('查看您已選修的所有課程');
    
    // 檢查統計資訊
    const statsSection = page.locator('.stats-section');
    await expect(statsSection).toBeVisible();
    
    const courseCountStat = statsSection.locator('.stat-item:has-text("已選課程數")');
    await expect(courseCountStat).toBeVisible();
    
    const creditStat = statsSection.locator('.stat-item:has-text("總學分數")');
    await expect(creditStat).toBeVisible();
    
    // 檢查視圖切換按鈕
    await expect(page.locator('.view-btn:has-text("列表檢視")')).toBeVisible();
    await expect(page.locator('.view-btn:has-text("時間表檢視")')).toBeVisible();
  });

  test('列表檢視應該顯示已選課程', async ({ page }) => {
    // 確認在列表檢視
    const listView = page.locator('.list-view');
    await expect(listView).toBeVisible();
    
    // 檢查課程卡片
    const courseCards = page.locator('.course-card');
    const count = await courseCards.count();
    expect(count).toBeGreaterThanOrEqual(1); // 至少要有一門課
    
    // 檢查第一個課程有退選按鈕
    const firstCard = courseCards.first();
    const withdrawBtn = firstCard.locator('button:has-text("退選")');
    await expect(withdrawBtn).toBeVisible();
  });

  test('時間表檢視應該正確顯示課表', async ({ page }) => {
    // 切換到時間表檢視
    const calendarViewBtn = page.locator('.view-btn:has-text("時間表檢視")');
    await calendarViewBtn.click();
    await page.waitForTimeout(1000);
    
    // 檢查時間表容器
    const calendarView = page.locator('.calendar-view');
    await expect(calendarView).toBeVisible();
    
    // 檢查是否有時間表格
    const hasTable = await page.locator('.calendar-table, table').isVisible().catch(() => false);
    expect(hasTable).toBeTruthy();
  });

  test('從課表退選課程應該正常運作', async ({ page }) => {
    // 確保至少有兩門課（避免低於最低要求）
    const initialCount = await page.locator('.course-card').count();
    if (initialCount < 3) {
      test.skip();
      return;
    }
    
    // 退選第一門課
    const firstCard = page.locator('.course-card').first();
    const withdrawBtn = firstCard.locator('button:has-text("退選")');
    
    // 處理確認對話框
    page.once('dialog', dialog => dialog.accept());
    await withdrawBtn.click();
    
    // 等待操作完成
    await page.waitForTimeout(2000);
    
    // 檢查課程數減少
    const newCount = await page.locator('.course-card').count();
    expect(newCount).toBe(initialCount - 1);
  });

  test('低於最低選課數應該無法退選', async ({ page }) => {
    // 先退選到只剩2門課
    let currentCount = await page.locator('.course-card').count();
    
    while (currentCount > 2) {
      const withdrawBtn = page.locator('button:has-text("退選")').first();
      page.once('dialog', dialog => dialog.accept());
      await withdrawBtn.click();
      await page.waitForTimeout(2000);
      currentCount = await page.locator('.course-card').count();
    }
    
    // 現在應該正好有2門課，嘗試再退選
    const withdrawBtn = page.locator('button:has-text("退選")').first();
    page.once('dialog', dialog => dialog.accept());
    await withdrawBtn.click();
    
    // 檢查錯誤訊息
    await page.waitForTimeout(1000);
    const errorVisible = await page.locator('text=/至少.*2.*門/').isVisible().catch(() => false);
    expect(errorVisible).toBeTruthy();
  });

  test('總學分計算應該正確', async ({ page }) => {
    // 獲取學分數
    const creditText = await page.locator('.stat-item:has-text("總學分數") .stat-value').textContent();
    const totalCredits = parseInt(creditText);
    
    // 獲取課程數
    const courseCount = await page.locator('.course-card').count();
    
    // 假設每門課3學分
    const expectedCredits = courseCount * 3;
    expect(totalCredits).toBe(expectedCredits);
  });

  test('視圖切換應該保持資料一致', async ({ page }) => {
    // 記錄列表檢視的課程數
    const listCourseCount = await page.locator('.course-card').count();
    
    // 切換到時間表檢視
    await page.locator('.view-btn:has-text("時間表檢視")').click();
    await page.waitForTimeout(1000);
    
    // 切換回列表檢視
    await page.locator('.view-btn:has-text("列表檢視")').click();
    await page.waitForTimeout(1000);
    
    // 確認課程數一致
    const newListCount = await page.locator('.course-card').count();
    expect(newListCount).toBe(listCourseCount);
  });

  test('響應式設計在不同裝置應該正常顯示', async ({ page }) => {
    // 測試手機視圖
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    await expect(page.locator('.page-header h1')).toBeVisible();
    await expect(page.locator('.view-btn').first()).toBeVisible();
    
    // 恢復桌面視圖
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('重新載入頁面應該保持狀態', async ({ page }) => {
    // 記錄當前課程數
    const initialCount = await page.locator('.course-card').count();
    
    // 重新載入頁面
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 檢查課程數是否一致
    const reloadedCount = await page.locator('.course-card').count();
    expect(reloadedCount).toBe(initialCount);
  });
});