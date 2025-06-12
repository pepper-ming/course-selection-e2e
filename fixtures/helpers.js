import { expect } from '@playwright/test';
import { testUsers, apiEndpoints, timeouts } from './test-data.js';

/**
 * 登入輔助函數
 * @param {Page} page - Playwright page 物件
 * @param {Object} user - 使用者資料
 */
export async function login(page, user = testUsers.student1) {
  await page.goto('/login');
  await page.fill('input[id="username"]', user.username);
  await page.fill('input[id="password"]', user.password);
  await page.click('button[type="submit"]');
  
  // 等待登入成功並跳轉
  await page.waitForURL('/courses', { timeout: timeouts.navigation });
  
  // 驗證登入狀態
  const navUser = page.locator('.nav-user');
  await expect(navUser).toContainText(user.name);
}

/**
 * 登出輔助函數
 * @param {Page} page - Playwright page 物件
 */
export async function logout(page) {
  await page.click('.logout-btn');
  await page.waitForURL('/login', { timeout: timeouts.navigation });
}

/**
 * 等待 API 回應
 * @param {Page} page - Playwright page 物件
 * @param {string} endpoint - API 端點
 * @param {string} method - HTTP 方法
 */
export async function waitForAPIResponse(page, endpoint, method = 'GET') {
  return page.waitForResponse(
    response => response.url().includes(endpoint) && response.request().method() === method,
    { timeout: timeouts.apiResponse }
  );
}

/**
 * 檢查訊息提示
 * @param {Page} page - Playwright page 物件
 * @param {string} message - 預期訊息
 * @param {string} type - 訊息類型 (success/error/info)
 */
export async function checkMessage(page, message, type = 'success') {
  const messageAlert = page.locator(`.message-alert.${type}`);
  await expect(messageAlert).toBeVisible();
  await expect(messageAlert).toContainText(message);
}

/**
 * 取得課程卡片
 * @param {Page} page - Playwright page 物件
 * @param {string} courseName - 課程名稱
 */
export async function getCourseCard(page, courseName) {
  return page.locator('.course-card').filter({ hasText: courseName });
}

/**
 * 執行選課操作
 * @param {Page} page - Playwright page 物件
 * @param {string} courseName - 課程名稱
 */
export async function enrollCourse(page, courseName) {
  const courseCard = await getCourseCard(page, courseName);
  const enrollBtn = courseCard.locator('button:has-text("選課")');
  
  // 等待按鈕可點擊
  await expect(enrollBtn).toBeEnabled();
  
  // 設定 API 回應監聽
  const responsePromise = waitForAPIResponse(page, apiEndpoints.enrollments, 'POST');
  
  // 點擊選課按鈕
  await enrollBtn.click();
  
  // 等待 API 回應
  const response = await responsePromise;
  return response;
}

/**
 * 執行退選操作
 * @param {Page} page - Playwright page 物件
 * @param {string} courseName - 課程名稱
 */
export async function withdrawCourse(page, courseName) {
  const courseCard = await getCourseCard(page, courseName);
  const withdrawBtn = courseCard.locator('button:has-text("退選")');
  
  // 等待按鈕可點擊
  await expect(withdrawBtn).toBeEnabled();
  
  // 設定 API 回應監聽
  const responsePromise = waitForAPIResponse(page, apiEndpoints.enrollments, 'DELETE');
  
  // 點擊退選按鈕
  await withdrawBtn.click();
  
  // 處理確認對話框
  page.on('dialog', dialog => dialog.accept());
  
  // 等待 API 回應
  const response = await responsePromise;
  return response;
}

/**
 * 清理測試資料（退選所有課程）
 * @param {Page} page - Playwright page 物件
 */
export async function cleanupEnrollments(page) {
  await page.goto('/my-courses');
  
  // 等待頁面載入
  await page.waitForLoadState('networkidle');
  
  // 取得所有退選按鈕
  const withdrawButtons = await page.locator('button:has-text("退選")').all();
  
  // 保留至少 2 門課程（符合最低選課要求）
  const buttonsToClick = withdrawButtons.length > 2 ? withdrawButtons.slice(2) : [];
  
  // 依序退選
  for (const button of buttonsToClick) {
    await button.click();
    page.on('dialog', dialog => dialog.accept());
    await page.waitForTimeout(timeouts.animation);
  }
}

/**
 * 截圖輔助函數
 * @param {Page} page - Playwright page 物件
 * @param {string} name - 截圖名稱
 */
export async function takeScreenshot(page, name) {
  await page.screenshot({ 
    path: `screenshots/${name}-${Date.now()}.png`,
    fullPage: true 
  });
}

/**
 * 檢查課程時間衝突
 * @param {Object} course1 - 課程1時段
 * @param {Object} course2 - 課程2時段
 */
export function hasTimeConflict(course1, course2) {
  if (course1.day_of_week !== course2.day_of_week) return false;
  
  const toMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const start1 = toMinutes(course1.start_time);
  const end1 = toMinutes(course1.end_time);
  const start2 = toMinutes(course2.start_time);
  const end2 = toMinutes(course2.end_time);
  
  return start1 < end2 && end1 > start2;
}