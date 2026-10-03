import { test, expect, type Page } from '@playwright/test';

// Card ids are `<faceId>-a` / `<faceId>-b`; the pair is the id without the suffix.
const pairOf = (id: string) => id.replace(/-[ab]$/, '');

async function startGame(page: Page, opts: { pack?: string; size?: string } = {}) {
  await page.goto('/#/modules/memory-match');
  if (opts.pack) await page.getByRole('tab', { name: opts.pack }).click();
  if (opts.size) await page.getByRole('tab', { name: opts.size }).click();
  await page.getByRole('button', { name: 'Start' }).click();
}

async function cardIds(page: Page) {
  return page.getByTestId('memory-card').evaluateAll((els) => els.map((el) => el.getAttribute('data-card-id') ?? ''));
}

const card = (page: Page, id: string) => page.locator(`[data-card-id="${id}"]`);

/** Two cards from different pairs. */
async function mismatchedPair(page: Page) {
  const ids = await cardIds(page);
  const first = ids[0]!;
  const second = ids.find((id) => pairOf(id) !== pairOf(first))!;
  return [first, second] as const;
}

async function matchAll(page: Page) {
  const done = new Set<string>();
  for (const id of await cardIds(page)) {
    const pair = pairOf(id);
    if (done.has(pair)) continue;
    done.add(pair);
    await card(page, `${pair}-a`).click();
    await card(page, `${pair}-b`).click();
  }
}

const tile = (page: Page, label: string) => page.getByText(label, { exact: true }).locator('..');

for (const pack of ['Shapes', 'Playing cards', 'Animals']) {
  test(`${pack} pack: a full small game with one miss`, async ({ page }) => {
    await startGame(page, { pack, size: 'Small' });
    await expect(page.getByTestId('memory-card')).toHaveCount(12);
    await expect(page.getByText('Pairs 0 / 6 · Turns 0')).toBeVisible();

    const [a, b] = await mismatchedPair(page);
    await card(page, a).click();
    await card(page, b).click();
    await matchAll(page);

    await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible();
    await expect(page.getByText(`${pack} · Small`)).toBeVisible();
    await expect(tile(page, 'Turns')).toContainText('7');
    await expect(tile(page, 'Accuracy')).toContainText('86%');
    await expect(tile(page, 'Memory errors')).toContainText('0');
    await expect(page.getByRole('row')).toHaveCount(7);
  });
}

test('a mismatch flips back on its own', async ({ page }) => {
  await startGame(page);
  const [a, b] = await mismatchedPair(page);
  await card(page, a).click();
  await card(page, b).click();
  await expect(card(page, a)).toHaveAttribute('data-state', 'up');
  await expect(card(page, b)).toHaveAttribute('data-state', 'up');
  await expect(card(page, a)).toHaveAttribute('data-state', 'down', { timeout: 3000 });
  await expect(card(page, b)).toHaveAttribute('data-state', 'down');
});

test('tapping another card during a mismatch skips the wait', async ({ page }) => {
  await startGame(page);
  const [a, b] = await mismatchedPair(page);
  const c = (await cardIds(page)).find((id) => id !== a && id !== b)!;
  await card(page, a).click();
  await card(page, b).click();
  await card(page, c).click();
  // Well under the 1s auto-hide, so this proves the tap hid them.
  await expect(card(page, a)).toHaveAttribute('data-state', 'down', { timeout: 300 });
  await expect(card(page, b)).toHaveAttribute('data-state', 'down', { timeout: 300 });
  await expect(card(page, c)).toHaveAttribute('data-state', 'up');
});

test('play again keeps the chosen pack and size', async ({ page }) => {
  await startGame(page, { pack: 'Animals', size: 'Small' });
  await matchAll(page);
  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.getByRole('tab', { name: 'Animals' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: 'Small' })).toHaveAttribute('aria-selected', 'true');
});

test('the home page links to memory match', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /memory match/i }).click();
  await expect(page.getByRole('heading', { name: 'Memory Match' })).toBeVisible();
});

test('the large board fits without scrolling', async ({ page }) => {
  await startGame(page, { size: 'Large' });
  await expect(page.getByTestId('memory-card')).toHaveCount(20);
  const overflow = await page.evaluate(() => {
    const main = document.querySelector('main')!;
    return {
      vertical: main.scrollHeight - main.clientHeight,
      horizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  expect(overflow.horizontal).toBeLessThanOrEqual(0);
  expect(overflow.vertical).toBeLessThanOrEqual(0);
});
