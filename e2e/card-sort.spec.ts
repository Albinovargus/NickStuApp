import { test, expect, type Page } from '@playwright/test';

// Card ids are `<category>-<name>` and pile ids are `pile-<category>` in every pack.
async function activeCardId(page: Page) {
  const id = await page.getByTestId('active-card').getAttribute('data-card-id');
  if (!id) throw new Error('no active card');
  return id;
}

async function correctPileFor(page: Page) {
  return `pile-pile-${(await activeCardId(page)).split('-')[0]}`;
}

async function wrongPileFor(page: Page) {
  const correct = await correctPileFor(page);
  const piles = await page.locator('[data-testid^="pile-pile-"]').evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-testid') ?? ''),
  );
  const wrong = piles.find((p) => p !== correct);
  if (!wrong) throw new Error('no wrong pile');
  return wrong;
}

async function startRound(page: Page, opts: { pack?: string; mode?: string } = {}) {
  await page.goto('/#/modules/card-sort');
  if (opts.pack) await page.getByRole('tab', { name: opts.pack }).click();
  if (opts.mode) await page.getByRole('tab', { name: opts.mode }).click();
  await page.getByRole('button', { name: 'Start' }).click();
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
  for (let i = 0; i < 20 && (await page.getByTestId('active-card').count()) > 0; i++) {
    await dragActiveCardTo(page, await correctPileFor(page));
  }
}

for (const pack of ['Playing cards', 'Animals']) {
  test(`${pack} pack: a full round with one miss`, async ({ page }) => {
    await startRound(page, { pack });
    await expect(page.getByText('0 / 16 sorted')).toBeVisible();

    await dragActiveCardTo(page, await wrongPileFor(page));
    await sortRemainingCorrectly(page);

    await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible();
    await expect(page.getByText(`${pack} · Count as miss`)).toBeVisible();
    // 15 of 16 right on the first try.
    await expect(page.getByText('First-try accuracy').locator('..')).toContainText('94%');
  });
}

test('play again keeps the chosen pack and mode', async ({ page }) => {
  await startRound(page, { pack: 'Animals', mode: 'Bounce back' });
  await sortRemainingCorrectly(page);
  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.getByRole('tab', { name: 'Animals' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: 'Bounce back' })).toHaveAttribute('aria-selected', 'true');
});

test('home lists the card sort module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /card sort/i }).click();
  await expect(page.getByRole('heading', { name: 'Card Sort' })).toBeVisible();
});

test('count-as-miss mode: wrong drop lands in the pile and lowers accuracy', async ({ page }) => {
  await startRound(page);

  const wrongPile = await wrongPileFor(page);
  await dragActiveCardTo(page, wrongPile);
  await expect(page.getByText('1 / 12 sorted')).toBeVisible();
  await expect(page.getByTestId(wrongPile)).toContainText('1 card');

  await sortRemainingCorrectly(page);
  await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible();
  await expect(page.getByText('First-try accuracy').locator('..')).toContainText('92%');
});

test('bounce-back mode: wrong drop keeps the card in play', async ({ page }) => {
  await startRound(page, { mode: 'Bounce back' });

  const cardId = await activeCardId(page);
  await dragActiveCardTo(page, await wrongPileFor(page));
  await expect(page.getByText('0 / 12 sorted')).toBeVisible();
  expect(await activeCardId(page)).toBe(cardId);

  await sortRemainingCorrectly(page);
  await expect(page.getByText('Wrong drops').locator('..')).toContainText('1');
});

test('bounce-back mode: only the rejected card shakes, and only once', async ({ page }) => {
  await startRound(page, { mode: 'Bounce back' });
  const isShaking = () => page.getByTestId('active-card').locator('.animate-shake').count();

  const correctPile = await correctPileFor(page);
  await dragActiveCardTo(page, await wrongPileFor(page));
  expect(await isShaking()).toBe(1);

  // Dropping on empty space (no pile) must not replay the shake.
  const card = await page.getByTestId('active-card').boundingBox();
  if (!card) throw new Error('card missing');
  await page.mouse.move(card.x + card.width / 2, card.y + card.height / 2);
  await page.mouse.down();
  await page.mouse.move(card.x + card.width / 2 + 30, card.y + 10, { steps: 6 });
  await page.mouse.up();
  expect(await isShaking()).toBe(0);

  // The next card must not inherit the shake.
  await dragActiveCardTo(page, correctPile);
  await expect(page.getByText('1 / 12 sorted')).toBeVisible();
  expect(await isShaking()).toBe(0);
});

test('holding a card at the screen edges does not scroll or grow the page', async ({ page }) => {
  await page.goto('/#/modules/card-sort');
  await page.getByRole('button', { name: 'Start' }).click();

  const viewport = page.viewportSize();
  const card = await page.getByTestId('active-card').boundingBox();
  if (!viewport || !card) throw new Error('viewport or card missing');
  const cx = card.x + card.width / 2;
  const cy = card.y + card.height / 2;
  const edges = [
    [viewport.width - 2, cy],
    [cx, viewport.height - 2],
    [2, cy],
    [cx, 2],
  ] as const;

  for (const [x, y] of edges) {
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(x, y, { steps: 12 });
    await page.waitForTimeout(500); // give auto-scroll time to kick in if it would
    const scroll = await page.evaluate(() => {
      const main = document.querySelector('main')!;
      return {
        scroll: [main.scrollLeft, main.scrollTop],
        overflowX: main.scrollWidth - main.clientWidth,
      };
    });
    await page.mouse.move(cx, cy, { steps: 6 });
    await page.mouse.up();
    expect(scroll, `holding at (${x}, ${y})`).toEqual({ scroll: [0, 0], overflowX: 0 });
  }
});

test('no horizontal overflow', async ({ page }) => {
  await page.goto('/#/modules/card-sort');
  await page.getByRole('button', { name: 'Start' }).click();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});
