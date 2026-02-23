import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  currency: "USD" | "EUR" | "GBP" | "general";
}

function extractItems(xml: string, sourceName: string, currency: "USD" | "EUR" | "GBP" | "general"): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || '';
    const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
    const rssSource = itemXml.match(/<source[^>]*>(.*?)<\/source>/)?.[1] || sourceName;

    // Extract the actual link - Google News uses <link> with the redirect URL
    // Try to get the direct link first from <link> tag
    let link = '';
    const linkMatch = itemXml.match(/<link\s*\/?>([^<]*)/);
    if (linkMatch && linkMatch[1]?.trim()) {
      link = linkMatch[1].trim();
    }
    // Fallback: try guid
    if (!link) {
      const guidMatch = itemXml.match(/<guid[^>]*>(.*?)<\/guid>/);
      if (guidMatch) link = guidMatch[1].trim();
    }

    if (title) {
      items.push({
        title: title.trim(),
        link: link,
        pubDate: pubDate.trim(),
        source: rssSource.trim(),
        currency,
      });
    }
  }

  return items;
}

async function resolveGoogleNewsUrl(url: string): Promise<string> {
  if (!url.includes('news.google.com')) return url;
  try {
    const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } });
    // The final URL after redirects is the actual article
    if (res.url && !res.url.includes('news.google.com')) {
      await res.text(); // consume body
      return res.url;
    }
    const html = await res.text();
    // Try to extract from the HTML redirect page
    const metaMatch = html.match(/<a[^>]+href="(https?:\/\/[^"]+)"/);
    if (metaMatch) return metaMatch[1];
    return url;
  } catch {
    return url;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const feeds: { url: string; name: string; currency: "USD" | "EUR" | "GBP" | "general" }[] = [
      {
        url: 'https://news.google.com/rss/search?q=d%C3%B3lar+c%C3%A2mbio+real&hl=pt-BR&gl=BR&ceid=BR:pt-419',
        name: 'Google News - Dólar',
        currency: 'USD',
      },
      {
        url: 'https://news.google.com/rss/search?q=euro+c%C3%A2mbio+real+europeu&hl=pt-BR&gl=BR&ceid=BR:pt-419',
        name: 'Google News - Euro',
        currency: 'EUR',
      },
      {
        url: 'https://news.google.com/rss/search?q=libra+esterlina+c%C3%A2mbio+real+brit%C3%A2nica&hl=pt-BR&gl=BR&ceid=BR:pt-419',
        name: 'Google News - Libra',
        currency: 'GBP',
      },
      {
        url: 'https://news.google.com/rss/search?q=mercado+financeiro+brasil+c%C3%A2mbio&hl=pt-BR&gl=BR&ceid=BR:pt-419',
        name: 'Google News - Mercado',
        currency: 'general',
      },
    ];

    const results = await Promise.allSettled(
      feeds.map(async (feed) => {
        const res = await fetch(feed.url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        if (!res.ok) return [];
        const xml = await res.text();
        return extractItems(xml, feed.name, feed.currency);
      })
    );

    let allItems: NewsItem[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allItems = allItems.concat(result.value);
      }
    }

    // Deduplicate by title
    const seen = new Set<string>();
    const unique = allItems.filter((item) => {
      const key = item.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by date descending
    unique.sort((a, b) => {
      const da = new Date(a.pubDate).getTime() || 0;
      const db = new Date(b.pubDate).getTime() || 0;
      return db - da;
    });

    // Limit to 30 items
    const limited = unique.slice(0, 30);

    // Resolve Google News redirect URLs in parallel (limit to avoid timeouts)
    const resolved = await Promise.all(
      limited.map(async (item) => {
        const resolvedLink = await resolveGoogleNewsUrl(item.link);
        return { ...item, link: resolvedLink };
      })
    );

    return new Response(JSON.stringify({ news: resolved }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
