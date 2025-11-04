import { test, expect } from '@playwright/test';
import { API_PATHS } from '@/config/api';

test.describe('Signup flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Iniciar sesión|Inicia sessió/i }).click();
    await page.getByRole('button', { name: /Registrarme|Registrar-me/i }).click();
    await expect(page.getByLabel(/Correo electrónico/i)).toBeVisible();
  });

  test('requires accepting agreements before completing signup', async ({ page }) => {
    await page.getByLabel(/Correo electrónico/i).fill('alice@example.com');
    await page.getByLabel(/Código de invitación/i).fill('ACME-123');
    await page.locator('#signup-password').fill('password123');
    await page.locator('#signup-confirm-password').fill('password123');

    const submitButton = page.getByRole('button', { name: /Confirmar/i });
    await expect(submitButton).toBeDisabled();

    const checkboxes = page.getByRole('checkbox');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    await expect(submitButton).toBeEnabled();

    await page.route(`**${API_PATHS.register}`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ userId: 'user-123', email: 'alice@example.com' }),
      });
    });

    await submitButton.click();

    await expect(page.getByRole('heading', { name: /Consentimiento informado|Consentiment informat/i })).toBeVisible();
  });
});
