import { test, expect, type Page } from '@playwright/test';

async function activeShape(page: Page) {
  return page.getByTestId('active-card').locator('svg').getAttribute('aria-label');
}

// Stepped mouse drag: dnd-kit only activates after the pointer moves a few pixels.
async function dragActiveCardTo(page: Page, pileTestId: string) {
  const card = await page.getByTestId('active-card').boundingBox();
  const pile = await page.getByTestId(pileTestId).boundingBox();
  if (!card || !pile) throw new Error('card or pile not visible');
  await page.mouse.move(card.x + card.width / 2, card.y + card.height / 2);
  await page.mouse.down();
  await page.mouse.move(pile.x + pile.width / 2, pile.y + pile.height / 2, { steps: 12 });
  await page.mouse.up();
}

async function sortRemainingCorrectly(page: Page) {
  for (let i = 0; i < 12 && (await page.getByTestId('active-card').count()) > 0; i++) {
    await dragActiveCardTo(page, `pile-pile-${await activeShape(page)}`);
  }
}

test('home lists the card sort module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /card sort/i }).click();
  await expect(page.getByRole('heading', { name: 'Card Sort' })).toBeVisible();
});

test('count-as-miss mode: wrong drop lands in the pile and lowers accuracy', async ({ page }) => {
  await page.goto('/#/modules/card-sort');
  await page.getByRole('button', { name: 'Start' }).click();

  const shape = await activeShape(page);
  const wrongPile = shape === 'circle' ? 'pile-pile-star' : 'pile-pile-circle';
  await dragActiveCardTo(page, wrongPile);
  await expect(page.getByText('1 / 12 sorted')).toBeVisible();
  await expect(page.getByTestId(wrongPile)).toContainText('1 card');

  await sortRemainingCorrectly(page);
  await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible();
  await expect(page.getByText('First-try accuracy').locator('..')).toContainText('92%');
});

test('bounce-back mode: wrong drop keeps the card in play', async ({ page }) => {
  await page.goto('/#/modules/card-sort');
  await page.getByRole('tab', { name: 'Bounce back' }).click();
  await page.getByRole('button', { name: 'Start' }).click();

  const shape = await activeShape(page);
  await dragActiveCardTo(page, shape === 'circle' ? 'pile-pile-star' : 'pile-pile-circle');
  await expect(page.getByText('0 / 12 sorted')).toBeVisible();
  expect(await activeShape(page)).toBe(shape);

  await sortRemainingCorrectly(page);
  await expect(page.getByText('Wrong drops').locator('..')).toContainText('1');
});

test('no horizontal overflow', async ({ page }) => {
  await page.goto('/#/modules/card-sort');
  await page.getByRole('button', { name: 'Start' }).click();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});
