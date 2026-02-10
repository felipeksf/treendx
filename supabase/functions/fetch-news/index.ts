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
}

function extractItems(xml: string, sourceName: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || '';
    const link = itemXml.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/)?.[1] || '';
    const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
    const rssSource = itemXml.match(/<source[^>]*>(.*?)<\/source>/)?.[1] || sourceName;

    if (title) {
      items.push({
        title: title.trim(),
        link: link.trim(),
        pubDate: pubDate.trim(),
        source: rssSource.trim(),
      });
    }
  }

  return items;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const feeds = [
      {
        url: 'https://news.google.com/rss/search?q=d%C3%B3lar+c%C3%A2mbio+real&hl=pt-BR&gl=BR&ceid=BR:pt-419',
        name: 'Google News - Dólar',
      },
      {
        url: 'https://news.google.com/rss/search?q=euro+c%C3%A2mbio+real&hl=pt-BR&gl=BR&ceid=BR:pt-419',
        name: 'Google News - Euro',
      },
      {
        url: 'https://news.google.com/rss/search?q=mercado+financeiro+brasil+c%C3%A2mbio&hl=pt-BR&gl=BR&ceid=BR:pt-419',
        name: 'Google News - Mercado',
      },
    ];

    const results = await Promise.allSettled(
      feeds.map(async (feed) => {
        const res = await fetch(feed.url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        if (!res.ok) return [];
        const xml = await res.text();
        return extractItems(xml, feed.name);
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

    return new Response(JSON.stringify({ news: limited }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
