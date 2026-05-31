import { Button } from '@/app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { Input, Label, Select } from '@/app/components/ui/Input'
import { loadCourses, seedDemoCourses, upsertCourse } from '@/lib/domain/courses-store'
import {
  buildInvoiceLinesFromCourses,
  downloadCsv,
  exportFakturowniaCsv,
  exportInvoicesCsv,
  exportWfirmaCsv,
} from '@/lib/domain/invoice-export'
import {
  INVOICING_DELIVERY_LABELS,
  INVOICING_PROVIDER_LABELS,
  invoicingCsvEnabled,
  invoicingRestEnabled,
  loadInvoicingConfig,
  saveInvoicingConfig,
  type InvoicingConfig,
} from '@/lib/domain/invoicing-config'
import { createInvoicesViaEdge, testInvoicingConnection } from '@/lib/domain/integration-api'
import {
  coursesAwaitingPayment,
  coursesOverduePayment,
} from '@/lib/domain/course-documents-readiness'
import { useCloudSyncRefreshKeys } from '@/lib/sync/useCloudSyncRefreshKeys'
import { FileDown, Plug, Receipt, Send } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface InvoicingViewProps {
  tenantId: string
}

export function InvoicingView({ tenantId }: InvoicingViewProps) {
  const [config, setConfig] = useState<InvoicingConfig>(() => loadInvoicingConfig(tenantId))
  const [courseCount, setCourseCount] = useState(0)
  const [apiMsg, setApiMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(() => {
    seedDemoCourses(tenantId)
    const cfg = loadInvoicingConfig(tenantId)
    setConfig(cfg)
    const courses = loadCourses(tenantId)
    setCourseCount(buildInvoiceLinesFromCourses(courses, cfg).length)
  }, [tenantId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useCloudSyncRefreshKeys(tenantId, ['courses', 'invoicing-config'], refresh)

  function persist(patch: Partial<InvoicingConfig>) {
    const next = { ...config, ...patch }
    saveInvoicingConfig(tenantId, next)
    setConfig(next)
    const courses = loadCourses(tenantId)
    setCourseCount(buildInvoiceLinesFromCourses(courses, next).length)
  }

  function exportCsv() {
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
    setApiMsg(`Wyeksportowano ${lines.length} pozycji do CSV`)
  }

  async function sendViaApi() {
    if (config.provider !== 'fakturownia' && config.provider !== 'wfirma') return
    setBusy(true)
    setApiMsg(null)
    try {
      const courses = loadCourses(tenantId)
      const lines = buildInvoiceLinesFromCourses(courses, config)
      if (lines.length === 0) {
        setApiMsg('Brak kursów do wystawienia faktur')
        return
      }
      const r = await createInvoicesViaEdge(
        tenantId,
        config.provider,
        {
          fakturowniaSubdomain: config.fakturowniaSubdomain,
          fakturowniaApiToken: config.fakturowniaApiToken,
          wfirmaApiToken: config.wfirmaApiToken,
          wfirmaCompanyId: config.wfirmaCompanyId,
          sellerName: config.sellerName,
          sellerNip: config.sellerNip,
        },
        lines,
      )
      persist({
        lastApiSyncAt: new Date().toISOString(),
        lastApiError: r.errors?.join('; '),
      })
      setApiMsg(
        r.ok
          ? `Wystawiono ${r.created} faktur (${r.mode}) · ID: ${r.invoiceIds.join(', ')}`
          : r.errors?.join('; ') ?? 'Błąd API',
      )
      if (r.ok && r.created > 0) {
        markCoursesInvoiced(tenantId, lines.map((l) => l.courseId), config.defaultPaymentDays)
        refresh()
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Błąd połączenia'
      persist({ lastApiError: msg })
      setApiMsg(msg)
    } finally {
      setBusy(false)
    }
  }

  async function testConnection() {
    if (config.provider !== 'fakturownia' && config.provider !== 'wfirma') return
    setBusy(true)
    try {
      const r = await testInvoicingConnection(tenantId, config.provider, {
        fakturowniaSubdomain: config.fakturowniaSubdomain,
        fakturowniaApiToken: config.fakturowniaApiToken,
        wfirmaApiToken: config.wfirmaApiToken,
        wfirmaCompanyId: config.wfirmaCompanyId,
      })
      setApiMsg(r.message)
    } catch (e) {
      setApiMsg(e instanceof Error ? e.message : 'Test nieudany')
    } finally {
      setBusy(false)
    }
  }

  const csvOn = invoicingCsvEnabled(config)
  const restOn = invoicingRestEnabled(config)
  const allCourses = loadCourses(tenantId)
  const awaiting = coursesAwaitingPayment(allCourses)
  const overdue = coursesOverduePayment(allCourses)

  function markPaid(courseId: string) {
    const courses = loadCourses(tenantId)
    const c = courses.find((x) => x.id === courseId)
    if (!c) return
    upsertCourse(tenantId, {
      ...c,
      paymentReceivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    refresh()
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Fakturowanie</h1>
        <p className="text-sm text-muted-foreground">
          Pełna konfiguracja — moduł włączany w Ustawieniach firmy (domyślnie wyłączony)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4 text-primary" />
            Konfiguracja dostawcy
          </CardTitle>
          <CardDescription>{courseCount} kursów gotowych do fakturowania</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
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
              <Label>Tryb wysyłki</Label>
              <Select
                value={config.deliveryMode}
                onChange={(e) =>
                  persist({ deliveryMode: e.target.value as InvoicingConfig['deliveryMode'] })
                }
              >
                {Object.entries(INVOICING_DELIVERY_LABELS).map(([k, v]) => (
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
              <Label>Stawka VAT (%)</Label>
              <Input
                type="number"
                value={config.defaultVatRate}
                onChange={(e) =>
                  persist({ defaultVatRate: Number(e.target.value) || 23 })
                }
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
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
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Adres sprzedawcy</Label>
              <Input
                value={config.sellerAddress ?? ''}
                onChange={(e) => persist({ sellerAddress: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail na fakturze</Label>
              <Input
                type="email"
                value={config.sellerEmail ?? ''}
                onChange={(e) => persist({ sellerEmail: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Numer konta bankowego</Label>
              <Input
                value={config.sellerBankAccount ?? ''}
                onChange={(e) => persist({ sellerBankAccount: e.target.value || undefined })}
              />
            </div>
          </div>

          {config.provider === 'fakturownia' && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="font-medium">Fakturownia.pl — REST API</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Subdomena</Label>
                  <Input
                    placeholder="twojafirma"
                    value={config.fakturowniaSubdomain ?? ''}
                    onChange={(e) =>
                      persist({ fakturowniaSubdomain: e.target.value || undefined })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Token API</Label>
                  <Input
                    type="password"
                    autoComplete="off"
                    value={config.fakturowniaApiToken ?? ''}
                    onChange={(e) =>
                      persist({ fakturowniaApiToken: e.target.value || undefined })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>ID działu (opcjonalnie)</Label>
                  <Input
                    value={config.fakturowniaDepartmentId ?? ''}
                    onChange={(e) =>
                      persist({ fakturowniaDepartmentId: e.target.value || undefined })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {config.provider === 'wfirma' && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="font-medium">wFirma — REST API</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Company ID</Label>
                  <Input
                    value={config.wfirmaCompanyId ?? ''}
                    onChange={(e) =>
                      persist({ wfirmaCompanyId: e.target.value || undefined })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Token API</Label>
                  <Input
                    type="password"
                    autoComplete="off"
                    value={config.wfirmaApiToken ?? ''}
                    onChange={(e) =>
                      persist({ wfirmaApiToken: e.target.value || undefined })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Seria dokumentów</Label>
                  <Input
                    value={config.wfirmaSeriesName ?? ''}
                    onChange={(e) =>
                      persist({ wfirmaSeriesName: e.target.value || undefined })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.autoInvoiceOnDelivered}
              onChange={(e) => persist({ autoInvoiceOnDelivered: e.target.checked })}
            />
            Automatycznie wystawiaj fakturę po statusie „dostarczony” (REST)
          </label>

          <div className="flex flex-wrap gap-2">
            {csvOn && (
              <Button className="gap-2" onClick={exportCsv} disabled={config.provider === 'none'}>
                <FileDown className="h-4 w-4" />
                Eksport CSV ({courseCount})
              </Button>
            )}
            {restOn && config.provider !== 'none' && config.provider !== 'csv' && (
              <>
                <Button variant="secondary" className="gap-2" disabled={busy} onClick={() => void testConnection()}>
                  <Plug className="h-4 w-4" />
                  Test połączenia
                </Button>
                <Button className="gap-2" disabled={busy} onClick={() => void sendViaApi()}>
                  <Send className="h-4 w-4" />
                  Wystaw przez API ({courseCount})
                </Button>
              </>
            )}
          </div>

          {config.lastExportAt && (
            <p className="text-xs text-muted-foreground">
              Ostatni CSV: {new Date(config.lastExportAt).toLocaleString('pl-PL')}
            </p>
          )}
          {config.lastApiSyncAt && (
            <p className="text-xs text-muted-foreground">
              Ostatnie API: {new Date(config.lastApiSyncAt).toLocaleString('pl-PL')}
            </p>
          )}
          {config.lastApiError && (
            <p className="text-xs text-warning">API: {config.lastApiError}</p>
          )}
          {apiMsg && <p className="text-xs text-success">{apiMsg}</p>}
        </CardContent>
      </Card>

      {(awaiting.length > 0 || overdue.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Należności (cash flow)</CardTitle>
            <CardDescription>
              Śledzenie terminów płatności — problem #1 w raportach Bibby Financial Services 2025
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {overdue.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-danger/30 bg-danger/5 p-2">
                <span>
                  {c.reference} · termin {c.paymentDueAt} · {c.freightPln.toLocaleString('pl-PL')} zł
                </span>
                <Button size="sm" variant="secondary" onClick={() => markPaid(c.id)}>
                  Oznacz opłacone
                </Button>
              </div>
            ))}
            {awaiting.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2">
                <span>
                  {c.reference} · termin {c.paymentDueAt} · {c.freightPln.toLocaleString('pl-PL')} zł
                </span>
                <Button size="sm" variant="ghost" onClick={() => markPaid(c.id)}>
                  Opłacone
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-base">KSeF 2026 — planowane</CardTitle>
          <CardDescription>
            Od 2026 obowiązkowe faktury ustrukturyzowane (XML). Integracja KSeF w kolejnej wersji — na razie
            Fakturownia/wFirma REST + eksport CSV.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

function markCoursesInvoiced(tenantId: string, courseIds: string[], paymentDays: number): void {
  const courses = loadCourses(tenantId)
  const now = new Date()
  const due = new Date(now)
  due.setDate(due.getDate() + paymentDays)
  const dueStr = due.toISOString().slice(0, 10)
  const issued = now.toISOString()
  for (const id of courseIds) {
    const c = courses.find((x) => x.id === id)
    if (!c) continue
    upsertCourse(tenantId, {
      ...c,
      invoiceIssuedAt: issued,
      paymentDueAt: dueStr,
      updatedAt: issued,
    })
  }
}
