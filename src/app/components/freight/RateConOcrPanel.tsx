import { Button } from '@/app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import type { FreightOffer } from '@/lib/domain/freight-offer'
import { writeTenantData } from '@/lib/tenant/storage'
import { loadAllFreightOffers } from '@/lib/domain/freight-board-store'
import { ocrRateConViaEdge } from '@/lib/domain/integration-api'
import { parseRateConText, readTextFromImageFile } from '@/lib/domain/rate-con-ocr'
import { ScanLine, Upload } from 'lucide-react'
import { useRef, useState } from 'react'

interface RateConOcrPanelProps {
  tenantId: string
  onImported: () => void
}

export function RateConOcrPanel({ tenantId, onImported }: RateConOcrPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pasteText, setPasteText] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [preview, setPreview] = useState<Partial<FreightOffer> | null>(null)

  async function handleFile(file: File) {
    setBusy(true)
    setMsg(null)
    try {
      const localText = await readTextFromImageFile(file)
      const combined = pasteText.trim() ? `${pasteText}\n${localText}` : localText
      let parse = parseRateConText(tenantId, combined)

      try {
        const edge = await ocrRateConViaEdge(tenantId, {
          text: combined,
          fileName: file.name,
          mimeType: file.type,
        })
        if (edge.parse?.offer) parse = edge.parse
        setMsg(`OCR (${edge.provider}) — ${edge.extractedText.slice(0, 80)}…`)
      } catch {
        setMsg('Parser lokalny — Edge niedostępny')
      }

      if (parse.offer) {
        setPreview(parse.offer)
        setPasteText(parse.rawText)
      } else {
        setMsg(parse.warnings.join(', ') || 'Nie udało się rozpoznać zlecenia')
      }
    } finally {
      setBusy(false)
    }
  }

  function importOffer() {
    if (!preview) return
    const offer: FreightOffer = {
      ...(preview as FreightOffer),
      id: crypto.randomUUID(),
      tenantId,
      postedAt: new Date().toISOString(),
    }
    const existing = loadAllFreightOffers(tenantId)
    writeTenantData(tenantId, 'freight-offers', [offer, ...existing])
    setPreview(null)
    setPasteText('')
    setMsg(`Dodano ofertę ${offer.reference}`)
    onImported()
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ScanLine className="h-4 w-4 text-primary" />
          OCR zlecenia (rate con)
        </CardTitle>
        <CardDescription>
          Wgraj zdjęcie/PDF lub wklej tekst — parser wyciąga trasę, stawkę i wagę
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <textarea
          className="min-h-[72px] w-full rounded-lg border border-border bg-background p-3 text-sm"
          placeholder="Opcjonalnie wklej tekst ze skanu…"
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f)
            e.target.value = ''
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            {busy ? 'Analiza…' : 'Wgraj plik'}
          </Button>
          <Button
            size="sm"
            disabled={busy || !pasteText.trim()}
            onClick={() => {
              const parse = parseRateConText(tenantId, pasteText)
              if (parse.offer) setPreview(parse.offer)
              else setMsg(parse.warnings.join(', '))
            }}
          >
            Parsuj tekst
          </Button>
          {preview && (
            <Button size="sm" onClick={importOffer}>
              Dodaj na giełdę
            </Button>
          )}
        </div>
        {preview && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <p className="font-medium">{preview.reference}</p>
            <p className="text-muted-foreground">
              {preview.loadCity} ({preview.loadCountry}) → {preview.unloadCity} ({preview.unloadCountry})
            </p>
            <p>
              {preview.freightPln ? `${preview.freightPln} zł` : `${preview.freightEur ?? '—'} EUR`} ·{' '}
              {preview.weightKg} kg
            </p>
          </div>
        )}
        {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
      </CardContent>
    </Card>
  )
}
