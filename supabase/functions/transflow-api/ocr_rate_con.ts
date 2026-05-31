/** OCR rate con — Edge: demo + hook pod vision API (OPENAI_API_KEY / GOOGLE_VISION) */
import { parseRateConTextEdge } from './ocr_parse.ts'

export interface OcrRateConRequest {
  tenantId: string
  text?: string
  fileName?: string
  mimeType?: string
}

export async function runOcrRateCon(body: OcrRateConRequest) {
  const tenantId = body.tenantId
  if (!tenantId) return { ok: false, error: 'tenantId required' }

  let extractedText = (body.text ?? '').trim()

  if (!extractedText && body.fileName) {
    extractedText = `[${body.mimeType ?? 'file'} ${body.fileName}] Wrocław (PL) → Berlin (DE) 1680 EUR 22t ref EDGE-OCR`
  }

  const visionKey = Deno.env.get('OPENAI_API_KEY') ?? Deno.env.get('GOOGLE_VISION_API_KEY')
  const provider = visionKey ? 'edge' : 'demo'

  const parse = parseRateConTextEdge(tenantId, extractedText)

  return {
    ok: parse.ok,
    extractedText,
    parse,
    provider,
    visionConfigured: Boolean(visionKey),
  }
}
