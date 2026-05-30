import { ItdHotspotsMap } from '@/app/components/itd/ItdHotspotsMap'
import { useFilePreview } from '@/app/components/file-preview/FilePreviewProvider'
import { Button } from '@/app/components/ui/Button'
import { FileUploadField } from '@/app/components/ui/FileUploadField'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { Input, Label, Select } from '@/app/components/ui/Input'
import { defaultItdPlaybook } from '@/lib/domain/itd-playbook-default'
import {
  acknowledgeItdAlert,
  activeItdAlerts,
  addItdControlRecord,
  loadItdAlerts,
  loadItdHotspots,
  loadItdPlaybook,
  loadItdRecords,
  moderateItdHotspot,
  saveItdPlaybook,
  seedItdData,
  updatePlaybookSection,
} from '@/lib/domain/itd-store'
import { ITD_OUTCOME_LABELS, type ItdControlOutcome, type ItdControlRecord, type ItdHotspot, type ItdPlaybookSection } from '@/lib/domain/itd-types'
import { loadTenantFiles, storedToPreviewable } from '@/lib/files/files-store'
import { cn } from '@/lib/utils'
import { useCloudSyncRefresh } from '@/lib/sync/useCloudSyncRefresh'
import { AlertTriangle, BookOpen, Check, FileText, MapPin, ShieldAlert } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

type Tab = 'alerts' | 'records' | 'map' | 'playbook'

interface ItdAdminViewProps {
  tenantId: string
  userRole: 'owner' | 'dispatcher'
  userName: string
}

export function ItdAdminView({ tenantId, userRole, userName }: ItdAdminViewProps) {
  const [tab, setTab] = useState<Tab>('alerts')
  const [alerts, setAlerts] = useState(loadItdAlerts(tenantId))
  const [records, setRecords] = useState(loadItdRecords(tenantId))
  const [hotspots, setHotspots] = useState(loadItdHotspots(tenantId))
  const [playbook, setPlaybook] = useState<ItdPlaybookSection[]>([])
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')

  const refresh = useCallback(() => {
    seedItdData(tenantId)
    setAlerts(loadItdAlerts(tenantId))
    setRecords(loadItdRecords(tenantId))
    setHotspots(loadItdHotspots(tenantId, 'admin'))
    setPlaybook(loadItdPlaybook(tenantId))
  }, [tenantId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useCloudSyncRefresh(tenantId, 'itd', refresh)

  const active = activeItdAlerts(tenantId)

  function startEdit(section: ItdPlaybookSection) {
    if (userRole === 'dispatcher' && section.kind !== 'company') return
    setEditingSection(section.id)
    setEditDraft(section.items.join('\n'))
  }

  function saveEdit(sectionId: string) {
    const items = editDraft.split('\n').map((s) => s.trim()).filter(Boolean)
    if (updatePlaybookSection(tenantId, sectionId, { items }, userRole)) {
      refresh()
      setEditingSection(null)
    }
  }

  return (
    <div className="space-y-4">
      {active.length > 0 && (
        <Card className="border-danger/40 bg-danger/5">
          <CardContent className="flex items-center gap-3 p-4">
            <ShieldAlert className="h-6 w-6 shrink-0 text-danger" />
            <div>
              <p className="font-semibold text-danger">
                {active.length} aktywnych alertów ITD od kierowców
              </p>
              <p className="text-sm text-muted-foreground">Sprawdź zakładkę Alerty natychmiast.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['alerts', 'Alerty', AlertTriangle],
            ['records', 'Wyniki kontroli', FileText],
            ['map', 'Mapa ITD', MapPin],
            ['playbook', 'Instrukcja kierowcy', BookOpen],
          ] as const
        ).map(([id, label, Icon]) => (
          <Button
            key={id}
            variant={tab === id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab(id)}
          >
            <Icon className="mr-1 h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      {tab === 'alerts' && (
        <div className="space-y-3">
          {alerts.map((a) => (
            <Card key={a.id} className={a.status === 'active' ? 'border-danger/30' : ''}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{a.driverName}</p>
                    <p className="text-sm">{a.locationLabel}{a.road ? ` · ${a.road}` : ''}</p>
                    {a.message && <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleString('pl-PL')} · {a.status}
                    </p>
                  </div>
                  {a.status === 'active' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        acknowledgeItdAlert(tenantId, a.id, userName)
                        refresh()
                      }}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Przyjąłem
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {alerts.length === 0 && (
            <p className="text-sm text-muted-foreground">Brak alertów ITD.</p>
          )}
        </div>
      )}

      {tab === 'records' && (
        <div className="space-y-4">
          <ItdRecordForm tenantId={tenantId} onSaved={refresh} />
          {records.map((r) => (
            <ItdRecordRow key={r.id} tenantId={tenantId} record={r} />
          ))}
        </div>
      )}

      {tab === 'map' && (
        <Card>
          <CardHeader>
            <CardTitle>Mapa punktów kontroli ITD</CardTitle>
            <CardDescription>
              Stałe lokalizacje (wagi, A1/A2/A4, granice) + zgłoszenia kierowców na żywo (4 h)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ItdHotspotsMap hotspots={hotspots} onRefresh={refresh} />
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Moderacja zgłoszeń kierowców</p>
              {hotspots
                .filter((h) => h.source !== 'curated')
                .map((h) => (
                  <HotspotModerationRow
                    key={h.id}
                    hotspot={h}
                    onConfirm={() => {
                      moderateItdHotspot(tenantId, h.id, 'confirm', userName)
                      refresh()
                    }}
                    onDismiss={() => {
                      moderateItdHotspot(tenantId, h.id, 'dismiss', userName)
                      refresh()
                    }}
                  />
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'playbook' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {userRole === 'owner'
              ? 'Pełna edycja instrukcji — sekcje prawne i firmowe.'
              : 'Dyspozytor edytuje tylko sekcje firmowe (kontakt, procedury wewnętrzne).'}
          </p>
          {playbook.map((section) => {
            const canEdit = userRole === 'owner' || section.kind === 'company'
            return (
              <Card key={section.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {section.title}
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-normal uppercase',
                        section.kind === 'legal'
                          ? 'bg-primary/10 text-primary'
                          : section.kind === 'company'
                            ? 'bg-success/10 text-success'
                            : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {section.kind}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editingSection === section.id ? (
                    <div className="space-y-2">
                      <textarea
                        className="min-h-[120px] w-full rounded-lg border border-border bg-background p-3 text-sm"
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(section.id)}>
                          Zapisz
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingSection(null)}>
                          Anuluj
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                        {section.items.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => startEdit(section)}
                        >
                          Edytuj
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
          {userRole === 'owner' && (
            <Button
              variant="outline"
              onClick={() => {
                saveItdPlaybook(tenantId, defaultItdPlaybook())
                refresh()
              }}
            >
              Przywróć domyślną treść prawną
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function ItdRecordForm({ tenantId, onSaved }: { tenantId: string; onSaved: () => void }) {
  const [driverName, setDriverName] = useState('')
  const [vehicleRegistration, setVehicleRegistration] = useState('')
  const [locationLabel, setLocationLabel] = useState('')
  const [outcome, setOutcome] = useState<ItdControlOutcome>('clean')
  const [finePln, setFinePln] = useState('')
  const [protocolNumber, setProtocolNumber] = useState('')
  const [attachmentName, setAttachmentName] = useState('')
  const [attachmentFileId, setAttachmentFileId] = useState<string | undefined>()
  const [notes, setNotes] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    addItdControlRecord(tenantId, {
      tenantId,
      driverName,
      vehicleRegistration,
      controlDate: new Date().toISOString().slice(0, 10),
      locationLabel,
      outcome,
      finePln: finePln ? Number(finePln) : undefined,
      protocolNumber: protocolNumber || undefined,
      attachmentName: attachmentName || undefined,
      attachmentFileId,
      notes: notes || undefined,
    })
    onSaved()
    setDriverName('')
    setVehicleRegistration('')
    setLocationLabel('')
    setFinePln('')
    setProtocolNumber('')
    setAttachmentName('')
    setAttachmentFileId(undefined)
    setNotes('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dodaj wynik kontroli</CardTitle>
        <CardDescription>Protokół, mandat — PDF lub zdjęcie (max 512 KB)</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Kierowca</Label>
            <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} required />
          </div>
          <div>
            <Label>Rejestracja</Label>
            <Input
              value={vehicleRegistration}
              onChange={(e) => setVehicleRegistration(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Miejsce kontroli</Label>
            <Input value={locationLabel} onChange={(e) => setLocationLabel(e.target.value)} required />
          </div>
          <div>
            <Label>Wynik</Label>
            <Select value={outcome} onChange={(e) => setOutcome(e.target.value as ItdControlOutcome)}>
              {Object.entries(ITD_OUTCOME_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Kara PLN (opcj.)</Label>
            <Input type="number" value={finePln} onChange={(e) => setFinePln(e.target.value)} />
          </div>
          <div>
            <Label>Nr protokołu</Label>
            <Input value={protocolNumber} onChange={(e) => setProtocolNumber(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Skan protokołu / mandatu</Label>
            <FileUploadField
              tenantId={tenantId}
              tags={['itd', 'protocol']}
              label="Dodaj PDF lub zdjęcie"
              onUploaded={(id, name) => {
                setAttachmentFileId(id)
                setAttachmentName(name)
              }}
              onClear={() => {
                setAttachmentFileId(undefined)
                setAttachmentName('')
              }}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Notatki</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button type="submit" className="sm:col-span-2">
            Zapisz wynik
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ItdRecordRow({ tenantId, record }: { tenantId: string; record: ItdControlRecord }) {
  const { openPreview } = useFilePreview()
  return (
    <Card>
      <CardContent className="p-4 text-sm">
        <p className="font-semibold">
          {record.driverName} · {record.vehicleRegistration} · {record.controlDate}
        </p>
        <p>{record.locationLabel}</p>
        <p className="mt-1">
          Wynik: <strong>{ITD_OUTCOME_LABELS[record.outcome]}</strong>
          {record.finePln ? ` · ${record.finePln} PLN` : ''}
        </p>
        {record.protocolNumber && <p>Nr protokołu: {record.protocolNumber}</p>}
        {record.attachmentName && (
          <p className="flex flex-wrap items-center gap-2">
            Załącznik: {record.attachmentName}
            {record.attachmentFileId && (
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => {
                  const f = loadTenantFiles(tenantId).find((x) => x.id === record.attachmentFileId)
                  if (f) openPreview(storedToPreviewable(f))
                }}
              >
                Podgląd
              </Button>
            )}
          </p>
        )}
        {record.notes && <p className="text-muted-foreground">{record.notes}</p>}
      </CardContent>
    </Card>
  )
}

function HotspotModerationRow({
  hotspot,
  onConfirm,
  onDismiss,
}: {
  hotspot: ItdHotspot
  onConfirm: () => void
  onDismiss: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-2 text-sm">
      <div>
        <p className="font-medium">{hotspot.name}</p>
        <p className="text-xs text-muted-foreground">
          {hotspot.road} · {hotspot.moderation ?? 'pending'} ·{' '}
          {new Date(hotspot.reportedAt).toLocaleString('pl-PL')}
        </p>
      </div>
      {hotspot.moderation === 'pending' && (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={onConfirm}>
            Potwierdź
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Odrzuć
          </Button>
        </div>
      )}
    </div>
  )
}
