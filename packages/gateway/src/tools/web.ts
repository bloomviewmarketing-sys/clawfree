import { registerTool } from './registry.js';

registerTool(
  {
    name: 'web_fetch',
    description: 'Fetch the content of a URL and return it as text',
    parameters: {
      url: { type: 'string', description: 'The URL to fetch' },
      maxLength: { type: 'number', description: 'Max response length in chars (default 10000)' },
    },
    requiresApproval: false,
    timeout: 30000,
  },
  async (args) => {
    const url = args.url as string;
    const maxLength = (args.maxLength as number) || 10000;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'ClawFree/0.1' },
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      return `HTTP ${response.status}: ${response.statusText}`;
    }

    const contentType = response.headers.get('content-type') || '';
    let text: string;

    if (contentType.includes('application/json')) {
      const json = await response.json();
      text = JSON.stringify(json, null, 2);
    } else {
      text = await response.text();
      // Strip HTML tags for readability
      if (contentType.includes('text/html')) {
        text = text
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }

    if (text.length > maxLength) {
      text = text.slice(0, maxLength) + `\n...(truncated, ${text.length} total chars)`;
    }

    return text;
  }
);

registerTool(
  {
    name: 'web_search',
    description: 'Search the web and return results (uses DuckDuckGo)',
    parameters: {
      query: { type: 'string', description: 'Search query' },
      maxResults: { type: 'number', description: 'Max results (default 5)' },
    },
    requiresApproval: false,
    timeout: 15000,
  },
  async (args) => {
    const query = encodeURIComponent(args.query as string);
    const maxResults = (args.maxResults as number) || 5;

    // Use DuckDuckGo HTML (no API key needed)
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${query}`, {
      headers: {
        'User-Agent': 'ClawFree/0.1',
      },
      signal: AbortSignal.timeout(10000),
    });

    const html = await response.text();

    // Extract results from DuckDuckGo HTML
    const results: string[] = [];
    const resultRegex = /<a[^>]+class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    const snippetRegex = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

    let match;
    let i = 0;
    while ((match = resultRegex.exec(html)) && i < maxResults) {
      const url = match[1];
      const title = match[2].replace(/<[^>]+>/g, '').trim();
      const snippetMatch = snippetRegex.exec(html);
      const snippet = snippetMatch
        ? snippetMatch[1].replace(/<[^>]+>/g, '').trim()
        : '';

      results.push(`${i + 1}. ${title}\n   ${url}\n   ${snippet}`);
      i++;
    }

    return results.length > 0
      ? results.join('\n\n')
      : 'No results found';
  }
);
