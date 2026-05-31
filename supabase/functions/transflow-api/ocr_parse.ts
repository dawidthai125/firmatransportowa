/** Wspólny parser rate con dla Edge OCR */
export function parseRateConTextEdge(tenantId: string, text: string) {
  const rawText = text.trim()
  const warnings: string[] = []
  if (rawText.length < 8) {
    return { ok: false, confidence: 'low' as const, rawText, warnings: ['Za krótki tekst'] }
  }

  const simpleRoute = rawText.match(
    /([A-Za-zÀ-ž\s-]{2,30})\s*(?:\(([A-Z]{2})\))?\s*[-–>→]\s*([A-Za-zÀ-ž\s-]{2,30})\s*(?:\(([A-Z]{2})\))?/i,
  )
  const loadCity = (simpleRoute?.[1] ?? 'Wrocław').trim()
  const loadCountry = (simpleRoute?.[2] ?? 'PL').toUpperCase()
  const unloadCity = (simpleRoute?.[3] ?? 'Berlin').trim()
  const unloadCountry = (simpleRoute?.[4] ?? 'DE').toUpperCase()

  const pricePln = rawText.match(/(\d[\d\s,.]*)\s*(?:zł|pln)/i)
  const priceEur = rawText.match(/(\d[\d\s,.]*)\s*(?:eur|€)/i)
  const weight = rawText.match(/(\d[\d\s,.]*)\s*(?:kg|t\b)/i)

  const freightPln = pricePln ? Number(pricePln[1].replace(/\s/g, '').replace(',', '.')) : 0
  const freightEur = priceEur ? Number(priceEur[1].replace(/\s/g, '').replace(',', '.')) : undefined
  const weightKg = weight ? Number(weight[1].replace(/\s/g, '')) * (/t\b/i.test(weight[0]) ? 1000 : 1) : 18000

  if (!pricePln && !priceEur) warnings.push('Brak stawki w tekście')
  const confidence = simpleRoute && (pricePln || priceEur) ? 'high' : 'medium'

  return {
    ok: true,
    confidence,
    rawText,
    warnings,
    offer: {
      tenantId,
      source: 'ocr_rate_con',
      reference: `OCR/${new Date().getFullYear()}/${Date.now().toString(36).slice(-5).toUpperCase()}`,
      loadCity,
      loadCountry,
      unloadCity,
      unloadCountry,
      loadDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      bodyType: 'curtain',
      loadType: 'ftl',
      scope: loadCountry === unloadCountry ? 'domestic' : 'international_eu',
      weightKg,
      adr: /adr/i.test(rawText),
      liftRequired: false,
      freightPln,
      freightEur,
      paymentDays: 30,
      shipperRating: 4,
      cargoDescription: rawText.slice(0, 140),
      shipperName: 'OCR rate con (Edge)',
    },
  }
}
