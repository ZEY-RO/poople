import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SEO_PAGES, type SeoPage } from './content';

export const SITE_URL = 'https://poople.site';

const navigation = [
  ['/', 'Poople home'],
  ['/daily/', 'Daily puzzle'],
  ['/unlimited/', 'Unlimited word ladders'],
  ['/rush/', 'Poop Rush'],
  ['/versus/', 'Versus bot'],
  ['/campaign/', 'The Gauntlet'],
  ['/how-to-play/', 'How to play'],
  ['/word-ladder-strategies/', 'Word ladder strategies'],
] as const;

function structuredData(page: SeoPage) {
  const url = `${SITE_URL}${page.path}`;
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebSite', '@id': `${SITE_URL}/#website`,
      name: 'Poople', alternateName: 'Poople Game', url: `${SITE_URL}/`, inLanguage: 'en',
    },
    {
      '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: 'Poople',
      url: `${SITE_URL}/`, logo: `${SITE_URL}/favicon-512x512.png`,
      sameAs: ['https://github.com/ZEY-RO/poople'],
    },
    {
      '@type': 'WebPage', '@id': `${url}#webpage`, url, name: page.title,
      description: page.description, inLanguage: 'en',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      publisher: { '@id': `${SITE_URL}/#organization` },
      ...(page.mode ? { about: { '@id': `${SITE_URL}/#game` } } : {}),
      ...(page.path !== '/' ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
    },
  ];
  if (page.mode) graph.push({
    '@type': 'WebApplication', '@id': `${SITE_URL}/#game`, name: 'Poople',
    url: `${SITE_URL}/`, image: `${SITE_URL}/og-image.jpg`,
    description: 'A free browser word ladder game. Change one letter at a time to reach POOP, with daily, unlimited, timed, bot and campaign modes.',
    applicationCategory: 'GameApplication', operatingSystem: 'Any', inLanguage: 'en',
    browserRequirements: 'Requires JavaScript and a modern web browser.',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@id': `${SITE_URL}/#organization` },
  });
  if (page.path !== '/') graph.push({
    '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Poople', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: page.heading, item: url },
    ],
  });
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function renderHead(page: SeoPage): string {
  const url = `${SITE_URL}${page.path}`;
  return renderToStaticMarkup(<React.Fragment>
    <title>{page.title}</title>
    <meta name="description" content={page.description} />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href={url} />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Poople" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:url" content={url} />
    <meta property="og:title" content={page.title} />
    <meta property="og:description" content={page.description} />
    <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Poople — change one letter at a time in a free word ladder game" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={page.title} />
    <meta name="twitter:description" content={page.description} />
    <meta name="twitter:image" content={`${SITE_URL}/og-image.jpg`} />
    <meta name="twitter:image:alt" content="Poople word ladder game" />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(page)).replace(/</g, '\\u003c') }} />
  </React.Fragment>);
}

function PageContent({ page }: { page: SeoPage }) {
  const Heading = page.mode ? 'h2' : 'h1';
  const Container = page.mode ? 'section' : 'main';
  return <Container id={page.mode ? 'game-guide' : 'main-content'} className={`seo-content${page.mode ? '' : ' standalone-guide'}`} aria-labelledby="guide-title">
    {!page.mode && <header className="guide-header"><a href="/" className="brand"><img src="/favicon-96x96.png" width="42" height="42" alt="" /><span className="brand-name">poople.</span></a><a href="/daily/">Play a daily puzzle →</a></header>}
    {page.path !== '/' && <nav aria-label="Breadcrumb" className="breadcrumbs"><a href="/">Poople</a><span aria-hidden="true"> / </span><span>{page.heading}</span></nav>}
    <Heading id="guide-title">{page.heading}</Heading>
    {page.intro.map(text => <p key={text}>{text}</p>)}
    {!page.mode && <a className="guide-play-link" href="/unlimited/">Try an unlimited word ladder →</a>}
    {page.sections.map(section => <section key={section.heading}>
      {page.mode ? <h3>{section.heading}</h3> : <h2>{section.heading}</h2>}
      {section.paragraphs.map(text => <p key={text}>{text}</p>)}
      {section.bullets && <ul>{section.bullets.map(text => <li key={text}>{text}</li>)}</ul>}
    </section>)}
    {page.faqs && <section aria-label="Frequently asked questions">
      {page.mode ? <h3>Frequently asked questions</h3> : <h2>Frequently asked questions</h2>}
      {page.faqs.map(faq => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}
    </section>}
    <nav className="seo-navigation" aria-label="Explore Poople">
      {navigation.map(([path, label]) => <a key={path} href={path} aria-current={path === page.path ? 'page' : undefined}>{label}</a>)}
    </nav>
    <footer className="seo-footer"><p>Free to play in your browser. No account or download required.</p><a href="https://github.com/ZEY-RO/poople">Poople on GitHub</a></footer>
  </Container>;
}

function replaceRegion(html: string, name: string, value: string): string {
  const start = `<!-- seo:${name}:start -->`;
  const end = `<!-- seo:${name}:end -->`;
  const a = html.indexOf(start);
  const b = html.indexOf(end);
  if (a < 0 || b <= a) throw new Error(`Missing SEO template region: ${name}`);
  return html.slice(0, a + start.length) + '\n' + value + '\n' + html.slice(b);
}

export function renderPage(html: string, page: SeoPage): string {
  let output = replaceRegion(html, 'head', renderHead(page));
  output = replaceRegion(output, 'content', renderToStaticMarkup(<PageContent page={page} />));
  output = replaceRegion(output, 'game', page.mode ? renderToStaticMarkup(
    <div id="root"><main id="main-content" className="game-loading"><h1>{page.heading}</h1><p>The interactive word ladder is loading. <a href="#game-guide">Read the rules and game guide</a> while you wait.</p><noscript><style>{'.game-loading { min-height: 0; }'}</style>Enable JavaScript to play Poople. The game guides and rules are available below without JavaScript.</noscript></main></div>
  ) : '<div id="root"></div>');
  if (!page.mode) {
    // Guides need only HTML and CSS; do not download the game engine or services.
    output = output.replace(/<script\b[^>]*\btype="module"[^>]*>[\s\S]*?<\/script>/g, '')
      .replace(/<link\b[^>]*\brel="modulepreload"[^>]*>/g, '');
  }
  return output;
}

export function renderSitemap(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${SEO_PAGES.map(page => `  <url><loc>${SITE_URL}${page.path}</loc></url>`).join('\n')}\n</urlset>\n`;
}
