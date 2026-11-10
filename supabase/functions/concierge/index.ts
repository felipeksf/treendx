import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const textToAnalyze = body.prompt || body.text || body.message || JSON.stringify(body)

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY não está configurada nos Secrets do Supabase.')
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Você é um assistente de inteligência de mercado e análise técnica/financeira altamente preciso e direto. Analise o seguinte:\n\n${textToAnalyze}` }]
          }]
        }),
      }
    )

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message || 'Erro ao comunicar com a API do Gemini')
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Não foi possível gerar a resposta.'

    return new Response(
      JSON.stringify({ analysis: resultText, result: resultText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})