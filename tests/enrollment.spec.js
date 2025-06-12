import { test, expect } from '@playwright/test';
import { EnrollmentPage } from '../pages/EnrollmentPage.js';
import { testUsers, testCourses, enrollmentRules } from '../fixtures/test-data.js';
import { login, checkMessage, cleanupEnrollments } from '../fixtures/helpers.js';

test.describe('選課作業功能測試', () => {
  let enrollmentPage;

  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.student1);
    enrollmentPage = new EnrollmentPage(page);
    await enrollmentPage.goto();
  });

  test.afterEach(async ({ page }) => {
    // 清理測試資料
    await cleanupEnrollments(page);
  });

  test('應該顯示選課頁面的所有元素', async ({ page }) => {
    // 檢查頁面標題
    await expect(enrollmentPage.pageHeader).toHaveText('選課作業');
    
    // 檢查選課規則
    await expect(enrollmentPage.rulesSection).toBeVisible();
    await expect(enrollmentPage.rulesSection).toContainText('最少選修 2 門課程');
    await expect(enrollmentPage.rulesSection).toContainText('最多選修 8 門課程');
    
    // 檢查搜尋和篩選功能
    await expect(enrollmentPage.searchInput).toBeVisible();
    await expect(enrollmentPage.typeFilter).toBeVisible();
    await expect(enrollmentPage.showEnrolledCheckbox).toBeVisible();
    
    // 檢查課程狀態變更為已選
    const isEnrolled = await enrollmentPage.isCourseEnrolled(testCourses.dataStructure.name);
    expect(isEnrolled).toBe(true);
    
    // 檢查已選課程數增加
    const enrolledCount = await enrollmentPage.getEnrolledCount();
    expect(enrolledCount).toBeGreaterThanOrEqual(1);
  });

  test('應該能成功退選課程', async ({ page }) => {
    // 先選兩門課（確保符合最低要求）
    await enrollmentPage.enrollCourse(testCourses.dataStructure.name);
    await page.waitForTimeout(500);
    await enrollmentPage.enrollCourse(testCourses.algorithm.name);
    await page.waitForTimeout(500);
    
    // 退選第一門課
    await enrollmentPage.withdrawCourse(testCourses.dataStructure.name);
    
    // 處理確認對話框
    page.once('dialog', dialog => dialog.accept());
    
    // 檢查成功訊息
    await enrollmentPage.waitForMessage('success');
    const message = await enrollmentPage.getMessageText();
    expect(message).toContain('退選成功');
    
    // 檢查課程狀態變更
    const isEnrolled = await enrollmentPage.isCourseEnrolled(testCourses.dataStructure.name);
    expect(isEnrolled).toBe(false);
  });

  test('重複選課應該顯示錯誤', async ({ page }) => {
    // 第一次選課
    await enrollmentPage.enrollCourse(testCourses.machineLearning.name);
    await page.waitForTimeout(1000);
    
    // 嘗試重複選課
    await enrollmentPage.enrollCourse(testCourses.machineLearning.name);
    
    // 檢查錯誤訊息
    await enrollmentPage.waitForMessage('error');
    const message = await enrollmentPage.getMessageText();
    expect(message).toContain(enrollmentRules.messages.alreadyEnrolled);
  });

  test('超過選課上限應該顯示錯誤', async ({ page }) => {
    // 模擬已選滿 8 門課的情況
    // 注意：這需要測試資料中有足夠的課程
    const coursesToEnroll = [
      '資料結構', '演算法', '機器學習導論', '網頁程式設計',
      '資料庫系統', '人工智慧', '統計學', '深度學習'
    ];
    
    // 依序選課
    for (const courseName of coursesToEnroll) {
      const card = await enrollmentPage.getCourseCard(courseName);
      if (await card.count() > 0) {
        await enrollmentPage.enrollCourse(courseName);
        await page.waitForTimeout(800);
      }
    }
    
    // 嘗試選第 9 門課
    await enrollmentPage.enrollCourse('線性代數');
    
    // 檢查錯誤訊息
    await enrollmentPage.waitForMessage('error');
    const message = await enrollmentPage.getMessageText();
    expect(message).toContain(enrollmentRules.messages.maxCoursesReached);
  });

  test('低於最低選課數應該無法退選', async ({ page }) => {
    // 選兩門課（最低要求）
    await enrollmentPage.enrollCourse(testCourses.dataStructure.name);
    await page.waitForTimeout(500);
    await enrollmentPage.enrollCourse(testCourses.algorithm.name);
    await page.waitForTimeout(500);
    
    // 退選第一門
    await enrollmentPage.withdrawCourse(testCourses.dataStructure.name);
    page.once('dialog', dialog => dialog.accept());
    await page.waitForTimeout(500);
    
    // 嘗試退選第二門（會低於最低要求）
    await enrollmentPage.withdrawCourse(testCourses.algorithm.name);
    
    // 檢查錯誤訊息
    await enrollmentPage.waitForMessage('error');
    const message = await enrollmentPage.getMessageText();
    expect(message).toContain(enrollmentRules.messages.minCoursesRequired);
  });

  test('搜尋功能應該正常運作', async ({ page }) => {
    // 搜尋 "資料"
    await enrollmentPage.searchCourse('資料');
    
    // 等待搜尋結果
    await page.waitForTimeout(800);
    
    // 檢查結果
    const courseCount = await enrollmentPage.getCourseCount();
    expect(courseCount).toBeGreaterThan(0);
    
    // 檢查所有結果都包含 "資料"
    const courseCards = await enrollmentPage.courseCards.all();
    for (const card of courseCards) {
      const text = await card.textContent();
      expect(text).toContain('資料');
    }
  });

  test('課程類型篩選應該正常運作', async ({ page }) => {
    // 篩選必修課程
    await enrollmentPage.filterByType('必修');
    await page.waitForTimeout(500);
    
    // 檢查結果
    const courseCards = await enrollmentPage.courseCards.all();
    for (const card of courseCards) {
      const text = await card.textContent();
      expect(text).toContain('必修');
    }
    
    // 篩選選修課程
    await enrollmentPage.filterByType('選修');
    await page.waitForTimeout(500);
    
    // 檢查結果
    const courseCards2 = await enrollmentPage.courseCards.all();
    for (const card of courseCards2) {
      const text = await card.textContent();
      expect(text).toContain('選修');
    }
  });

  test('只顯示已選課程功能應該正常運作', async ({ page }) => {
    // 先選幾門課
    await enrollmentPage.enrollCourse(testCourses.dataStructure.name);
    await page.waitForTimeout(500);
    await enrollmentPage.enrollCourse(testCourses.machineLearning.name);
    await page.waitForTimeout(500);
    
    // 勾選只顯示已選課程
    await enrollmentPage.toggleShowEnrolled();
    await page.waitForTimeout(500);
    
    // 檢查顯示的課程都是已選的
    const courseCards = await enrollmentPage.courseCards.all();
    for (const card of courseCards) {
      const withdrawBtn = card.locator('button:has-text("退選")');
      await expect(withdrawBtn).toBeVisible();
    }
  });

  test('時間衝突檢測應該正常運作', async ({ page }) => {
    // 選擇一門課程
    await enrollmentPage.enrollCourse('資料結構');
    await page.waitForTimeout(500);
    
    // 嘗試選擇時間衝突的課程
    // 注意：這需要知道哪些課程時間衝突
    const conflictingCourse = await page.locator('.course-card').filter({ 
      hasText: '週一' 
    }).filter({ 
      hasText: '09:00' 
    }).nth(1);
    
    if (await conflictingCourse.count() > 0) {
      const courseName = await conflictingCourse.locator('h3').textContent();
      await enrollmentPage.enrollCourse(courseName);
      
      // 檢查錯誤訊息
      await enrollmentPage.waitForMessage('error');
      const message = await enrollmentPage.getMessageText();
      expect(message).toContain(enrollmentRules.messages.timeConflict);
    }
  });

  test('重新整理功能應該正常運作', async ({ page }) => {
    // 取得初始課程數
    const initialCount = await enrollmentPage.getCourseCount();
    
    // 點擊重新整理
    await enrollmentPage.refresh();
    
    // 檢查課程重新載入
    const newCount = await enrollmentPage.getCourseCount();
    expect(newCount).toBe(initialCount);
    
    // 檢查載入狀態有顯示
    const loadingWasVisible = await enrollmentPage.loadingState.isVisible({ timeout: 1000 }).catch(() => false);
    expect(loadingWasVisible).toBe(true);
  });

  test('課程額滿應該無法選課', async ({ page }) => {
    // 尋找額滿的課程
    const fullCourseCard = await page.locator('.course-card').filter({ 
      hasText: '剩餘 0' 
    }).first();
    
    if (await fullCourseCard.count() > 0) {
      const courseName = await fullCourseCard.locator('h3').textContent();
      
      // 檢查是否顯示額滿訊息
      const fullMessage = fullCourseCard.locator('.full-message');
      await expect(fullMessage).toBeVisible();
      await expect(fullMessage).toHaveText('課程已額滿');
      
      // 確認沒有選課按鈕
      const enrollBtn = fullCourseCard.locator('button:has-text("選課")');
      await expect(enrollBtn).not.toBeVisible();
    }
  });
});卡片
    const courseCount = await enrollmentPage.getCourseCount();
    expect(courseCount).toBeGreaterThan(0);
  });

  test('應該能成功選課', async ({ page }) => {
    // 選擇資料結構課程
    await enrollmentPage.enrollCourse(testCourses.dataStructure.name);
    
    // 等待處理對話框
    page.once('dialog', dialog => dialog.accept());
    
    // 檢查成功訊息
    await enrollmentPage.waitForMessage('success');
    const message = await enrollmentPage.getMessageText();
    expect(message).toContain('選課成功');
    
    // 檢查課程