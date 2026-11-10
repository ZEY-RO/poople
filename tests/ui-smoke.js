// Run against a running local app with Playwright CLI:
// playwright-cli open http://127.0.0.1:5174
// playwright-cli run-code --filename=tests/ui-smoke.js
// An isolated context keeps the checks separate from existing player progress.
async page => {
  const browser = page.context().browser();
  if (!browser) throw new Error('This check needs a browser context.');
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const app = await context.newPage();
  const failures = [];
  app.on('pageerror', error => failures.push(error.message));
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const mode = async index => {
    const navigation = app.getByRole('navigation', { name: 'Game modes' });
    if (index === 5) await navigation.getByRole('button', { name: 'Create a puzzle' }).click();
    else {
      await navigation.getByRole('link').nth(index).click();
      await app.getByRole('main', { name: 'Word ladder game' }).waitFor();
    }
  };
  const checks = [];
  try {
    // Keep optional analytics traffic outside this local gameplay check.
    await app.route('**/*.supabase.co/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await app.goto(page.url().split('?')[0].split('#')[0]);
    await app.getByRole('region', { name: 'Daily puzzle details' }).waitFor();
    await app.getByRole('button', { name: 'Archive', exact: true }).click();
    check(await app.locator('#daily-archive button[aria-pressed]').count() === 30, 'Daily archive should contain 30 puzzles.');
    await app.locator('#daily-archive button[aria-pressed]').nth(1).click();
    check(await app.getByText('· Archive', { exact: false }).count() > 0, 'Archive selection should show its date.');
    const archivedUrl = app.url();
    check(archivedUrl.includes('date='), 'Archive should have a shareable date.');
    await app.reload();
    check(await app.getByText('· Archive', { exact: false }).count() > 0, 'Archive date should survive reload.');
    await app.getByRole('button', { name: 'Archive', exact: true }).click();
    await app.getByRole('button', { name: 'Back to today', exact: true }).click();
    checks.push('Daily archive selection, shareable URL, reload, and return to today');

    await app.getByRole('button', { name: 'Moves', exact: true }).click();
    await app.locator('section button[class~="bg-theme-accent"]').first().click();
    const dailyInput = app.getByRole('textbox', { name: 'Next word', exact: true });
    const dailyStep = await dailyInput.inputValue();
    await dailyInput.press('Enter');
    // The daily generator always has multiple steps; preserve both a valid move and draft.
    await dailyInput.fill('AB');
    await app.reload();
    check(await dailyInput.inputValue() === 'AB', 'Daily draft should survive reload.');
    check(await app.getByRole('button', { name: `Definition of ${dailyStep}`, exact: true }).count() === 1, 'Daily ladder history should survive reload.');
    await app.getByRole('button', { name: 'Reset', exact: true }).click();
    check(await dailyInput.inputValue() === '', 'Reset should clear the draft.');
    checks.push('Daily move and draft persistence, native input, and reset');

    // Solve through the user-facing hint flow, then verify completion and restart.
    for (let step = 0; step < 14 && await dailyInput.count(); step++) {
      const hint = app.getByRole('button', { name: 'Hint', exact: true });
      await hint.click(); await hint.click(); await hint.click();
      await dailyInput.press('Enter');
    }
    await app.getByRole('dialog', { name: 'Puzzle complete', exact: true }).waitFor();
    const originalStats = await app.evaluate(() => JSON.parse(localStorage.getItem('poople_stats_v1')));
    check(originalStats.dailyWins === 1, 'Daily completion should count once.');
    check(Object.values(originalStats.dailyHistory)[0].hintsUsed > 0, 'Daily result should record hint usage.');
    await app.getByRole('button', { name: 'Close results', exact: true }).click();
    await app.reload();
    check(await dailyInput.count() === 0, 'Completed daily should stay complete on reload.');
    await app.getByRole('button', { name: 'Reset', exact: true }).click();
    check(await dailyInput.count() === 1, 'Completed ladder should be playable after reset.');
    checks.push('Daily completion, hint accounting, completed reload, and restart');

    await mode(1);
    const input = app.getByRole('textbox', { name: 'Next word', exact: true });
    await app.getByRole('button', { name: 'Letter A', exact: true }).click();
    await app.getByRole('button', { name: 'Letter B', exact: true }).click();
    check(await input.inputValue() === 'AB', 'On-screen keyboard should enter letters.');
    await app.getByRole('button', { name: 'Delete letter', exact: true }).click();
    check(await input.inputValue() === 'A', 'On-screen backspace should delete a letter.');
    await input.fill('ABCD');
    await input.press('Enter');
    await app.getByRole('alert').waitFor();
    check(await input.inputValue() === 'ABCD', 'Invalid submissions should preserve the typed word.');
    await input.fill('AB');
    await app.getByRole('button', { name: 'Settings', exact: true }).click();
    await app.keyboard.press('C');
    await app.keyboard.press('Enter');
    check(await input.inputValue() === 'AB', 'Modal keyboard events should not change the game.');
    await app.keyboard.press('Escape');
    checks.push('On-screen input, backspace, invalid word, and modal keyboard isolation');

    await mode(2);
    await app.getByRole('heading', { name: 'Ready for a rush?', exact: true }).waitFor();
    check(await app.getByRole('button', { name: 'Letter A', exact: true }).isDisabled(), 'Rush lobby should disable game input.');
    await app.getByRole('button', { name: 'Start Rush', exact: true }).click();
    const before = Number.parseInt(await app.getByRole('timer').getAttribute('aria-label'), 10);
    const skip = app.getByRole('button', { name: 'Skip puzzle, costs 5 seconds', exact: true });
    await skip.click();
    const after = Number.parseInt(await app.getByRole('timer').getAttribute('aria-label'), 10);
    check(after <= before - 5, 'Rush skip should deduct five seconds.');
    for (let i = 0; i < 24 && await skip.count(); i++) await skip.click();
    await app.getByRole('heading', { name: 'Time’s up!', exact: true }).waitFor();
    check(await app.getByRole('button', { name: 'Letter A', exact: true }).isDisabled(), 'Expired Rush should disable game input.');
    checks.push('Rush lobby, start, skip penalty, and expiration');

    await mode(3);
    await app.getByRole('button', { name: 'hard', exact: true }).click();
    await app.getByText('Grandmaster Commode', { exact: false }).first().waitFor();
    const botProgress = app.getByRole('progressbar', { name: 'Bot progress', exact: true });
    check(await botProgress.getAttribute('aria-valuenow') === '0', 'New opponent should start with zero progress.');
    await app.waitForFunction(() => Number(document.querySelector('[aria-label="Bot progress"]')?.getAttribute('aria-valuenow')) > 0);
    await app.getByRole('button', { name: 'Rematch', exact: true }).click();
    check(await botProgress.getAttribute('aria-valuenow') === '0', 'Rematch should reset the bot.');
    checks.push('Bot difficulty selection, movement, and rematch');

    await mode(4);
    check(!await app.getByRole('button', { name: /^Stage 1:/ }).isDisabled(), 'First campaign stage should be unlocked.');
    check(await app.getByRole('button', { name: /^Stage 2:/ }).isDisabled(), 'Second campaign stage should start locked.');
    await app.getByRole('button', { name: 'Start stage 1', exact: true }).click();
    await app.getByRole('textbox', { name: 'Next word', exact: true }).fill('POOP');
    await app.getByRole('textbox', { name: 'Next word', exact: true }).press('Enter');
    await app.getByRole('dialog', { name: 'Puzzle complete', exact: true }).waitFor();
    await app.getByRole('button', { name: 'Next stage', exact: true }).click();
    await app.getByText('Stage 2:', { exact: false }).first().waitFor();
    await app.getByRole('button', { name: 'All stages', exact: true }).click();
    check(!await app.getByRole('button', { name: /^Stage 2:/ }).isDisabled(), 'Completing stage one should unlock stage two.');
    checks.push('Campaign stage lock, completion, next stage, and unlock');

    // Resume at a chapter boundary instead of dropping the player at chapter one.
    await app.evaluate(() => {
      const stats = JSON.parse(localStorage.getItem('poople_stats_v1') || '{}');
      stats.campaignStars = Object.fromEntries(Array.from({ length: 10 }, (_, index) => [index + 1, 3]));
      localStorage.setItem('poople_stats_v1', JSON.stringify(stats));
    });
    await app.reload();
    await app.getByRole('heading', { name: 'The Plumber’s Apprentice', exact: true }).waitFor();
    check(await app.getByRole('group', { name: 'Campaign chapters' }).getByRole('button').nth(1).getAttribute('aria-pressed') === 'true', 'Campaign should resume in chapter two.');
    checks.push('Campaign chapter resume');

    for (const width of [390, 320]) {
      await app.setViewportSize({ width, height: 844 });
      for (let index = 0; index < 5; index++) {
        await mode(index);
        check(!await app.evaluate(() => document.documentElement.scrollWidth > innerWidth), `Mode ${index} overflows at ${width}px.`);
      }
    }
    checks.push('All five game modes at 390px and 320px without horizontal overflow');
    await mode(5);
    await app.getByRole('textbox', { name: 'Start word', exact: true }).fill('FART');
    await app.getByRole('textbox', { name: 'Target word', exact: true }).fill('POOP');
    await app.getByRole('button', { name: 'Play puzzle', exact: true }).click();
    const customInput = app.getByRole('textbox', { name: 'Next word', exact: true });
    for (let i = 0; i < 8; i++) {
      await customInput.fill(i % 2 === 0 ? 'PART' : 'FART');
      await customInput.press('Enter');
    }
    check(await app.evaluate(() => {
      const ladder = document.querySelector('.ladder-scroll');
      const input = document.querySelector('[aria-label="Next word"]');
      return ladder.scrollTop > 0 && input.getBoundingClientRect().bottom <= ladder.getBoundingClientRect().bottom;
    }), 'Long ladders should keep the input visible inside the board.');
    await app.getByRole('button', { name: 'Edit', exact: true }).click();
    check(await app.getByRole('textbox', { name: 'Start word', exact: true }).inputValue() === 'FART', 'Edit should preserve the custom start word.');
    await app.getByRole('textbox', { name: 'Start word', exact: true }).fill('LOOP');
    await app.getByRole('button', { name: 'Play puzzle', exact: true }).click();
    await customInput.fill('POOP');
    await customInput.press('Enter');
    await app.getByRole('dialog', { name: 'Puzzle complete', exact: true }).waitFor();
    await app.getByRole('button', { name: 'Replay', exact: true }).click();
    await app.getByText('Starting word', { exact: true }).waitFor();
    await app.getByText('Move 1 of 1', { exact: true }).waitFor();
    await app.getByRole('button', { name: 'Close results', exact: true }).click();
    checks.push('Custom create/edit, long-ladder scrolling, completion, and replay');

    await app.goto(app.url().split('?')[0] + '?date=2026-02-31');
    await app.getByRole('region', { name: 'Daily puzzle details' }).waitFor();
    check(!app.url().includes('date='), 'Impossible shared dates should fall back to today.');
    checks.push('Invalid shared daily date recovery');
    check(failures.length === 0, `Browser runtime errors: ${failures.join('; ')}`);
    return { passed: checks.length, checks, runtimeErrors: failures };
  } finally {
    await context.close();
  }
}
