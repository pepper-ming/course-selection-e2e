import { chromium } from '@playwright/test';

async function checkServices() {
  console.log('🔍 檢查服務狀態...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // 檢查後端服務
    console.log('📡 檢查後端服務 (http://localhost:8000)...');
    try {
      const backendResponse = await page.goto('http://localhost:8000/api/courses/', {
        waitUntil: 'networkidle',
        timeout: 10000
      });
      
      if (backendResponse.ok()) {
        console.log('✅ 後端服務正常');
      } else {
        console.log(`❌ 後端服務異常: ${backendResponse.status()}`);
        return false;
      }
    } catch (error) {
      console.log('❌ 後端服務無法連線:', error.message);
      return false;
    }
    
    // 檢查前端服務
    console.log('🌐 檢查前端服務 (http://localhost:5173)...');
    try {
      const frontendResponse = await page.goto('http://localhost:5173', {
        waitUntil: 'networkidle',
        timeout: 10000
      });
      
      if (frontendResponse.ok()) {
        console.log('✅ 前端服務正常');
      } else {
        console.log(`❌ 前端服務異常: ${frontendResponse.status()}`);
        return false;
      }
    } catch (error) {
      console.log('❌ 前端服務無法連線:', error.message);
      return false;
    }
    
    // 檢查登入頁面
    console.log('🔐 檢查登入功能...');
    try {
      await page.goto('http://localhost:5173/login');
      await page.waitForSelector('input[id="username"]', { timeout: 5000 });
      await page.waitForSelector('input[id="password"]', { timeout: 5000 });
      await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
      console.log('✅ 登入頁面元素正常');
    } catch (error) {
      console.log('❌ 登入頁面檢查失敗:', error.message);
      return false;
    }
    
    console.log('🎉 所有服務檢查通過！');
    return true;
    
  } catch (error) {
    console.error('❌ 服務檢查失敗:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// 如果直接執行這個腳本
if (import.meta.url === `file://${process.argv[1]}`) {
  checkServices().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { checkServices };