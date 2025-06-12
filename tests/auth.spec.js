import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { testUsers } from '../fixtures/test-data.js';
import { login, logout } from '../fixtures/helpers.js';

test.describe('認證功能測試', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('應該顯示登入頁面的所有元素', async ({ page }) => {
    await loginPage.goto();
    
    // 檢查頁面標題
    await expect(page.locator('h1')).toHaveText('登入選課系統');
    
    // 檢查表單元素
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    
    // 檢查測試帳號提示
    await expect(loginPage.testAccountsSection).toBeVisible();
    
    // 檢查註冊連結
    await expect(loginPage.registerLink).toBeVisible();
  });

  test('學生帳號應該能成功登入', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(testUsers.student1.username, testUsers.student1.password);
    
    // 等待跳轉到課程頁面
    await loginPage.waitForLoginSuccess();
    
    // 檢查導航列顯示使用者名稱
    const navUser = page.locator('.nav-user');
    await expect(navUser).toContainText(testUsers.student1.name);
    await expect(navUser).toContainText('學生');
  });

  test('錯誤的密碼應該顯示錯誤訊息', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(testUsers.student1.username, 'wrongpassword');
    
    // 檢查錯誤訊息
    await expect(loginPage.errorMessage).toBeVisible();
    const errorText = await loginPage.getErrorMessage();
    expect(errorText).toContain('登入失敗');
    
    // 確保沒有跳轉
    expect(page.url()).toContain('/login');
  });

  test('空白欄位應該無法提交', async ({ page }) => {
    await loginPage.goto();
    
    // 嘗試空白提交
    await loginPage.submitButton.click();
    
    // HTML5 驗證應該阻止提交
    const usernameValid = await loginPage.usernameInput.evaluate(el => el.validity.valid);
    expect(usernameValid).toBe(false);
  });

  test('登出功能應該正常運作', async ({ page }) => {
    // 先登入
    await login(page, testUsers.student1);
    
    // 執行登出
    await logout(page);
    
    // 檢查是否回到登入頁
    expect(page.url()).toContain('/login');
    
    // 嘗試訪問需要登入的頁面
    await page.goto('/courses');
    
    // 應該被重導向回登入頁
    await page.waitForURL('/login');
  });

  test('已登入使用者訪問登入頁應該重導向', async ({ page }) => {
    // 先登入
    await login(page, testUsers.student1);
    
    // 嘗試訪問登入頁
    await page.goto('/login');
    
    // 應該被重導向到課程頁
    await page.waitForURL('/courses');
  });

  test('多個瀏覽器標籤的登入狀態應該同步', async ({ browser }) => {
    const context = await browser.newContext();
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    // 在第一個標籤登入
    const loginPage1 = new LoginPage(page1);
    await loginPage1.goto();
    await loginPage1.login(testUsers.student1.username, testUsers.student1.password);
    await loginPage1.waitForLoginSuccess();
    
    // 第二個標籤訪問需要登入的頁面
    await page2.goto('/courses');
    
    // 應該可以直接訪問，不需要登入
    expect(page2.url()).toContain('/courses');
    await expect(page2.locator('.nav-user')).toContainText(testUsers.student1.name);
    
    await context.close();
  });

  test('Session 過期應該重導向到登入頁', async ({ page }) => {
    await login(page, testUsers.student1);
    
    // 清除 cookies 模擬 session 過期
    await page.context().clearCookies();
    
    // 重新整理頁面
    await page.reload();
    
    // 應該被重導向到登入頁
    await page.waitForURL('/login');
  });
});