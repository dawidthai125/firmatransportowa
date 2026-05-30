import { Button } from '@/app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { Input, Label, Select } from '@/app/components/ui/Input'
import {
  COMPANY_DOC_LABELS,
  loadTenantSettingsData,
  saveTenantSettingsData,
  seedDemoCompanyDocuments,
  type CompanyDocument,
  type CompanyDocumentType,
} from '@/lib/domain/tenant-settings'
import { EXPIRY_STATUS_COLORS, expiryStatus, formatExpiryDate } from '@/lib/domain/compliance'
import type { Tenant } from '@/lib/tenant/types'
import { cn } from '@/lib/utils'
import { Plus, Settings, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface SettingsViewProps {
  tenant: Tenant
}

export function SettingsView({ tenant }: SettingsViewProps) {
  const { settings } = tenant
  const [documents, setDocuments] = useState<CompanyDocument[]>([])
  const [mechanics, setMechanics] = useState(loadTenantSettingsData(tenant.id).mechanics)
  const [verifierIds, setVerifierIds] = useState(
    loadTenantSettingsData(tenant.id).repairWorkflow.verifierUserIds.join(', '),
  )

  const refresh = useCallback(() => {
    seedDemoCompanyDocuments(tenant.id)
    const data = loadTenantSettingsData(tenant.id)
    setDocuments(data.companyDocuments)
    setMechanics(data.mechanics)
    setVerifierIds(data.repairWorkflow.verifierUserIds.join(', '))
  }, [tenant.id])

  useEffect(() => {
    refresh()
  }, [refresh])

  function persist(next: CompanyDocument[]) {
    setDocuments(next)
    const data = loadTenantSettingsData(tenant.id)
    saveTenantSettingsData(tenant.id, { ...data, companyDocuments: next })
  }

  function persistMechanics(next: typeof mechanics) {
    setMechanics(next)
    const data = loadTenantSettingsData(tenant.id)
    saveTenantSettingsData(tenant.id, { ...data, mechanics: next })
  }

  function updateMechanic(index: number, patch: Partial<(typeof mechanics)[0]>) {
    const next = [...mechanics]
    next[index] = { ...next[index], ...patch, updatedAt: new Date().toISOString() }
    persistMechanics(next)
  }

  function saveVerifiers() {
    const ids = verifierIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const data = loadTenantSettingsData(tenant.id)
    saveTenantSettingsData(tenant.id, {
      ...data,
      repairWorkflow: { ...data.repairWorkflow, verifierUserIds: ids },
    })
  }

  function addDocument() {
    persist([
      ...documents,
      {
        type: 'licencja_krajowa',
        label: COMPANY_DOC_LABELS.licencja_krajowa,
        expiresAt: new Date(Date.now() + 86400000 * 365).toISOString().slice(0, 10),
      },
    ])
  }

  function updateDocument(index: number, patch: Partial<CompanyDocument>) {
    const next = documents.map((d, i) => (i === index ? { ...d, ...patch } : d))
    persist(next)
  }

  function removeDocument(index: number) {
    persist(documents.filter((_, i) => i !== index))
  }

  const scopeLabel =
    settings.transportScope === 'both'
      ? 'Kraj + międzynarodowy'
      : settings.transportScope === 'international'
        ? 'Międzynarodowy'
        : 'Krajowy'

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Ustawienia firmy</h1>
        <p className="text-sm text-muted-foreground">
          Licencje, CKZ i dokumenty wymagane przy kontroli ITD / za granicą
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            {tenant.name}
          </CardTitle>
          <CardDescription>Kod firmy: {tenant.slug}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <InfoRow label="Plan" value={tenant.plan} />
            <InfoRow label="Status" value={tenant.status} />
            <InfoRow label="Zakres transportu" value={scopeLabel} />
            <InfoRow label="Waluta" value={settings.currency} />
            <InfoRow label="Strefa czasowa" value={settings.timezone} />
            <InfoRow label="Tenant ID" value={tenant.id} />
          </div>

          <div className="pt-2">
            <p className="mb-2 font-medium text-foreground">Aktywne moduły (abonament)</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(settings.modules).map(([key, enabled]) => (
                <span
                  key={key}
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    enabled ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {key}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Dokumenty firmy</CardTitle>
            <CardDescription>
              Licencja wspólnotowa, CKZ, zezwolenie przewoźnika — alerty w module Zgodność
            </CardDescription>
          </div>
          <Button size="sm" className="gap-1" onClick={addDocument}>
            <Plus className="h-4 w-4" />
            Dodaj
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak dokumentów — dodaj licencję i CKZ.</p>
          ) : (
            documents.map((doc, index) => {
              const status = expiryStatus(doc.expiresAt)
              return (
                <div
                  key={`${doc.type}-${index}`}
                  className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto_auto]"
                >
                  <div className="space-y-1">
                    <Label>Typ</Label>
                    <Select
                      value={doc.type}
                      onChange={(e) => {
                        const type = e.target.value as CompanyDocumentType
                        updateDocument(index, {
                          type,
                          label: COMPANY_DOC_LABELS[type],
                        })
                      }}
                    >
                      {Object.entries(COMPANY_DOC_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Opis</Label>
                    <Input
                      value={doc.label}
                      onChange={(e) => updateDocument(index, { label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Ważny do</Label>
                    <Input
                      type="date"
                      value={doc.expiresAt.slice(0, 10)}
                      onChange={(e) => updateDocument(index, { expiresAt: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-xs font-medium',
                        EXPIRY_STATUS_COLORS[status],
                      )}
                    >
                      {formatExpiryDate(doc.expiresAt)}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => removeDocument(index)}>
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mechanicy i weryfikacja awarii</CardTitle>
          <CardDescription>
            Właściciel zawsze może weryfikować. Wyznaczeni weryfikatorzy — ID użytkowników (np. user-dispatcher-demo).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Weryfikatorzy (ID, po przecinku)</Label>
            <Input value={verifierIds} onChange={(e) => setVerifierIds(e.target.value)} />
            <Button size="sm" variant="secondary" onClick={saveVerifiers}>
              Zapisz weryfikatorów
            </Button>
          </div>
          {mechanics.map((m, index) => (
            <div key={m.id} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
              <Input
                value={m.name}
                onChange={(e) => updateMechanic(index, { name: e.target.value })}
                placeholder="Imię i nazwisko"
              />
              <Input
                value={m.phone}
                onChange={(e) => updateMechanic(index, { phone: e.target.value })}
                placeholder="Telefon"
              />
              <Input
                className="sm:col-span-2"
                value={m.workshop ?? ''}
                onChange={(e) => updateMechanic(index, { workshop: e.target.value })}
                placeholder="Warsztat / adres"
              />
            </div>
          ))}
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              persistMechanics([
                ...mechanics,
                {
                  id: crypto.randomUUID(),
                  name: '',
                  phone: '',
                  active: true,
                  updatedAt: new Date().toISOString(),
                },
              ])
            }
          >
            Dodaj mechanika
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
