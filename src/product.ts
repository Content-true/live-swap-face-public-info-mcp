import { load } from 'cheerio';

const ORIGIN = 'https://liveswapface.com';
export const PAGES = {
  home: '/',
  pricing: '/pricing',
  virtualTryOn: '/live-virtual-try-on',
  terms: '/terms',
  privacy: '/privacy',
  contact: '/contact',
} as const;
export type PageName = keyof typeof PAGES;
export type Effect = 'faceSwap' | 'tryOn' | 'restyle';
export type Model = 'basic' | 'pro';

export function pageUrl(page: PageName): string {
  return new URL(PAGES[page], ORIGIN).toString();
}

export async function fetchOfficialPage(page: PageName): Promise<{ url: string; title: string; text: string; fetchedAt: string }> {
  const url = pageUrl(page);
  const response = await fetch(url, {
    signal: AbortSignal.timeout(12000),
    headers: { 'User-Agent': 'LiveSwapFacePublicInfoMCP/0.1 (+https://liveswapface.com/)' },
  });
  if (!response.ok) throw new Error(`Official page returned HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html')) throw new Error('Official page did not return HTML');
  const html = await response.text();
  const $ = load(html);
  $('script, style, noscript, svg, nav, footer, header').remove();
  const title = $('title').first().text().trim();
  const main = $('main').first();
  const text = (main.length ? main : $('body')).text().replace(/\s+/g, ' ').trim();
  if (!text) throw new Error('Official page had no readable text');
  return { url, title, text: text.slice(0, 16000), fetchedAt: new Date().toISOString() };
}

export function parseCreditRates(text: string): { basic: number; proFaceSwap: number; proTryOn: number; proRestyle: number } | null {
  const normalized = text.replace(/\s+/g, ' ');
  const basic = normalized.match(/Basic (?:costs|model uses)\s*(\d+)\s*credits? per second/i);
  const proGeneral = normalized.match(/Pro model uses\s*(\d+)\s*credits? per second/i);
  const proEffects = normalized.match(/Pro costs\s*(\d+)\s*for Face Swap and Try-On,? and\s*(\d+)\s*for Restyle/i);
  if (!basic || (!proEffects && !proGeneral)) return null;
  const standardPro = Number(proEffects?.[1] ?? proGeneral?.[1]);
  const restylePro = Number(proEffects?.[2] ?? proGeneral?.[1]);
  return {
    basic: Number(basic[1]),
    proFaceSwap: standardPro,
    proTryOn: standardPro,
    proRestyle: restylePro,
  };
}

export function estimateCredits(seconds: number, effect: Effect, model: Model, rates: NonNullable<ReturnType<typeof parseCreditRates>>) {
  const rate = model === 'basic' ? rates.basic : effect === 'restyle' ? rates.proRestyle : effect === 'tryOn' ? rates.proTryOn : rates.proFaceSwap;
  return { seconds, effect, model, creditsPerSecond: rate, estimatedCredits: Math.ceil(seconds * rate) };
}
