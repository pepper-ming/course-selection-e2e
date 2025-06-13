import { test, expect } from '@playwright/test';
import { testUsers, testCourses } from '../fixtures/test-data.js';

test.describe('診斷我的課表頁面', () => {
  test('診斷測試環境和頁面元素', async ({ page }) => {
    // 設定更長的超時時間
    test.setTimeout(120000);
    
    console.log('=== 開始診斷測試 ===');
    
    // 步驟 1: 檢查服務
    console.log('\n1. 檢查服務狀態...');
    try {
      const backendResponse = await page.request.get('http://localhost:8000/api/courses/');
      console.log(`後端服務狀態: ${backendResponse.status()}`);
    } catch (error) {
      console.error('後端服務無法連接:', error.message);
    }
    
    try {
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
      console.log('前端服務正常');
    } catch (error) {
      console.error('前端服務無法連接:', error.message);
      throw error;
    }
    
    // 步驟 2: 登入
    console.log('\n2. 嘗試登入...');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // 截圖登入頁面
    await page.screenshot({ path: 'screenshots/01-login-page.png', fullPage: true });
    
    // 檢查登入表單
    const usernameInput = await page.locator('input[id="username"]').isVisible();
    const passwordInput = await page.locator('input[id="password"]').isVisible();
    console.log(`使用者名稱輸入框: ${usernameInput ? '存在' : '不存在'}`);
    console.log(`密碼輸入框: ${passwordInput ? '存在' : '不存在'}`);
    
    if (!usernameInput || !passwordInput) {
      console.error('登入表單元素缺失');
      const pageContent = await page.content();
      console.log('頁面 HTML:', pageContent.substring(0, 500));
      throw new Error('登入表單元素缺失');
    }
    
    // 執行登入
    await page.fill('input[id="username"]', testUsers.student1.username);
    await page.fill('input[id="password"]', testUsers.student1.password);
    await page.click('button[type="submit"]');
    
    // 等待跳轉
    await page.waitForURL('/courses', { timeout: 10000 });
    console.log('登入成功');
    
    // 步驟 3: 選課
    console.log('\n3. 進入選課頁面...');
    await page.goto('/enrollment');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 截圖選課頁面
    await page.screenshot({ path: 'screenshots/02-enrollment-page.png', fullPage: true });
    
    // 檢查課程卡片
    const courseCards = await page.locator('.course-card').count();
    console.log(`找到 ${courseCards} 個課程卡片`);
    
    if (courseCards === 0) {
      // 嘗試其他選擇器
      const alternativeCards = await page.locator('[class*="course"]').count();
      console.log(`使用替代選擇器找到 ${alternativeCards} 個元素`);
      
      // 列出所有包含 course 的類別
      const allElements = await page.$$eval('*', elements => 
        elements
          .map(el => el.className)
          .filter(className => className && className.includes('course'))
          .slice(0, 10)
      );
      console.log('包含 "course" 的類別:', allElements);
    }
    
    // 嘗試選課
    console.log('\n4. 嘗試選課...');
    try {
      // 使用文字定位課程
      const dataStructureCard = page.locator(`text="${testCourses.dataStructure.name}"`).locator('..');
      if (await dataStructureCard.isVisible()) {
        const enrollBtn = dataStructureCard.locator('button:has-text("選課")');
        if (await enrollBtn.isVisible()) {
          await enrollBtn.click();
          console.log('點擊選課按鈕');
          await page.waitForTimeout(2000);
        } else {
          console.log('找不到選課按鈕');
        }
      } else {
        console.log(`找不到課程: ${testCourses.dataStructure.name}`);
      }
    } catch (error) {
      console.error('選課失敗:', error.message);
    }
    
    // 步驟 5: 進入我的課表
    console.log('\n5. 進入我的課表頁面...');
    await page.goto('/my-courses');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 截圖我的課表頁面
    await page.screenshot({ path: 'screenshots/03-my-courses-page.png', fullPage: true });
    
    // 診斷頁面結構
    console.log('\n6. 診斷頁面結構...');
    
    // 檢查各種可能的標題
    const h1Elements = await page.locator('h1').all();
    console.log(`\n找到 ${h1Elements.length} 個 h1 元素:`);
    for (let i = 0; i < h1Elements.length; i++) {
      const text = await h1Elements[i].textContent();
      console.log(`  h1[${i}]: "${text}"`);
    }
    
    // 檢查頁面標題相關元素
    const titleSelectors = [
      '.page-header',
      '.page-title',
      '[class*="header"]',
      '[class*="title"]'
    ];
    
    console.log('\n檢查標題相關元素:');
    for (const selector of titleSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`  ${selector}: 找到 ${count} 個`);
        const first = await page.locator(selector).first().textContent();
        console.log(`    內容: "${first?.substring(0, 50)}..."`);
      }
    }
    
    // 檢查統計區塊
    console.log('\n檢查統計相關元素:');
    const statsSelectors = [
      '.stats-section',
      '.statistics',
      '[class*="stats"]',
      '[class*="stat"]'
    ];
    
    for (const selector of statsSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`  ${selector}: 找到 ${count} 個`);
      }
    }
    
    // 檢查是否有 "已選課程數" 文字
    const enrolledText = await page.locator('text=已選課程數').count();
    console.log(`\n"已選課程數" 文字出現次數: ${enrolledText}`);
    
    const creditText = await page.locator('text=總學分數').count();
    console.log(`"總學分數" 文字出現次數: ${creditText}`);
    
    // 檢查按鈕
    console.log('\n檢查視圖切換按鈕:');
    const listViewBtn = await page.locator('button:has-text("列表檢視")').count();
    const calendarViewBtn = await page.locator('button:has-text("時間表檢視")').count();
    console.log(`  列表檢視按鈕: ${listViewBtn}`);
    console.log(`  時間表檢視按鈕: ${calendarViewBtn}`);
    
    // 輸出頁面的主要結構
    console.log('\n頁面主要結構:');
    const bodyHTML = await page.locator('body').innerHTML();
    const mainContent = bodyHTML
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/\s+/g, ' ')
      .substring(0, 1000);
    console.log(mainContent);
    
    // 檢查控制台錯誤
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('瀏覽器控制台錯誤:', msg.text());
      }
    });
    
    // 最終截圖
    await page.screenshot({ path: 'screenshots/04-final-state.png', fullPage: true });
    
    console.log('\n=== 診斷完成 ===');
    console.log('請查看 screenshots 資料夾中的截圖');
  });
});