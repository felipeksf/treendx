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
            content: `You are an expert technical analyst. Analyze TradingView chart screenshots focusing on the RSI (Relative Strength Index) indicator. 

Your task:
1. Identify if there is an RSI indicator visible in the chart
2. Read the current RSI value as accurately as possible
3. Determine if RSI is below 30 (oversold) or above 70 (overbought) or between 30-70 (neutral)
4. Identify the currency pair shown in the chart (e.g., USD/BRL, EUR/BRL)

You MUST respond using the provided tool function.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this TradingView chart. Focus on the RSI indicator. What is the current RSI value? Is it below 30, above 70, or between 30-70? What currency pair is shown?",
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
              description: "Report the RSI analysis results from the TradingView chart",
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
                    description: "Brief summary of the analysis in Portuguese (BR)",
                  },
                  suggested_score: {
                    type: "number",
                    description: "Suggested score 1-100. If RSI < 30 (oversold/cheap), suggest low score (10-30). If RSI > 70 (overbought/expensive), suggest high score (70-90). If neutral, suggest 40-60.",
                  },
                },
                required: ["rsi_value", "rsi_zone", "currency_pair", "confidence", "analysis_summary", "suggested_score"],
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
