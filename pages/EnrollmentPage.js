export class EnrollmentPage {
  constructor(page) {
    this.page = page;
    
    // 定位器
    this.pageHeader = page.locator('.page-header h1');
    this.rulesSection = page.locator('.rules-section');
    this.enrolledCount = page.locator('.rules-section strong');
    this.searchInput = page.locator('.search-box input');
    this.typeFilter = page.locator('select').first();
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
  }

  async searchCourse(keyword) {
    await this.searchInput.fill(keyword);
    // 等待防抖
    await this.page.waitForTimeout(600);
  }

  async filterByType(type) {
    await this.typeFilter.selectOption(type);
  }

  async toggleShowEnrolled() {
    await this.showEnrolledCheckbox.click();
  }

  async refresh() {
    await this.refreshButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getCourseCard(courseName) {
    return this.courseCards.filter({ hasText: courseName });
  }

  async enrollCourse(courseName) {
    const card = await this.getCourseCard(courseName);
    const enrollBtn = card.locator('button:has-text("選課")');
    await enrollBtn.click();
  }

  async withdrawCourse(courseName) {
    const card = await this.getCourseCard(courseName);
    const withdrawBtn = card.locator('button:has-text("退選")');
    await withdrawBtn.click();
  }

  async getEnrolledCount() {
    const text = await this.enrolledCount.textContent();
    return parseInt(text);
  }

  async waitForMessage(type = 'success') {
    await this.messageAlert.filter({ hasClass: type }).waitFor();
  }

  async getMessageText() {
    return await this.messageAlert.textContent();
  }

  async isCourseFull(courseName) {
    const card = await this.getCourseCard(courseName);
    const fullMessage = card.locator('.full-message');
    return await fullMessage.isVisible();
  }

  async isCourseEnrolled(courseName) {
    const card = await this.getCourseCard(courseName);
    const withdrawBtn = card.locator('button:has-text("退選")');
    return await withdrawBtn.isVisible();
  }

  async getCourseCount() {
    return await this.courseCards.count();
  }
}