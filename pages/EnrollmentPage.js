export class EnrollmentPage {
  constructor(page) {
    this.page = page;
    
    // 定位器 - 根據實際前端組件結構
    this.pageHeader = page.locator('.page-header h1');
    this.rulesSection = page.locator('.rules-section');
    this.enrolledCountText = page.locator('.rules-section li:has-text("目前已選")'); // 修正定位器
    this.searchInput = page.locator('.search-box input');
    this.typeFilter = page.locator('.filter-controls select').first();
    this.showEnrolledCheckbox = page.locator('input[type="checkbox"]');
    this.refreshButton = page.locator('.refresh-btn');
    this.courseCards = page.locator('.course-card');
    this.loadingState = page.locator('.loading-state');
    this.emptyState = page.locator('.empty-state');
    this.messageAlert = page.locator('.message-alert');
  }

  async goto() {
    await this.page.goto('/enrollment');
    await this.page.waitForLoadState('networkidle');
    // 等待課程載入
    await this.page.waitForTimeout(2000);
  }

  async searchCourse(keyword) {
    await this.searchInput.fill(keyword);
    // 等待防抖和API回應
    await this.page.waitForTimeout(1000);
    await this.page.waitForLoadState('networkidle');
  }

  async filterByType(type) {
    await this.typeFilter.selectOption(type);
    await this.page.waitForLoadState('networkidle');
  }

  async toggleShowEnrolled() {
    await this.showEnrolledCheckbox.check();
    await this.page.waitForTimeout(500);
  }

  async refresh() {
    await this.refreshButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getCourseCard(courseName) {
    // 更精確的定位方式
    return this.courseCards.filter({ 
      has: this.page.locator('h3', { hasText: courseName }) 
    });
  }

  async enrollCourse(courseName) {
    const card = await this.getCourseCard(courseName);
    await card.waitFor({ state: 'visible' });
    
    const enrollBtn = card.locator('button:has-text("選課")');
    await enrollBtn.waitFor({ state: 'visible' });
    await enrollBtn.click();
    
    // 等待 API 回應
    await this.page.waitForTimeout(2000);
  }

  async withdrawCourse(courseName) {
    const card = await this.getCourseCard(courseName);
    await card.waitFor({ state: 'visible' });
    
    const withdrawBtn = card.locator('button:has-text("退選")');
    await withdrawBtn.waitFor({ state: 'visible' });
    await withdrawBtn.click();
    
    // 處理確認對話框
    this.page.once('dialog', dialog => dialog.accept());
    
    // 等待 API 回應
    await this.page.waitForTimeout(2000);
  }

  async getEnrolledCount() {
    const text = await this.enrolledCountText.textContent();
    const match = text.match(/目前已選：(\d+) 門課程/);
    return match ? parseInt(match[1]) : 0;
  }

  async waitForMessage(type = 'success', timeout = 5000) {
    try {
      await this.messageAlert.filter({ hasClass: type }).waitFor({ timeout });
      return true;
    } catch {
      return false;
    }
  }

  async getMessageText() {
    const message = this.messageAlert.first();
    if (await message.isVisible()) {
      return await message.textContent();
    }
    return '';
  }

  async isCourseFull(courseName) {
    const card = await this.getCourseCard(courseName);
    const fullMessage = card.locator('.full-message');
    return await fullMessage.isVisible().catch(() => false);
  }

  async isCourseEnrolled(courseName) {
    const card = await this.getCourseCard(courseName);
    const withdrawBtn = card.locator('button:has-text("退選")');
    return await withdrawBtn.isVisible().catch(() => false);
  }

  async getCourseCount() {
    await this.courseCards.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => null);
    return await this.courseCards.count();
  }

  async waitForCoursesLoaded() {
    // 等待課程載入完成
    try {
      await this.courseCards.first().waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      // 如果沒有課程，檢查是否有空狀態提示
      await this.emptyState.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null);
    }
  }
}