import { expect, test } from '@playwright/test';

test('guest can book an available slot end to end', async ({ page }) => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const eventTypeId = `e2e-intro-${suffix}`;
  const eventTitle = `E2E Intro ${suffix}`;
  const description = `Bookable event type created by Playwright ${suffix}`;
  const guestName = `Playwright Guest ${suffix}`;
  const guestEmail = `playwright-${suffix}@example.com`;

  await page.goto('/admin/event-types');
  await expect(page.getByRole('heading', { name: 'Create event type' })).toBeVisible();

  await page.getByLabel('ID').fill(eventTypeId);
  await page.getByLabel('Duration, minutes').fill('60');
  await page.getByLabel('Title').fill(eventTitle);
  await page.getByLabel('Description').fill(description);

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith('/admin/event-types') &&
        response.request().method() === 'POST' &&
        response.status() === 201,
    ),
    page.locator('form').getByRole('button', { name: 'Create event type' }).click(),
  ]);
  await expect(page.getByText('Event type created')).toBeVisible();

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Guest booking' })).toBeVisible();

  const eventCard = page.locator('.mantine-Paper-root').filter({
    has: page.getByRole('heading', { name: eventTitle }),
    hasText: description,
  });
  await expect(eventCard).toBeVisible();
  await eventCard.getByRole('link', { name: 'View slots' }).click();

  await expect(page.getByRole('heading', { name: 'Available slots' })).toBeVisible();
  await expect(page.getByText(`Event type: ${eventTypeId}`)).toBeVisible();

  const firstSlot = page.locator('input[type="radio"]').first();
  await expect(firstSlot).toBeVisible();
  const startsAt = await firstSlot.getAttribute('value');
  expect(startsAt).toBeTruthy();
  await firstSlot.check();

  await page.getByLabel('Guest name').fill(guestName);
  await page.getByLabel('Guest email').fill(guestEmail);

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith('/bookings') &&
        response.request().method() === 'POST' &&
        response.status() === 201,
    ),
    page.locator('form').getByRole('button', { name: 'Create booking' }).click(),
  ]);

  await expect(page.getByText('Booking created').first()).toBeVisible();
  await expect(page.locator(`input[type="radio"][value="${startsAt}"]`)).toHaveCount(0);

  await page.goto('/admin/bookings');
  await expect(page.getByRole('heading', { name: 'Upcoming bookings' })).toBeVisible();
  await expect(page.getByText(eventTitle)).toBeVisible();
  await expect(page.getByText(guestName)).toBeVisible();
  await expect(page.getByText(guestEmail)).toBeVisible();
});
