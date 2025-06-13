import { test, expect } from '@playwright/test';
import { testUsers, testCourses } from '../fixtures/test-data.js';
import { login, enrollCourse, withdrawCourse } from '../fixtures/helpers.js';

test.describe('我的課表功能測試', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.student1);
    
    // 先選幾門課作為測試資料
    await page.goto('/enrollment');
    await page.waitForLoadState('networkidle');
    
    // 選兩門課
    await enrollCourse(page, testCourses.dataStructure.name);
    await page.waitForTimeout(500);
    await enrollCourse(page, testCourses.machineLearning.name);
    await page.waitForTimeout(500);
    
    // 進入我的課表頁面
    await page.goto('/my-courses');
    await page.waitForLoadState('networkidle');
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
    const countText = await courseCountStat.locator('.stat-value').textContent();
    expect(countText).toMatch(/\d+ \/ 8/);
    
    const creditStat = statsSection.locator('.stat-item:has-text("總學分數")');
    await expect(creditStat).toBeVisible();
    
    // 檢查視圖切換按鈕
    const listViewBtn = page.locator('.view-btn:has-text("列表檢視")');
    const calendarViewBtn = page.locator('.view-btn:has-text("時間表檢視")');
    await expect(listViewBtn).toBeVisible();
    await expect(calendarViewBtn).toBeVisible();
    
    // 預設應該是列表檢視
    await expect(listViewBtn).toHaveClass(/active/);
  });

  test('列表檢視應該顯示已選課程', async ({ page }) => {
    // 確認在列表檢視
    const listView = page.locator('.list-view');
    await expect(listView).toBeVisible();
    
    // 檢查課程卡片
    const courseCards = page.locator('.course-card');
    const count = await courseCards.count();
    expect(count).toBeGreaterThanOrEqual(2); // 我們選了兩門課
    
    // 檢查每個課程都有退選按鈕
    for (let i = 0; i < count; i++) {
      const card = courseCards.nth(i);
      const withdrawBtn = card.locator('button:has-text("退選")');
      await expect(withdrawBtn).toBeVisible();
    }
    
    // 檢查課程資訊
    const firstCard = courseCards.first();
    await expect(firstCard.locator('h3')).toBeVisible(); // 課程名稱
    await expect(firstCard.locator('.course-code')).toBeVisible(); // 課程代碼
    await expect(firstCard.locator('.timeslots')).toBeVisible(); // 上課時間
  });

  test('時間表檢視應該正確顯示課表', async ({ page }) => {
    // 切換到時間表檢視
    const calendarViewBtn = page.locator('.view-btn:has-text("時間表檢視")');
    await calendarViewBtn.click();
    
    // 檢查時間表容器
    const calendarView = page.locator('.calendar-view');
    await expect(calendarView).toBeVisible();
    
    const calendarTable = page.locator('.calendar-table');
    await expect(calendarTable).toBeVisible();
    
    // 檢查表頭（星期）
    const headers = calendarTable.locator('thead th');
    await expect(headers).toHaveCount(6); // 時間 + 週一到週五
    await expect(headers.nth(1)).toHaveText('星期一');
    await expect(headers.nth(5)).toHaveText('星期五');
    
    // 檢查時間列
    const timeRows = calendarTable.locator('tbody tr');
    const rowCount = await timeRows.count();
    expect(rowCount).toBe(13); // 8:00 到 20:00
    
    // 檢查課程區塊
    const courseBlocks = calendarTable.locator('.course-block');
    const blockCount = await courseBlocks.count();
    expect(blockCount).toBeGreaterThan(0);
    
    // 檢查課程區塊內容
    const firstBlock = courseBlocks.first();
    await expect(firstBlock.locator('.course-name')).toBeVisible();
    await expect(firstBlock.locator('.course-location')).toBeVisible();
  });

  test('從課表退選課程應該正常運作', async ({ page }) => {
    // 在列表檢視退選
    const firstCard = page.locator('.course-card').first();
    const courseName = await firstCard.locator('h3').textContent();
    const withdrawBtn = firstCard.locator('button:has-text("退選")');
    
    // 記錄初始課程數
    const initialCount = await page.locator('.course-card').count();
    
    // 點擊退選
    page.once('dialog', dialog => dialog.accept());
    await withdrawBtn.click();
    
    // 等待操作完成
    await page.waitForTimeout(1000);
    
    // 檢查成功訊息
    const messageAlert = page.locator('.message-alert.success');
    await expect(messageAlert).toBeVisible();
    await expect(messageAlert).toContainText('退選成功');
    
    // 檢查課程數減少
    const newCount = await page.locator('.course-card').count();
    expect(newCount).toBe(initialCount - 1);
    
    // 檢查統計資訊更新
    const courseCountStat = page.locator('.stat-item:has-text("已選課程數") .stat-value');
    const countText = await courseCountStat.textContent();
    expect(countText).toContain(`${newCount} / 8`);
  });

  test('低於最低選課數應該無法退選', async ({ page }) => {
    // 確保只有兩門課（最低要求）
    const courseCards = page.locator('.course-card');
    const currentCount = await courseCards.count();
    
    // 如果超過兩門，先退選到剩兩門
    if (currentCount > 2) {
      for (let i = currentCount; i > 2; i--) {
        const card = courseCards.nth(i - 1);
        const withdrawBtn = card.locator('button:has-text("退選")');
        page.once('dialog', dialog => dialog.accept());
        await withdrawBtn.click();
        await page.waitForTimeout(500);
      }
    }
    
    // 嘗試退選第二門（會低於最低要求）
    const secondCard = courseCards.nth(1);
    const withdrawBtn2 = secondCard.locator('button:has-text("退選")');
    page.once('dialog', dialog => dialog.accept());
    await withdrawBtn2.click();
    
    // 檢查錯誤訊息
    const messageAlert = page.locator('.message-alert.error');
    await expect(messageAlert).toBeVisible();
    await expect(messageAlert).toContainText('至少需選擇 2 門課程');
  });

  test('總學分計算應該正確', async ({ page }) => {
    // 檢查總學分統計
    const creditStat = page.locator('.stat-item:has-text("總學分數") .stat-value');
    const creditText = await creditStat.textContent();
    const totalCredits = parseInt(creditText);
    
    // 計算預期學分（每門課 3 學分）
    const courseCount = await page.locator('.course-card').count();
    const expectedCredits = courseCount * 3;
    
    expect(totalCredits).toBe(expectedCredits);
  });

  test('視圖切換應該保持資料一致', async ({ page }) => {
    // 記錄列表檢視的課程數
    const listCourseCount = await page.locator('.course-card').count();
    
    // 切換到時間表檢視
    await page.locator('.view-btn:has-text("時間表檢視")').click();
    await page.waitForTimeout(300);
    
    // 計算時間表中的課程數（每個課程可能有多個時段）
    const courseNames = new Set();
    const courseBlocks = await page.locator('.course-block .course-name').all();
    for (const block of courseBlocks) {
      const name = await block.textContent();
      courseNames.add(name);
    }
    
    // 課程數應該一致
    expect(courseNames.size).toBe(listCourseCount);
    
    // 切換回列表檢視
    await page.locator('.view-btn:has-text("列表檢視")').click();
    await page.waitForTimeout(300);
    
    // 確認課程數仍然一致
    const newListCount = await page.locator('.course-card').count();
    expect(newListCount).toBe(listCourseCount);
  });

  test('響應式設計在不同裝置應該正常顯示', async ({ page }) => {
    // 桌面檢視
    await page.setViewportSize({ width: 1280, height: 720 });
    const desktopGrid = await page.locator('.courses-list').evaluate(el => 
      window.getComputedStyle(el).gridTemplateColumns
    );
    expect(desktopGrid).toContain('minmax');
    
    // 平板檢視
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    
    // 手機檢視
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    
    // 在手機檢視，課程應該堆疊顯示
    const mobileGrid = await page.locator('.courses-list').evaluate(el => 
      window.getComputedStyle(el).gridTemplateColumns
    );
    expect(mobileGrid).toBe('1fr');
    
    // 時間表在手機上應該可以橫向滾動
    await page.locator('.view-btn:has-text("時間表檢視")').click();
    const calendarContainer = page.locator('.calendar-container');
    const canScroll = await calendarContainer.evaluate(el => 
      el.scrollWidth > el.clientWidth
    );
    expect(canScroll).toBe(true);
  });

  test('重新載入頁面應該保持狀態', async ({ page }) => {
    // 記錄當前狀態
    const courseCount = await page.locator('.course-card').count();
    const firstCourseName = await page.locator('.course-card').first().locator('h3').textContent();
    
    // 重新載入
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 檢查狀態保持
    const newCourseCount = await page.locator('.course-card').count();
    const newFirstCourseName = await page.locator('.course-card').first().locator('h3').textContent();
    
    expect(newCourseCount).toBe(courseCount);
    expect(newFirstCourseName).toBe(firstCourseName);
  });
});