import { chromium } from '@playwright/test';

async function testMinCourseLimit() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 登入
    console.log('1. 登入...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder*="帳號"]', 'student001');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // 2. 進入我的課表，清理所有選課
    console.log('2. 清理現有選課...');
    await page.goto('http://localhost:5173/my-courses');
    await page.waitForLoadState('networkidle');
    
    let withdrawBtns = await page.locator('button:has-text("退選")').all();
    while (withdrawBtns.length > 0) {
      page.once('dialog', dialog => dialog.accept());
      await withdrawBtns[0].click();
      await page.waitForTimeout(2000);
      withdrawBtns = await page.locator('button:has-text("退選")').all();
    }
    console.log('   清理完成');
    
    // 3. 進入選課頁面
    console.log('3. 進入選課頁面...');
    await page.goto('http://localhost:5173/enrollment');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 4. 選兩門課
    console.log('4. 選兩門課...');
    const enrollBtns = await page.locator('button:has-text("選課"):visible').all();
    console.log(`   找到 ${enrollBtns.length} 個可選課程`);
    
    if (enrollBtns.length < 2) {
      throw new Error('可選課程不足2門');
    }
    
    await enrollBtns[0].click();
    await page.waitForTimeout(2000);
    console.log('   已選第1門課');
    
    // 重新獲取按鈕（因為DOM可能更新）
    const enrollBtns2 = await page.locator('button:has-text("選課"):visible').all();
    await enrollBtns2[0].click();
    await page.waitForTimeout(2000);
    console.log('   已選第2門課');
    
    // 5. 檢查已選課程
    const selectedWithdrawBtns = await page.locator('button:has-text("退選"):visible').all();
    console.log(`   目前已選 ${withdrawBtns.length} 門課`);
    
    // 6. 退選一門
    console.log('5. 退選第一門課...');
    page.once('dialog', dialog => dialog.accept());
    await withdrawBtns[0].click();
    await page.waitForTimeout(2000);
    
    // 7. 嘗試退選最後一門（應該失敗）
    console.log('6. 嘗試退選最後一門課...');
    const lastWithdrawBtn = await page.locator('button:has-text("退選"):visible').first();
    
    // 監聽網路請求
    page.on('response', response => {
      if (response.url().includes('/api/enrollments/') && response.request().method() === 'DELETE') {
        console.log(`   API回應: ${response.status()} ${response.statusText()}`);
        response.json().then(data => {
          console.log('   回應內容:', data);
        }).catch(() => {});
      }
    });
    
    page.once('dialog', dialog => {
      console.log(`   對話框: ${dialog.message()}`);
      dialog.accept();
    });
    
    await lastWithdrawBtn.click();
    await page.waitForTimeout(3000);
    
    // 8. 檢查錯誤訊息
    console.log('7. 檢查錯誤訊息...');
    
    // 嘗試各種可能的錯誤訊息位置
    const errorPatterns = [
      { selector: '.message.error', name: 'message.error' },
      { selector: '.error-message', name: 'error-message' },
      { selector: '[class*="error"]', name: 'class含error' },
      { selector: 'text=/至少.*2/', name: '文字含"至少2"' },
      { selector: 'text=/最少.*2/', name: '文字含"最少2"' },
      { selector: 'text=/最低.*2/', name: '文字含"最低2"' },
      { selector: 'text=/退選失敗/', name: '文字含"退選失敗"' },
    ];
    
    let found = false;
    for (const pattern of errorPatterns) {
      try {
        const element = await page.locator(pattern.selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          const text = await element.textContent();
          console.log(`   ✓ 找到錯誤訊息 (${pattern.name}): "${text}"`);
          found = true;
        }
      } catch (e) {
        // 繼續下一個
      }
    }
    
    if (!found) {
      console.log('   ✗ 未找到錯誤訊息');
      
      // 檢查是否還有退選按鈕
      const stillHasBtn = await page.locator('button:has-text("退選"):visible').count();
      console.log(`   退選按鈕數量: ${stillHasBtn}`);
      
      // 輸出頁面內容協助除錯
      const pageContent = await page.content();
      console.log('\n   頁面包含以下class:');
      const classes = pageContent.match(/class="[^"]*"/g) || [];
      const uniqueClasses = [...new Set(classes)].slice(0, 20);
      uniqueClasses.forEach(c => console.log(`     ${c}`));
    }
    
    // 截圖
    await page.screenshot({ path: 'debug-min-course-result.png', fullPage: true });
    console.log('\n已儲存截圖: debug-min-course-result.png');
    
  } catch (error) {
    console.error('測試失敗:', error);
    await page.screenshot({ path: 'debug-min-course-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testMinCourseLimit();