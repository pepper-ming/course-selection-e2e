import { test, expect } from '@playwright/test';
import { testUsers, testCourses } from '../fixtures/test-data.js';
import { login } from '../fixtures/helpers.js';

test.describe('課程查詢功能測試', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.student1);
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');
  });

  test('應該顯示課程查詢頁面的所有元素', async ({ page }) => {
    // 檢查頁面標題
    await expect(page.locator('.page-header h1')).toHaveText('課程查詢');
    await expect(page.locator('.page-header p')).toContainText('瀏覽所有開設課程');
    
    // 檢查搜尋功能
    const searchBox = page.locator('.search-box input');
    await expect(searchBox).toBeVisible();
    await expect(searchBox).toHaveAttribute('placeholder', '搜尋課程名稱...');
    
    // 檢查篩選控制項
    const typeFilter = page.locator('select').first();
    const semesterFilter = page.locator('select').nth(1);
    const resetButton = page.locator('.reset-btn');
    
    await expect(typeFilter).toBeVisible();
    await expect(semesterFilter).toBeVisible();
    await expect(resetButton).toBeVisible();
    
    // 檢查統計資訊
    const statsSection = page.locator('.stats-section');
    await expect(statsSection).toBeVisible();
    await expect(statsSection).toContainText('共找到');
    
    // 檢查課程列表
    const courseCards = page.locator('.course-card');
    const count = await courseCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('搜尋功能應該即時過濾課程', async ({ page }) => {
    const searchBox = page.locator('.search-box input');
    
    // 搜尋 "資料"
    await searchBox.fill('資料');
    
    // 等待防抖和 API 回應
    await page.waitForTimeout(800);
    await page.waitForLoadState('networkidle');
    
    // 檢查搜尋結果
    const courseCards = page.locator('.course-card');
    const count = await courseCards.count();
    expect(count).toBeGreaterThan(0);
    
    // 驗證所有結果都包含搜尋關鍵字
    for (let i = 0; i < count; i++) {
      const card = courseCards.nth(i);
      const courseName = await card.locator('h3').textContent();
      expect(courseName.toLowerCase()).toContain('資料');
    }
    
    // 清空搜尋
    await searchBox.clear();
    await page.waitForTimeout(800);
    
    // 應該顯示所有課程
    const newCount = await courseCards.count();
    expect(newCount).toBeGreaterThan(count);
  });

  test('課程類型篩選應該正常運作', async ({ page }) => {
    const typeFilter = page.locator('select').first();
    
    // 篩選必修課程
    await typeFilter.selectOption('必修');
    await page.waitForLoadState('networkidle');
    
    // 檢查結果
    const requiredCourses = await page.locator('.course-card .value.required').count();
    const totalCourses = await page.locator('.course-card').count();
    expect(requiredCourses).toBe(totalCourses);
    
    // 篩選選修課程
    await typeFilter.selectOption('選修');
    await page.waitForLoadState('networkidle');
    
    // 檢查結果
    const electiveCourses = await page.locator('.course-card .value.elective').count();
    const totalElectives = await page.locator('.course-card').count();
    expect(electiveCourses).toBe(totalElectives);
  });

  test('學期篩選應該正常運作', async ({ page }) => {
    const semesterFilter = page.locator('select').nth(1);
    
    // 選擇特定學期
    await semesterFilter.selectOption('113上');
    await page.waitForLoadState('networkidle');
    
    // 檢查結果
    const courseCards = page.locator('.course-card');
    const count = await courseCards.count();
    
    if (count > 0) {
      // 檢查所有課程都是該學期的
      for (let i = 0; i < Math.min(count, 3); i++) {
        const card = courseCards.nth(i);
        const cardText = await card.textContent();
        expect(cardText).toContain('113上');
      }
    }
  });

  test('組合篩選應該正常運作', async ({ page }) => {
    const searchBox = page.locator('.search-box input');
    const typeFilter = page.locator('select').first();
    
    // 組合搜尋和篩選
    await searchBox.fill('學習');
    await typeFilter.selectOption('選修');
    
    // 等待結果
    await page.waitForTimeout(800);
    await page.waitForLoadState('networkidle');
    
    // 檢查結果
    const courseCards = page.locator('.course-card');
    const count = await courseCards.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const card = courseCards.nth(i);
        const courseName = await card.locator('h3').textContent();
        const courseType = await card.locator('.value.elective').textContent();
        
        expect(courseName.toLowerCase()).toContain('學習');
        expect(courseType).toBe('選修');
      }
    }
  });

  test('重置篩選應該清除所有條件', async ({ page }) => {
    const searchBox = page.locator('.search-box input');
    const typeFilter = page.locator('select').first();
    const resetButton = page.locator('.reset-btn');
    
    // 設定多個篩選條件
    await searchBox.fill('資料');
    await typeFilter.selectOption('必修');
    await page.waitForTimeout(800);
    
    // 記錄篩選後的課程數
    const filteredCount = await page.locator('.course-card').count();
    
    // 點擊重置
    await resetButton.click();
    await page.waitForLoadState('networkidle');
    
    // 檢查篩選條件已清除
    await expect(searchBox).toHaveValue('');
    await expect(typeFilter).toHaveValue('');
    
    // 檢查顯示所有課程
    const totalCount = await page.locator('.course-card').count();
    expect(totalCount).toBeGreaterThan(filteredCount);
  });

  test('課程卡片應該顯示完整資訊', async ({ page }) => {
    const firstCard = page.locator('.course-card').first();
    
    // 檢查必要元素
    await expect(firstCard.locator('h3')).toBeVisible(); // 課程名稱
    await expect(firstCard.locator('.course-code')).toBeVisible(); // 課程代碼
    await expect(firstCard.locator('.info-item:has-text("類型")')).toBeVisible();
    await expect(firstCard.locator('.info-item:has-text("學分")')).toBeVisible();
    await expect(firstCard.locator('.info-item:has-text("人數")')).toBeVisible();
    await expect(firstCard.locator('.timeslots')).toBeVisible(); // 上課時間
    
    // 檢查人數顯示格式
    const capacityText = await firstCard.locator('.info-item:has-text("人數") .value').textContent();
    expect(capacityText).toMatch(/\d+ \/ \d+ \(剩餘 \d+\)/);
  });

  test('課程描述應該在查詢頁面顯示', async ({ page }) => {
    const firstCard = page.locator('.course-card').first();
    
    // 檢查是否有描述區塊
    const description = firstCard.locator('.description');
    const hasDescription = await description.count() > 0;
    
    if (hasDescription) {
      await expect(description).toBeVisible();
      const descText = await description.textContent();
      expect(descText.length).toBeGreaterThan(0);
    }
  });

  test('課程人數警告應該正確顯示', async ({ page }) => {
    // 尋找剩餘名額少的課程
    const warningCard = await page.locator('.course-card').filter({
      has: page.locator('.value.warning')
    }).first();
    
    if (await warningCard.count() > 0) {
      const capacityInfo = warningCard.locator('.info-item:has-text("人數") .value');
      await expect(capacityInfo).toHaveClass(/warning/);
      
      const remainingText = await capacityInfo.textContent();
      const remaining = parseInt(remainingText.match(/剩餘 (\d+)/)[1]);
      expect(remaining).toBeLessThanOrEqual(5);
    }
    
    // 尋找額滿課程
    const fullCard = await page.locator('.course-card').filter({
      has: page.locator('.value.danger')
    }).first();
    
    if (await fullCard.count() > 0) {
      const capacityInfo = fullCard.locator('.info-item:has-text("人數") .value');
      await expect(capacityInfo).toHaveClass(/danger/);
      await expect(capacityInfo).toContainText('剩餘 0');
    }
  });

  test('無搜尋結果時應該顯示提示', async ({ page }) => {
    const searchBox = page.locator('.search-box input');
    
    // 搜尋不存在的課程
    await searchBox.fill('不存在的課程名稱XYZ123');
    await page.waitForTimeout(800);
    await page.waitForLoadState('networkidle');
    
    // 檢查空狀態提示
    const emptyState = page.locator('.empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('找不到符合條件的課程');
  });

  test('載入狀態應該正確顯示', async ({ page }) => {
    // 重新載入頁面並檢查載入狀態
    const loadingPromise = page.locator('.loading-state').waitFor({ 
      state: 'visible',
      timeout: 3000 
    }).catch(() => null);
    
    await page.reload();
    
    const loadingState = await loadingPromise;
    if (loadingState) {
      expect(await page.locator('.loading-state').textContent()).toBe('載入中...');
    }
  });

  test('響應式設計在不同視窗大小應該正常', async ({ page }) => {
    // 桌面視圖
    await page.setViewportSize({ width: 1280, height: 720 });
    const desktopGrid = await page.locator('.courses-grid').evaluate(el => 
      window.getComputedStyle(el).gridTemplateColumns
    );
    expect(desktopGrid).toContain('minmax');
    
    // 平板視圖
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    
    // 手機視圖
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    
    const mobileGrid = await page.locator('.courses-grid').evaluate(el => 
      window.getComputedStyle(el).gridTemplateColumns
    );
    expect(mobileGrid).toBe('1fr');
  });

  test('分頁功能應該正常運作（如果有實作）', async ({ page }) => {
    // 檢查是否有分頁元件
    const pagination = page.locator('.pagination');
    const hasPagination = await pagination.count() > 0;
    
    if (hasPagination) {
      // 測試分頁功能
      const nextButton = pagination.locator('button:has-text("下一頁")');
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForLoadState('networkidle');
        
        // 檢查 URL 或頁面內容有變化
        const currentPage = await pagination.locator('.current-page').textContent();
        expect(parseInt(currentPage)).toBeGreaterThan(1);
      }
    }
  });
});