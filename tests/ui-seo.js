// Run against the production preview using playwright-cli run-code --filename.
async page => {
  const browser = page.context().browser();
  const origin = page.url().split('/').slice(0, 3).join('/');
  const paths = ['/', '/daily/', '/unlimited/', '/rush/', '/versus/', '/campaign/', '/how-to-play/', '/word-ladder-strategies/'];
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const staticContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 844 } });
  const liveContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const staticPage = await staticContext.newPage();
  const livePage = await liveContext.newPage();
  const errors = [];
  livePage.on('pageerror', error => errors.push(error.message));
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
    }
    for (const path of paths) {
      await livePage.goto(origin + path);
      if (!path.includes('how-to-play') && !path.includes('strategies')) {
        await livePage.getByRole('main', { name: 'Word ladder game' }).waitFor();
        check(await livePage.getByRole('navigation', { name: 'Game modes' }).getByRole('link').count() === 5, `${path}: real mode links`);
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
    check(errors.length === 0, errors.join('; '));
    return { pages: paths.length, noJavaScript: 'passed', mobile: '320px and 390px passed', legacyAndCustomLinks: 'passed', runtimeErrors: errors };
  } finally {
    await staticContext.close();
    await liveContext.close();
  }
}
