import type { FreightOffer } from '@/lib/domain/freight-offer'

export interface RateConParseResult {
  ok: boolean
  confidence: 'high' | 'medium' | 'low'
  rawText: string
  offer?: Omit<FreightOffer, 'id' | 'postedAt'>
  warnings: string[]
}

/** Parser tekstu z rate con / zlecenia transportowego / OCR */
export function parseRateConText(tenantId: string, text: string): RateConParseResult {
  const rawText = text.trim()
  const warnings: string[] = []

  if (rawText.length < 12) {
    return { ok: false, confidence: 'low', rawText, warnings: ['Za krótki tekst do analizy'] }
  }

  const routeMatch = rawText.match(
    /(?:załad(?:unek|\.?)|load|from|z:?)\s*[:\s]*([A-Za-zÀ-ž\s-]+?)\s*(?:\(([A-Z]{2})\))?\s*(?:→|->|–|—|do|unload|rozład(?:unek|\.?)|to)\s*[:\s]*([A-Za-zÀ-ž\s-]+?)\s*(?:\(([A-Z]{2})\))?/i,
  )
  const simpleRoute = rawText.match(
    /([A-Za-zÀ-ž\s-]{2,30})\s*(?:\(([A-Z]{2})\))?\s*[-–>→]\s*([A-Za-zÀ-ž\s-]{2,30})\s*(?:\(([A-Z]{2})\))?/i,
  )

  const rm = routeMatch ?? simpleRoute
  const loadCity = (rm?.[1] ?? 'Wrocław').trim()
  const loadCountry = (rm?.[2] ?? 'PL').toUpperCase()
  const unloadCity = (rm?.[3] ?? 'Berlin').trim()
  const unloadCountry = (rm?.[4] ?? 'DE').toUpperCase()

  const pricePln = rawText.match(/(\d[\d\s,.]*)\s*(?:zł|pln)/i)
  const priceEur = rawText.match(/(\d[\d\s,.]*)\s*(?:eur|€)/i)
  const weight = rawText.match(/(\d[\d\s,.]*)\s*(?:kg|t\b|ton)/i)
  const refMatch = rawText.match(/(?:ref|zlecenie|order|nr\.?)\s*[:\s#]*([A-Z0-9/-]{4,24})/i)
  const dateMatch = rawText.match(/(\d{4}-\d{2}-\d{2}|\d{2}[./]\d{2}[./]\d{4})/)

  let loadDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  if (dateMatch) {
    const d = dateMatch[1]
    if (d.includes('-')) loadDate = d.slice(0, 10)
    else {
      const [dd, mm, yyyy] = d.split(/[./]/)
      if (yyyy && mm && dd) loadDate = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
    }
  }

  const freightPln = pricePln ? parseAmount(pricePln[1]) : 0
  const freightEur = priceEur ? parseAmount(priceEur[1]) : undefined
  const weightKg = weight
    ? parseAmount(weight[1]) * (/t\b|ton/i.test(weight[0]) ? 1000 : 1)
    : 18000

  if (!pricePln && !priceEur) warnings.push('Nie wykryto stawki — uzupełnij ręcznie')
  if (!rm) warnings.push('Trasa rozpoznana przybliżenie — sprawdź miasta')

  const scope =
    loadCountry === unloadCountry ? ('domestic' as const) : ('international_eu' as const)

  const reference = refMatch?.[1] ?? `OCR/${new Date().getFullYear()}/${Date.now().toString(36).slice(-5).toUpperCase()}`

  const confidence: RateConParseResult['confidence'] =
    rm && (pricePln || priceEur) ? 'high' : rm || pricePln || priceEur ? 'medium' : 'low'

  return {
    ok: confidence !== 'low',
    confidence,
    rawText,
    warnings,
    offer: {
      tenantId,
      source: 'ocr_rate_con',
      reference,
      loadCity,
      loadCountry,
      unloadCity,
      unloadCountry,
      loadDate,
      bodyType: /chłod|frigo|cool/i.test(rawText) ? 'frigo' : 'curtain',
      loadType: /ltl|część|partial/i.test(rawText) ? 'ltl' : 'ftl',
      scope,
      weightKg,
      adr: /adr/i.test(rawText),
      liftRequired: /winda|hds|lift/i.test(rawText),
      freightPln,
      freightEur,
      paymentDays: 30,
      shipperRating: 4,
      cargoDescription: rawText.slice(0, 140),
      shipperName: 'OCR rate con',
    },
  }
}

function parseAmount(raw: string): number {
  return Number(raw.replace(/\s/g, '').replace(',', '.')) || 0
}

export async function readTextFromImageFile(file: File): Promise<string> {
  /** Demo: bez Tesseract — zwracamy placeholder; Edge OCR uzupełnia z vision API */
  if (file.type === 'application/pdf') {
    return `[PDF ${file.name}] Wrocław (PL) → Berlin (DE) 1680 EUR 22t załadunek ${new Date().toISOString().slice(0, 10)} ref OCR-DEMO`
  }
  return `[IMG ${file.name}] Legnica (PL) → Drezno (DE) 1420 EUR 21.5t ADR nie`
}
