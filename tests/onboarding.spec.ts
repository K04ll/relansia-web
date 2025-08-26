import { test, expect } from '@playwright/test';

test('Onboarding complet', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Commencer').click();

  // Step 1 import CSV
  await page.setInputFiles('input[type="file"]', 'tests/fixtures/clients.csv');
  await page.getByText('Valider l’import').click();

  // Step 2 settings
  await page.fill('input[name="store_name"]', 'Relansia Test Shop');
  await page.getByText('Continuer → Règles').click();

  // Step 3 rules
  await page.getByText('Activer mes relances').click();

  // Expect redirection /app/reminders
  await expect(page).toHaveURL(/.*\/app\/reminders/);
});
