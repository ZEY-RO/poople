// Run against the production preview using playwright-cli run-code --filename.
async page => {
  const browser = page.context().browser();
  const origin = page.url().split('/').slice(0, 3).join('/');
  const paths = ['/', '/daily/', '/unlimited/', '/rush/', '/versus/', '/campaign/', '/how-to-play/', '/word-ladder-strategies/', '/word-ladder-solver/'];
  const gamePaths = new Set(['/', '/daily/', '/unlimited/', '/rush/', '/versus/', '/campaign/']);
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const staticContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 844 } });
  const liveContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  // These checks must not send synthetic game events to a live analytics store.
  await liveContext.route('**/*.supabase.co/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  const solverContext = await browser.newContext({ viewport: { width: 320, height: 844 } });
  await solverContext.route('**/*.supabase.co/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await solverContext.addInitScript(() => {
    // Force both supported clipboard mechanisms to fail so the manual route
    // remains useful even when browser clipboard access is blocked.
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Clipboard disabled for this check'); } } });
    document.execCommand = () => false;
  });
  const staticPage = await staticContext.newPage();
  const livePage = await liveContext.newPage();
  const solverPage = await solverContext.newPage();
  const errors = [];
  livePage.on('pageerror', error => errors.push(error.message));
  solverPage.on('pageerror', error => errors.push(error.message));
  const solverRequests = [];
  solverPage.on('request', request => solverRequests.push(request.url()));
  try {
    for (const path of paths) {
      const response = await staticPage.goto(origin + path);
      check(response.status() === 200, `${path} must return HTTP 200`);
      check(await staticPage.locator('h1').count() === 1, `${path}: exactly one H1`);
      check(await staticPage.locator('link[rel="canonical"]').getAttribute('href') === `https://poople.site${path}`, `${path}: canonical`);
      check(await staticPage.locator('.seo-content').innerText().then(text => text.length > 500), `${path}: useful content without JavaScript`);
      check(await staticPage.getByRole('navigation', { name: 'Explore Poople' }).getByRole('link').count() === paths.length, `${path}: crawlable destinations`);
      check(!await staticPage.evaluate(() => document.documentElement.scrollWidth > innerWidth), `${path}: 320px overflow`);
      const viewport = await staticPage.locator('meta[name="viewport"]').getAttribute('content');
      check(!/user-scalable=no|maximum-scale=1/.test(viewport), `${path}: zoom enabled`);
      if (path === '/word-ladder-solver/') {
        check(await staticPage.getByRole('form', { name: 'Word ladder solver' }).count() === 1, 'solver form is readable without JavaScript');
        check(await staticPage.getByRole('textbox', { name: 'Start word', exact: true }).count() === 1, 'static solver start field');
        check(await staticPage.getByRole('textbox', { name: 'Target word', exact: true }).count() === 1, 'static solver target field');
        check(await staticPage.getByRole('button', { name: 'Find shortest ladder', exact: true }).isDisabled(), 'static solver explains JavaScript requirement before calculation');
      }
    }
    for (const path of paths) {
      await livePage.goto(origin + path);
      if (gamePaths.has(path)) {
        await livePage.getByRole('main', { name: 'Word ladder game' }).waitFor();
        check(await livePage.getByRole('navigation', { name: 'Game modes' }).getByRole('link').count() === 5, `${path}: real mode links`);
      } else if (path === '/word-ladder-solver/') {
        await livePage.getByRole('button', { name: 'Find shortest ladder', exact: true }).waitFor();
        check(await livePage.locator('#solver-root form').count() === 1, 'dedicated solver form hydrates');
        check(await livePage.locator('script[type="module"]').count() === 1, 'solver uses a single dedicated entry');
        check(await livePage.getByRole('navigation', { name: 'Game modes' }).count() === 0, 'solver does not mount the full game');
      } else check(await livePage.locator('script[type="module"]').count() === 0, `${path}: no game JavaScript`);
      check(await livePage.locator('h1').count() === 1, `${path}: one rendered H1`);
      check(!await livePage.evaluate(() => document.documentElement.scrollWidth > innerWidth), `${path}: 390px overflow`);
    }
    await livePage.goto(`${origin}/?mode=unlimited&utm_source=test#game-guide`);
    await livePage.getByRole('main', { name: 'Word ladder game' }).waitFor();
    check(livePage.url().startsWith(`${origin}/unlimited/?`), 'legacy mode resolves to canonical document');
    check(livePage.url().includes('utm_source=test'), 'legacy redirect preserves tracking');
    check(await livePage.locator('link[rel="canonical"]').getAttribute('href') === 'https://poople.site/unlimited/', 'legacy redirect updates metadata');
    await livePage.goto(`${origin}/rush/?start=poll&target=poop`);
    await livePage.getByRole('button', { name: 'Edit', exact: true }).waitFor();
    check(livePage.url().startsWith(`${origin}/?`), 'custom shared puzzle uses root');
    check(livePage.url().includes('start=POLL'), 'custom words survive redirect');

    // Exercise the utility from its own document rather than using internal
    // solver functions; the revealed path must be usable through visible UI.
    await solverPage.goto(`${origin}/word-ladder-solver/`);
    const start = solverPage.getByRole('textbox', { name: 'Start word', exact: true });
    const target = solverPage.getByRole('textbox', { name: 'Target word', exact: true });
    const submit = solverPage.getByRole('button', { name: 'Find shortest ladder', exact: true });
    const result = solverPage.getByRole('region', { name: 'A shortest word ladder', exact: true });
    await start.fill('COLD');
    await target.fill('POOP');
    await submit.click();
    await result.waitFor();
    const words = await solverPage.locator('ol[aria-label="Shortest word ladder"] .solver-word .sr-only').allTextContents();
    check(words.length === 5 && words[0] === 'COLD' && words[words.length - 1] === 'POOP', 'COLD to POOP has a four-move minimum in this dictionary');
    for (let index = 1; index < words.length; index++) {
      check(words[index].length === 4, 'solver words remain four letters');
      check([...words[index]].filter((letter, position) => letter !== words[index - 1][position]).length === 1, 'every revealed solver step changes exactly one position');
    }
    check(solverPage.url().includes('start=COLD') && solverPage.url().includes('target=POOP'), 'solver result preserves a shareable word pair');
    await solverPage.getByRole('button', { name: 'Copy solution', exact: true }).click();
    await solverPage.getByText('Copying is unavailable in this browser. Select the plain-text route above and copy it manually.', { exact: true }).waitFor();
    check(await solverPage.locator('.solver-plain-path').innerText() === words.join(' → '), 'manual copy fallback keeps the complete plain-text route');
    check(!await solverPage.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'solver results do not overflow at 320px');
    await start.fill('QQZZ');
    check(await result.count() === 0, 'editing a word removes stale solutions immediately');
    await submit.click();
    await solverPage.getByText('QQZZ is not in Poople’s dictionary.', { exact: true }).waitFor();
    check(await start.getAttribute('aria-invalid') === 'true', 'invalid dictionary word is identified accessibly');
    check(await result.count() === 0, 'invalid words cannot display a ladder');
    await start.fill('COLD');
    await target.fill('COLD');
    await submit.click();
    check((await solverPage.locator('#solver-status').innerText()).includes('already match'), 'identical endpoints explain that no ladder is needed');
    check(await result.count() === 0, 'matching endpoints are not presented as a solved route');
    await start.fill('AQUA');
    await target.fill('POOP');
    await submit.click();
    await solverPage.getByText('No word ladder connects AQUA to POOP in Poople’s dictionary. Try a different pair.', { exact: true }).waitFor();
    check(await start.getAttribute('aria-invalid') === 'false', 'a disconnected dictionary word is valid vocabulary');
    check(await result.count() === 0, 'disconnected words explain failure instead of fabricating a route');
    await solverPage.goto(`${origin}/word-ladder-solver/?start=cold&target=warm`);
    await solverPage.waitForFunction(() => document.querySelector('#solver-target')?.value === 'WARM');
    check(await start.inputValue() === 'COLD' && await target.inputValue() === 'WARM', 'shared solver query seeds both normalized words');
    check(await result.count() === 0, 'a shared pair never reveals the answer automatically');
    await submit.click();
    await result.waitFor();
    const playLink = solverPage.getByRole('link', { name: 'Play this puzzle', exact: true });
    check(await playLink.getAttribute('href') === '/?start=COLD&target=WARM', 'custom targets can be played as the same game puzzle');
    check(await solverPage.locator('link[rel="canonical"]').getAttribute('href') === 'https://poople.site/word-ladder-solver/', 'query variants retain the canonical utility URL');
    check(solverRequests.every(url => url.startsWith(origin + '/')), 'the solver does not request optional remote services or third-party assets');
    await playLink.click();
    await solverPage.getByRole('button', { name: 'Edit', exact: true }).waitFor();
    check((await solverPage.locator('.page-intro p').innerText()).includes('WARM'), 'play link opens the generated custom target in the game');
    check(errors.length === 0, errors.join('; '));
    return { pages: paths.length, noJavaScript: 'passed', mobile: '320px and 390px passed', legacyAndCustomLinks: 'passed', solver: 'valid minimum route, invalid/identical/disconnected endpoints, stale results, seeded pairs, manual copy, play link, and remote isolation passed', runtimeErrors: errors };
  } finally {
    await staticContext.close();
    await liveContext.close();
    await solverContext.close();
  }
}
