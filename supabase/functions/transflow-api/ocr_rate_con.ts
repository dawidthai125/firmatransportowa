/** OCR rate con — Edge: demo + hook pod vision API (OPENAI_API_KEY / GOOGLE_VISION) */
import { parseRateConTextEdge } from './ocr_parse.ts'

export interface OcrRateConRequest {
  tenantId: string
  text?: string
  fileName?: string
  mimeType?: string
  openaiApiKey?: string
  googleVisionApiKey?: string
}

export async function runOcrRateCon(body: OcrRateConRequest) {
  const tenantId = body.tenantId
  if (!tenantId) return { ok: false, error: 'tenantId required' }

  let extractedText = (body.text ?? '').trim()

  if (!extractedText && body.fileName) {
    extractedText = `[${body.mimeType ?? 'file'} ${body.fileName}] Wrocław (PL) → Berlin (DE) 1680 EUR 22t ref EDGE-OCR`
  }

  const openaiKey = body.openaiApiKey?.trim() || Deno.env.get('OPENAI_API_KEY')
  const visionKey = body.googleVisionApiKey?.trim() || Deno.env.get('GOOGLE_VISION_API_KEY')
  const visionConfigured = Boolean(openaiKey || visionKey)
  const provider = visionConfigured ? 'edge' : 'demo'

  if (visionConfigured && openaiKey && extractedText.length < 80 && body.fileName) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: `Wyekstrahuj z opisu rate con trasy frachtu: załadunek, rozładunek, cena EUR, waga. Tekst: ${extractedText}`,
            },
          ],
          max_tokens: 300,
        }),
      })
      if (res.ok) {
        const json = await res.json()
        const content = json?.choices?.[0]?.message?.content
        if (typeof content === 'string' && content.trim()) extractedText = content.trim()
      }
    } catch (e) {
      console.warn('[ocr-rate-con] OpenAI', e)
    }
  }

  const parse = parseRateConTextEdge(tenantId, extractedText)

  return {
    ok: parse.ok,
    extractedText,
    parse,
    provider,
    visionConfigured,
  }
}
