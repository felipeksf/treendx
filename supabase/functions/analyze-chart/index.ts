import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert at reading exact numeric values from TradingView chart screenshots. Your job is to read the RSI number precisely and also estimate volatility and momentum from the chart.

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

ACCURACY IS PARAMOUNT. Read the green RSI number digit by digit.

You MUST respond using the provided tool function.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this TradingView chart. Read the exact green RSI number, identify the currency pair and RSI zone. Also estimate the current volatility percentage and momentum from the candlestick patterns and indicators visible in the chart.",
              },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_rsi_analysis",
              description: "Report the RSI analysis results including volatility and momentum from the TradingView chart",
              parameters: {
                type: "object",
                properties: {
                  rsi_value: {
                    type: "number",
                    description: "The current RSI value read from the chart (0-100)",
                  },
                  rsi_zone: {
                    type: "string",
                    enum: ["oversold", "neutral", "overbought"],
                    description: "oversold if RSI < 30, overbought if RSI > 70, neutral otherwise",
                  },
                  currency_pair: {
                    type: "string",
                    description: "The currency pair shown in the chart, e.g. USD/BRL, EUR/BRL",
                  },
                  confidence: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                    description: "Confidence level of the RSI reading",
                  },
                  analysis_summary: {
                    type: "string",
                    description: "Brief summary of the analysis in Portuguese (BR), including volatility and momentum observations",
                  },
                  suggested_score: {
                    type: "number",
                    description: "Suggested score 1-100. If RSI < 30 (oversold/cheap), suggest low score (10-30). If RSI > 70 (overbought/expensive), suggest high score (70-90). If neutral, suggest 40-60.",
                  },
                  volatility_pct: {
                    type: "number",
                    description: "Estimated volatility as a percentage (e.g. 2.4 for 2.4%). Based on candlestick size, Bollinger Bands, or ATR if visible. Range typically 0.5 to 5.0.",
                  },
                  momentum: {
                    type: "number",
                    description: "Estimated momentum as a signed number (e.g. +0.8 or -1.2). Positive = upward trend, negative = downward trend. Range typically -2.0 to +2.0.",
                  },
                },
                required: ["rsi_value", "rsi_zone", "currency_pair", "confidence", "analysis_summary", "suggested_score", "volatility_pct", "momentum"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_rsi_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes para análise de IA." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

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
