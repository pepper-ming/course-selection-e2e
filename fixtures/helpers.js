import { expect } from '@playwright/test';
import { testUsers, apiEndpoints, timeouts } from './test-data.js';

/**
 * 登入輔助函數 - 增加重試機制
 */
export async function login(page, user = testUsers.student1) {
  console.log(`登入使用者: ${user.username}`);
  
  let retries = 3;
  while (retries > 0) {
    try {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      // 填入登入資訊
      await page.fill('input[id="username"]', user.username);
      await page.fill('input[id="password"]', user.password);
      
      // 監聽 API 回應
      const loginPromise = page.waitForResponse(
        response => response.url().includes('/api/auth/login/') && response.status() === 200,
        { timeout: timeouts.apiResponse }
      );
      
      await page.click('button[type="submit"]');
      
      // 等待登入 API 完成
      await loginPromise;
      
      // 等待跳轉
      await page.waitForURL('/courses', { timeout: timeouts.navigation });
      
      // 驗證登入狀態
      const navUser = page.locator('.nav-user');
      await expect(navUser).toContainText(user.name, { timeout: 5000 });
      
      console.log(`登入成功: ${user.name}`);
      return;
    } catch (error) {
      retries--;
      console.log(`登入失敗，重試剩餘次數: ${retries}`);
      if (retries === 0) throw error;
      await page.waitForTimeout(1000);
    }
  }
}

/**
 * 執行選課操作 - 增加錯誤處理
 */
export async function enrollCourse(page, courseName) {
  console.log(`選課: ${courseName}`);
  
  try {
    const courseCard = await getCourseCard(page, courseName);
    await courseCard.waitFor({ state: 'visible', timeout: 10000 });
    
    const enrollBtn = courseCard.locator('button:has-text("選課")');
    await expect(enrollBtn).toBeVisible({ timeout: 5000 });
    await expect(enrollBtn).toBeEnabled({ timeout: 5000 });
    
    // 設定 API 回應監聽
    const responsePromise = waitForAPIResponse(page, apiEndpoints.enrollments, 'POST');
    
    // 點擊選課按鈕
    await enrollBtn.click();
    
    // 等待 API 回應
    const response = await responsePromise;
    console.log(`選課 API 回應狀態: ${response.status()}`);
    
    // 等待 UI 更新
    await page.waitForTimeout(1000);
    
    return response;
  } catch (error) {
    console.error(`選課失敗: ${courseName}, 錯誤: ${error.message}`);
    throw error;
  }
}

/**
 * 執行退選操作 - 增加確認對話框處理
 */
export async function withdrawCourse(page, courseName) {
  console.log(`退選: ${courseName}`);
  
  try {
    const courseCard = await getCourseCard(page, courseName);
    await courseCard.waitFor({ state: 'visible', timeout: 10000 });
    
    const withdrawBtn = courseCard.locator('button:has-text("退選")');
    await expect(withdrawBtn).toBeVisible({ timeout: 5000 });
    await expect(withdrawBtn).toBeEnabled({ timeout: 5000 });
    
    // 設定對話框處理程序
    page.once('dialog', dialog => {
      console.log(`確認對話框: ${dialog.message()}`);
      dialog.accept();
    });
    
    // 設定 API 回應監聽
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/enrollments/') && 
                 response.request().method() === 'DELETE',
      { timeout: timeouts.apiResponse }
    );
    
    // 點擊退選按鈕
    await withdrawBtn.click();
    
    // 等待 API 回應
    const response = await responsePromise;
    console.log(`退選 API 回應狀態: ${response.status()}`);
    
    // 等待 UI 更新
    await page.waitForTimeout(1000);
    
    return response;
  } catch (error) {
    console.error(`退選失敗: ${courseName}, 錯誤: ${error.message}`);
    throw error;
  }
}

/**
 * 清理測試資料 - 改進版本
 */
export async function cleanupEnrollments(page) {
  console.log('清理測試資料...');
  
  try {
    await page.goto('/my-courses');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 取得所有退選按鈕
    const withdrawButtons = await page.locator('button:has-text("退選")').all();
    console.log(`找到 ${withdrawButtons.length} 個退選按鈕`);
    
    // 保留至少 2 門課程（符合最低選課要求）
    const buttonsToClick = withdrawButtons.length > 2 ? withdrawButtons.slice(0, -2) : [];
    
    // 依序退選
    for (let i = 0; i < buttonsToClick.length; i++) {
      try {
        console.log(`退選第 ${i + 1} 門課程...`);
        
        page.once('dialog', dialog => dialog.accept());
        await buttonsToClick[i].click();
        await page.waitForTimeout(timeouts.animation);
        
        // 等待頁面更新
        await page.waitForLoadState('networkidle');
      } catch (error) {
        console.error(`退選第 ${i + 1} 門課程失敗:`, error.message);
      }
    }
    
    console.log('測試資料清理完成');
    
  } catch (error) {
    console.error('清理測試資料失敗:', error.message);
  }
}

/**
 * 等待 API 回應
 */
export async function waitForAPIResponse(page, endpoint, method = 'GET') {
  return page.waitForResponse(
    response => response.url().includes(endpoint) && response.request().method() === method,
    { timeout: timeouts.apiResponse }
  );
}

/**
 * 檢查訊息提示 - 改進版本
 */
export async function checkMessage(page, message, type = 'success') {
  const messageAlert = page.locator(`.message-alert.${type}`);
  await expect(messageAlert).toBeVisible({ timeout: 5000 });
  
  if (message) {
    await expect(messageAlert).toContainText(message);
  }
  
  console.log(`檢查到 ${type} 訊息: ${await messageAlert.textContent()}`);
}

/**
 * 取得課程卡片 - 改進版本
 */
export async function getCourseCard(page, courseName) {
  // 等待課程載入
  await page.waitForSelector('.course-card', { timeout: 10000 });
  
  // 更精確的定位方式
  return page.locator('.course-card').filter({ 
    has: page.locator('h3', { hasText: courseName }) 
  });
}

/**
 * 等待元素準備就緒
 */
export async function waitForElementReady(element, timeout = 5000) {
  await element.waitFor({ state: 'visible', timeout });
  await element.waitFor({ state: 'attached', timeout });
  await expect(element).toBeEnabled({ timeout });
}

/**
 * 截圖輔助函數 - 改進版本
 */
export async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  
  try {
    await page.screenshot({ 
      path: `screenshots/${filename}`,
      fullPage: true 
    });
    console.log(`截圖已儲存: ${filename}`);
  } catch (error) {
    console.error(`截圖失敗: ${error.message}`);
  }
}

/**
 * 登出輔助函數 - 改進版本
 */
export async function logout(page) {
  console.log('執行登出...');
  
  try {
    // 檢查是否已在登入狀態
    const logoutBtn = page.locator('.logout-btn');
    if (!(await logoutBtn.isVisible())) {
      console.log('使用者未登入，跳過登出');
      return;
    }
    
    const logoutPromise = page.waitForResponse(
      response => response.url().includes('/api/auth/logout/'),
      { timeout: timeouts.apiResponse }
    );
    
    await logoutBtn.click();
    await logoutPromise;
    await page.waitForURL('/login', { timeout: timeouts.navigation });
    
    console.log('登出成功');
  } catch (error) {
    console.error(`登出失敗: ${error.message}`);
    // 強制導航到登入頁
    await page.goto('/login');
  }
}