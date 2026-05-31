import { Button } from '@/app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { Input, Label, Select } from '@/app/components/ui/Input'
import { loadCourses, seedDemoCourses } from '@/lib/domain/courses-store'
import {
  buildInvoiceLinesFromCourses,
  downloadCsv,
  exportFakturowniaCsv,
  exportInvoicesCsv,
  exportWfirmaCsv,
} from '@/lib/domain/invoice-export'
import {
  INVOICING_PROVIDER_LABELS,
  loadInvoicingConfig,
  saveInvoicingConfig,
  type InvoicingConfig,
} from '@/lib/domain/invoicing-config'
import { useCloudSyncRefreshKeys } from '@/lib/sync/useCloudSyncRefresh'
import { FileDown, Receipt } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface InvoicingViewProps {
  tenantId: string
}

export function InvoicingView({ tenantId }: InvoicingViewProps) {
  const [config, setConfig] = useState<InvoicingConfig>(() => loadInvoicingConfig(tenantId))
  const [courseCount, setCourseCount] = useState(0)

  const refresh = useCallback(() => {
    seedDemoCourses(tenantId)
    setConfig(loadInvoicingConfig(tenantId))
    const courses = loadCourses(tenantId)
    const lines = buildInvoiceLinesFromCourses(courses, config)
    setCourseCount(lines.length)
  }, [tenantId, config])

  useEffect(() => {
    refresh()
  }, [refresh])

  useCloudSyncRefreshKeys(tenantId, ['courses', 'invoicing-config'], refresh)

  function persist(patch: Partial<InvoicingConfig>) {
    const next = { ...config, ...patch }
    saveInvoicingConfig(tenantId, next)
    setConfig(next)
  }

  function exportNow() {
    const courses = loadCourses(tenantId)
    const lines = buildInvoiceLinesFromCourses(courses, config)
    if (lines.length === 0) {
      window.alert('Brak kursów do fakturowania (status dostarczony/rozliczony z frachtem PLN).')
      return
    }
    let content: string
    let prefix: string
    if (config.provider === 'fakturownia') {
      content = exportFakturowniaCsv(lines, config)
      prefix = 'fakturownia'
    } else if (config.provider === 'wfirma') {
      content = exportWfirmaCsv(lines, config)
      prefix = 'wfirma'
    } else {
      content = exportInvoicesCsv(lines, config)
      prefix = 'faktury'
    }
    downloadCsv(`${prefix}-${new Date().toISOString().slice(0, 10)}.csv`, content)
    persist({ lastExportAt: new Date().toISOString() })
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Fakturowanie</h1>
        <p className="text-sm text-muted-foreground">
          Eksport zleceń dostarczonych do CSV, Fakturownia lub wFirma
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4 text-primary" />
            Konfiguracja
          </CardTitle>
          <CardDescription>
            {courseCount} kursów gotowych do eksportu · moduł włączany w Ustawieniach firmy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Dostawca</Label>
              <Select
                value={config.provider}
                onChange={(e) =>
                  persist({ provider: e.target.value as InvoicingConfig['provider'] })
                }
              >
                {Object.entries(INVOICING_PROVIDER_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Termin płatności (dni)</Label>
              <Input
                type="number"
                min={1}
                value={config.defaultPaymentDays}
                onChange={(e) =>
                  persist({ defaultPaymentDays: Number(e.target.value) || 14 })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nazwa sprzedawcy</Label>
              <Input
                value={config.sellerName ?? ''}
                onChange={(e) => persist({ sellerName: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>NIP sprzedawcy</Label>
              <Input
                value={config.sellerNip ?? ''}
                onChange={(e) => persist({ sellerNip: e.target.value || undefined })}
              />
            </div>
          </div>

          {config.provider === 'fakturownia' && (
            <div className="space-y-1.5">
              <Label>Subdomena Fakturownia</Label>
              <Input
                placeholder="twojafirma"
                value={config.fakturowniaSubdomain ?? ''}
                onChange={(e) =>
                  persist({ fakturowniaSubdomain: e.target.value || undefined })
                }
              />
              <p className="text-xs text-muted-foreground">
                API produkcyjne — klucz w Supabase Secrets (planowane)
              </p>
            </div>
          )}

          {config.lastExportAt && (
            <p className="text-xs text-muted-foreground">
              Ostatni eksport: {new Date(config.lastExportAt).toLocaleString('pl-PL')}
            </p>
          )}

          <Button className="gap-2" onClick={exportNow} disabled={config.provider === 'none'}>
            <FileDown className="h-4 w-4" />
            Eksportuj {courseCount} pozycji
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
