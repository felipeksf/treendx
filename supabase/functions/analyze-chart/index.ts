import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Same model the Lovable gateway proxied, now called directly on Google AI Studio.
const MODEL = "gemini-2.5-flash";
const ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM_PROMPT =
  `You are an expert at reading exact numeric values from TradingView chart screenshots. Your job is to read the RSI number precisely and also estimate volatility and momentum from the chart.

CRITICAL INSTRUCTIONS:
1. Look at the RSI indicator panel (usually at the bottom of the chart).
2. In the RSI legend/header area, there are multiple numbers. One is displayed in GREEN colored text.
3. READ THAT GREEN NUMBER EXACTLY AS IT APPEARS — do not round, do not approximate.
4. The green number is the CURRENT RSI value of the main RSI line.
5. IGNORE all other numbers in the RSI panel that are NOT green.
6. Do NOT estimate the RSI from the visual position of the line on the chart.
7. Determine the zone: below 30 = oversold, above 70 = overbought, 30-70 = neutral.
8. Identify the currency pair from the chart title (e.g., USD/BRL, EUR/BRL).

VOLATILITY ESTIMATION:
- Look at the candlestick chart body sizes and wicks in the recent candles (last ~20 candles).
- If candles have large bodies and long wicks relative to the overall range, volatility is HIGH (3.0-5.0%).
- If candles are moderate, volatility is MODERATE (1.5-3.0%).
- If candles are small and compact, volatility is LOW (0.5-1.5%).
- Also check if there's a Bollinger Band or ATR indicator visible and use its value if available.
- Report volatility as a percentage (e.g. 2.4).

MOMENTUM ESTIMATION:
- Look at the direction and slope of the last 5-10 candles.
- If price is clearly trending UP with consecutive higher closes, momentum is positive (+0.5 to +2.0).
- If price is clearly trending DOWN with consecutive lower closes, momentum is negative (-2.0 to -0.5).
- If price is sideways/choppy, momentum is near zero (-0.3 to +0.3).
- Also consider the RSI direction: rising RSI = positive momentum, falling RSI = negative momentum.
- Report as a signed number (e.g. +0.8 or -1.2).

ACCURACY IS PARAMOUNT. Read the green RSI number digit by digit.`;

const USER_PROMPT =
  "Analyze this TradingView chart. Read the exact green RSI number, identify the currency pair and RSI zone. Also estimate the current volatility percentage and momentum from the candlestick patterns and indicators visible in the chart.";

// Mirrors the `report_rsi_analysis` tool schema the gateway version used, so the
// response shape the admin screens consume is unchanged.
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    rsi_value: {
      type: "NUMBER",
      description: "The current RSI value read from the chart (0-100)",
    },
    rsi_zone: {
      type: "STRING",
      enum: ["oversold", "neutral", "overbought"],
      description: "oversold if RSI < 30, overbought if RSI > 70, neutral otherwise",
    },
    currency_pair: {
      type: "STRING",
      description: "The currency pair shown in the chart, e.g. USD/BRL, EUR/BRL",
    },
    confidence: {
      type: "STRING",
      enum: ["high", "medium", "low"],
      description: "Confidence level of the RSI reading",
    },
    analysis_summary: {
      type: "STRING",
      description:
        "Brief summary of the analysis in Portuguese (BR), including volatility and momentum observations",
    },
    suggested_score: {
      type: "NUMBER",
      description:
        "Suggested score 1-100. If RSI < 30 (oversold/cheap), suggest low score (10-30). If RSI > 70 (overbought/expensive), suggest high score (70-90). If neutral, suggest 40-60.",
    },
    volatility_pct: {
      type: "NUMBER",
      description:
        "Estimated volatility as a percentage (e.g. 2.4 for 2.4%). Based on candlestick size, Bollinger Bands, or ATR if visible. Range typically 0.5 to 5.0.",
    },
    momentum: {
      type: "NUMBER",
      description:
        "Estimated momentum as a signed number (e.g. +0.8 or -1.2). Positive = upward trend, negative = downward trend. Range typically -2.0 to +2.0.",
    },
  },
  required: [
    "rsi_value",
    "rsi_zone",
    "currency_pair",
    "confidence",
    "analysis_summary",
    "suggested_score",
    "volatility_pct",
    "momentum",
  ],
};

// The image lives in Supabase storage. Fetching it here and sending the bytes
// inline is more reliable than handing the model a URL to go fetch itself.
async function fetchImageInline(imageUrl: string) {
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Não foi possível baixar a imagem do gráfico (${res.status})`);
  }

  const mimeType = (res.headers.get("content-type") || "image/png").split(";")[0];
  const bytes = new Uint8Array(await res.arrayBuffer());

  // Chunked conversion — a spread over a multi-MB array blows the call stack.
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }

  return { mimeType, data: btoa(binary) };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "imageUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const inlineImage = await fetchImageInline(imageUrl);

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [
              { text: USER_PROMPT },
              { inlineData: inlineImage },
            ],
          },
        ],
        generationConfig: {
          // Deterministic: the same screenshot must always yield the same reading.
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 403) {
        return new Response(
          JSON.stringify({ error: "Chave de IA inválida ou sem acesso ao modelo." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("Unexpected Gemini response:", JSON.stringify(data));
      throw new Error("No analysis in AI response");
    }

    const analysis = JSON.parse(text);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-chart error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
