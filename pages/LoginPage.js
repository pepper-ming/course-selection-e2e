export class LoginPage {
  constructor(page) {
    this.page = page;
    
    // 定位器
    this.usernameInput = page.locator('input[id="username"]');
    this.passwordInput = page.locator('input[id="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('.error-message');
    this.registerLink = page.locator('a:has-text("還沒有帳號")');
    this.testAccountsSection = page.locator('.test-accounts');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }

  async isErrorVisible() {
    return await this.errorMessage.isVisible();
  }

  async goToRegister() {
    await this.registerLink.click();
  }

  async isTestAccountsVisible() {
    return await this.testAccountsSection.isVisible();
  }

  async waitForLoginSuccess() {
    await this.page.waitForURL('/courses', { timeout: 5000 });
  }
}