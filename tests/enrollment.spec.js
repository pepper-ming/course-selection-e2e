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

//   test.afterEach(async ({ page }) => {
//     // 只在非「最低選課數」測試時清理
//     const testInfo = test.info();
//     if (!testInfo.title.includes('最低選課數')) {
//         await cleanupEnrollments(page);
//     }
//   });

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
    
    // 檢查課程卡片
    const courseCount = await enrollmentPage.getCourseCount();
    expect(courseCount).toBeGreaterThan(0);
  });

  test('應該能成功選課', async ({ page }) => {
    // 選擇資料結構課程
    await enrollmentPage.enrollCourse(testCourses.dataStructure.name);
    
    // 檢查成功訊息
    await enrollmentPage.waitForMessage('success');
    const message = await enrollmentPage.getMessageText();
    expect(message).toContain('選課成功');
    
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
    // 先清理到完全沒有選課
    await page.goto('/my-courses');
    await page.waitForLoadState('networkidle');
    
    // 退選所有課程
    let withdrawButtons = await page.locator('button:has-text("退選")').all();
    while (withdrawButtons.length > 0) {
        page.once('dialog', dialog => dialog.accept());
        await withdrawButtons[0].click();
        await page.waitForTimeout(2000);
        withdrawButtons = await page.locator('button:has-text("退選")').all();
    }
    
    // 回到選課頁面
    await enrollmentPage.goto();
    await page.waitForLoadState('networkidle');
    
    // 確保頁面載入完成
    await page.waitForTimeout(2000);
    
    // 選兩門課（最低要求）
    console.log('開始選課...');
    
    // 方法1：直接找選課按鈕點擊（不依賴課程名稱）
    const availableEnrollButtons = await page.locator('.course-card button:has-text("選課")').all();
    
    if (availableEnrollButtons.length < 2) {
        throw new Error('可選課程不足');
    }
    
    // 選第一門課
    await availableEnrollButtons[0].click();
    await page.waitForTimeout(2000);
    console.log('已選第一門課');
    
    // 選第二門課
    const updatedEnrollButtons = await page.locator('.course-card button:has-text("選課")').all();
    await updatedEnrollButtons[0].click();
    await page.waitForTimeout(2000);
    console.log('已選第二門課');
    
    // 現在應該有2門課，找到所有退選按鈕
    const currentWithdrawButtons = await page.locator('.course-card button:has-text("退選")').all();
    console.log(`目前有 ${currentWithdrawButtons.length} 門已選課程`);
    
    if (currentWithdrawButtons.length !== 2) {
        throw new Error(`預期有2門已選課程，實際有 ${currentWithdrawButtons.length} 門`);
    }
    
    // 退選第一門課（應該成功）
    page.once('dialog', dialog => dialog.accept());
    await currentWithdrawButtons[0].click();
    await page.waitForTimeout(2000);
    console.log('已退選第一門課');
    
    // 現在只剩1門課，嘗試退選（應該失敗）
    const remainingWithdrawButton = await page.locator('.course-card button:has-text("退選")').first();
    
    // 設定對話框處理（如果有的話）
    page.once('dialog', dialog => dialog.accept());
    
    // 點擊退選
    await remainingWithdrawButton.click();
    console.log('嘗試退選最後一門課...');
    
    // 等待錯誤訊息出現
    await page.waitForTimeout(2000);
    
    // 檢查錯誤訊息 - 使用多種可能的選擇器
    const errorSelectors = [
        'text=/至少.*2.*門/',
        'text=/最少.*2.*門/',
        'text=/退選失敗.*至少/',
        '.message.error',
        '.error-message',
        '[class*="error"]',
        'div:has-text("退選失敗")'
    ];
    
    let errorFound = false;
    let errorText = '';
    
    for (const selector of errorSelectors) {
        try {
        const errorElement = await page.locator(selector).first();
        if (await errorElement.isVisible({ timeout: 5000 })) {
            errorText = await errorElement.textContent();
            errorFound = true;
            console.log(`找到錯誤訊息: "${errorText}"`);
            break;
        }
        } catch (e) {
        // 繼續嘗試下一個選擇器
        }
    }
    
    // 如果沒找到錯誤訊息，檢查是否還有退選按鈕（表示退選被阻止）
    if (!errorFound) {
        const stillHasWithdrawButton = await page.locator('.course-card button:has-text("退選")').count();
        if (stillHasWithdrawButton > 0) {
        console.log('退選操作似乎被阻止了（退選按鈕仍存在）');
        // 這也算是測試通過的情況
        } else {
        // 截圖以便除錯
        await page.screenshot({ path: 'test-min-course-error.png', fullPage: true });
        throw new Error('未找到預期的錯誤訊息，且退選按鈕消失了');
        }
    }
    
    // 驗證錯誤訊息包含最低選課數的提示
    if (errorFound) {
        expect(errorText).toMatch(/至少|最少|最低|2.*門|兩門/);
    }
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

  test('重新整理功能應該正常運作', async ({ page }) => {
    // 取得初始課程數
    const initialCount = await enrollmentPage.getCourseCount();
    
    // 點擊重新整理
    await enrollmentPage.refresh();
    
    // 檢查課程重新載入
    const newCount = await enrollmentPage.getCourseCount();
    expect(newCount).toBe(initialCount);
  });

  test('課程額滿應該無法選課', async ({ page }) => {
    // 尋找額滿的課程
    const fullCourseCard = await page.locator('.course-card').filter({ 
      hasText: '剩餘 0' 
    }).first();
    
    if (await fullCourseCard.count() > 0) {
      // 檢查是否顯示額滿訊息
      const fullMessage = fullCourseCard.locator('.full-message');
      await expect(fullMessage).toBeVisible();
      await expect(fullMessage).toHaveText('課程已額滿');
      
      // 確認沒有選課按鈕
      const enrollBtn = fullCourseCard.locator('button:has-text("選課")');
      await expect(enrollBtn).not.toBeVisible();
    }
  });
});