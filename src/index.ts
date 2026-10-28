import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import { estimateCredits, fetchOfficialPage, pageUrl, parseCreditRates, PAGES } from './product.js';

function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function errorResult(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return { ...textResult(`Unable to read LiveSwapFace official information: ${message}`), isError: true };
}

function createServer(): McpServer {
  const server = new McpServer({ name: 'liveswapface-public-info', version: '0.1.0' });

  server.registerTool('read_official_page', {
    title: 'Read a LiveSwapFace page',
    description: 'Read current public text from one allowlisted LiveSwapFace page. No account access or media processing.',
    inputSchema: z.object({ page: z.enum(Object.keys(PAGES) as [keyof typeof PAGES, ...(keyof typeof PAGES)[]]) }),
  }, async ({ page }) => {
    try {
      const result = await fetchOfficialPage(page);
      return textResult(JSON.stringify({
        ...result,
        note: result.text.length < 300 ? 'This page appears to render most details in JavaScript; open the source URL in a browser for the full page.' : undefined,
      }, null, 2));
    } catch (error) { return errorResult(error); }
  });

  server.registerTool('estimate_session_credits', {
    title: 'Estimate LiveSwapFace credits',
    description: 'Fetch the current official rate and estimate credits for a planned browser session. This does not purchase credits or start a session.',
    inputSchema: z.object({
      seconds: z.number().positive().max(3600).describe('Planned AI output duration in seconds, at most 3600'),
      effect: z.enum(['faceSwap', 'tryOn', 'restyle']),
      model: z.enum(['basic', 'pro']),
    }),
  }, async ({ seconds, effect, model }) => {
    try {
      const [home, pricing] = await Promise.all([fetchOfficialPage('home'), fetchOfficialPage('pricing')]);
      const rates = parseCreditRates(home.text);
      if (!rates) return { ...textResult('Current official credit rates could not be parsed. Check the pricing page directly.'), isError: true };
      return textResult(JSON.stringify({
        ...estimateCredits(seconds, effect, model, rates),
        rates,
        checkedAt: new Date().toISOString(),
        rateSource: home.url,
        pricingPage: pricing.url,
        note: 'Estimate only. The product charges for AI output time; confirm the displayed rate before starting.',
      }, null, 2));
    } catch (error) { return errorResult(error); }
  });

  server.registerTool('get_official_links', {
    title: 'Get LiveSwapFace links',
    description: 'Return the official website routes used by this server.',
    inputSchema: z.object({}),
  }, async () => textResult(JSON.stringify(Object.fromEntries(Object.keys(PAGES).map((key) => [key, pageUrl(key as keyof typeof PAGES)])), null, 2)));

  return server;
}

void serveStdio(createServer);
