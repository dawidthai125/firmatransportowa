import {
  EntityFormModal,
  Field,
  DocumentsEditor,
} from '@/app/components/EntityForm'
import { VehicleFleetCard } from '@/app/components/fleet/VehicleFleetCard'
import { Button } from '@/app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { Input, Select } from '@/app/components/ui/Input'
import {
  buildFleetVehicleSnapshots,
  staleGpsSnapshotsForAlerts,
} from '@/lib/domain/fleet-enrichment'
import type { FleetVehicleSnapshot } from '@/lib/domain/fleet-enrichment'
import {
  fleetTelematicsStatusLabel,
  loadFleetTelematicsConfig,
  syncFleetTelematics,
} from '@/lib/domain/fleet-telematics-connectors'
import { seedDemoFleetPositions } from '@/lib/domain/fleet-positions-store'
import type { Vehicle, VehicleType } from '@/lib/domain/vehicle'
import { createEmptyVehicle, VEHICLE_TYPE_LABELS } from '@/lib/domain/vehicle'
import {
  deleteVehicle,
  loadVehicles,
  seedDemoVehicles,
  upsertVehicle,
} from '@/lib/domain/vehicles-store'
import { useCloudSyncRefreshKeys } from '@/lib/sync/useCloudSyncRefresh'
import { EditConflictBanner } from '@/app/components/sync/EditConflictBanner'
import { useSyncedEditGuard } from '@/lib/sync/useSyncedEditGuard'
import { cn } from '@/lib/utils'
import { AlertTriangle, CloudDownload, MapPin, Plus, RefreshCw, Satellite } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface FleetViewProps {
  tenantId: string
  gpsEnabled?: boolean
  readOnly?: boolean
}

export function FleetView({ tenantId, gpsEnabled = true, readOnly = false }: FleetViewProps) {
  const [snapshots, setSnapshots] = useState<FleetVehicleSnapshot[]>([])
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [telematicsStatus, setTelematicsStatus] = useState(() => fleetTelematicsStatusLabel(tenantId))
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  const refresh = useCallback(() => {
    seedDemoVehicles(tenantId)
    seedDemoFleetPositions(tenantId)
    setSnapshots(buildFleetVehicleSnapshots(tenantId))
    setTelematicsStatus(fleetTelematicsStatusLabel(tenantId))
  }, [tenantId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useCloudSyncRefreshKeys(
    tenantId,
    ['fleet-positions', 'vehicles', 'courses', 'drivers', 'fleet-telematics-connectors'],
    refresh,
  )

  const { conflict, reloadFromStore, guardSave } = useSyncedEditGuard(
    tenantId,
    'vehicles',
    editing,
    setEditing,
    isNew,
    'Ten pojazd',
  )

  function openNew() {
    const base = createEmptyVehicle(tenantId)
    const now = new Date().toISOString()
    setEditing({ ...base, id: crypto.randomUUID(), createdAt: now, updatedAt: now })
    setIsNew(true)
  }

  async function onTelematicsSync() {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const r = await syncFleetTelematics(tenantId)
      refresh()
      setSyncMsg(
        r.error
          ? r.error
          : `Telematyka OK: ${r.updated} pozycji (${r.providers.join(', ') || 'brak'})`,
      )
    } finally {
      setSyncing(false)
    }
  }

  function saveVehicle(force = false) {
    if (!editing) return
    if (!force && !guardSave()) return
    upsertVehicle(tenantId, { ...editing, updatedAt: new Date().toISOString() })
    refresh()
    setEditing(null)
    setIsNew(false)
  }

  function handleSave() {
    saveVehicle(false)
  }

  function handleDelete(id: string) {
    if (!confirm('Usunąć pojazd?')) return
    deleteVehicle(tenantId, id)
    refresh()
  }

  const vehicles = loadVehicles(tenantId)
  const activeCount = vehicles.filter((v) => v.active).length
  const staleGps = gpsEnabled ? staleGpsSnapshotsForAlerts(tenantId) : []
  const withLiveGps = snapshots.filter((s) => s.gpsFreshness === 'live').length
  const telematicsCfg = loadFleetTelematicsConfig(tenantId)
  const telematicsOn =
    telematicsCfg.webfleetEnabled || telematicsCfg.transicsEnabled || telematicsCfg.genericEnabled

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Flota pojazdów</h1>
          <p className="text-sm text-muted-foreground">
            {vehicles.length} pojazdów · {activeCount} aktywnych
            {gpsEnabled && ` · ${withLiveGps} ze świeżym GPS`}
          </p>
        </div>
        {!readOnly && (
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Dodaj pojazd
          </Button>
        )}
      </div>

      {gpsEnabled && staleGps.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex flex-wrap items-start gap-2 p-4 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div>
              <p className="font-medium text-foreground">
                {staleGps.length} pojazdów bez świeżego GPS (&gt; 3 h)
              </p>
              <p className="text-muted-foreground">
                {staleGps.map((s) => s.vehicle.registration).join(', ')} — sprawdź telefon kierowcy
                (PWA) lub telematykę w aucie.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {gpsEnabled && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Satellite className="h-4 w-4 text-primary" />
              GPS / telematyka
            </CardTitle>
            <CardDescription>{telematicsStatus}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Źródła: telefon kierowcy (PWA), urządzenie w aucie (Webfleet, Transics) → klucz{' '}
              <code className="rounded bg-muted px-1">fleet-positions</code>. Każdy pojazd ma mapę
              z ostatnią pozycją poniżej.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={syncing || !telematicsOn} onClick={() => void onTelematicsSync()}>
                {syncing ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CloudDownload className="mr-2 h-4 w-4" />
                )}
                Synchronizuj telematykę
              </Button>
              <Button size="sm" variant="secondary" onClick={refresh}>
                <MapPin className="mr-2 h-4 w-4" />
                Odśwież pozycje
              </Button>
            </div>
            {!telematicsOn && (
              <p className="text-xs text-muted-foreground">
                Włącz Webfleet / Transics w Ustawieniach firmy, aby pobierać pozycje z ciężarówki.
              </p>
            )}
            {syncMsg && (
              <p
                className={cn(
                  'text-xs',
                  syncMsg.includes('Błąd') || syncMsg.includes('Włącz') || syncMsg.includes('error')
                    ? 'text-danger'
                    : 'text-success',
                )}
              >
                {syncMsg}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {snapshots.map((snapshot) => (
          <VehicleFleetCard
            key={snapshot.vehicle.id}
            snapshot={snapshot}
            readOnly={readOnly}
            onEdit={() => {
              setEditing({ ...snapshot.vehicle })
              setIsNew(false)
            }}
            onDelete={() => handleDelete(snapshot.vehicle.id)}
          />
        ))}
      </div>

      {editing && (
        <EntityFormModal
          title={isNew ? 'Nowy pojazd' : 'Edycja pojazdu'}
          onClose={() => {
            setEditing(null)
            setIsNew(false)
          }}
          onSave={handleSave}
          saveDisabled={conflict}
          conflictBanner={
            conflict ? (
              <EditConflictBanner
                onReload={() => reloadFromStore(() => loadVehicles(tenantId))}
                onForceSave={() => saveVehicle(true)}
              />
            ) : undefined
          }
        >
          <Field label="Numer rejestracyjny">
            <Input
              value={editing.registration}
              onChange={(e) => setEditing({ ...editing, registration: e.target.value.toUpperCase() })}
              placeholder="DW 12345"
            />
          </Field>
          <Field label="Typ">
            <Select
              value={editing.type}
              onChange={(e) => setEditing({ ...editing, type: e.target.value as VehicleType })}
            >
              {Object.entries(VEHICLE_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Marka">
              <Input value={editing.brand ?? ''} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} />
            </Field>
            <Field label="Model">
              <Input value={editing.model ?? ''} onChange={(e) => setEditing({ ...editing, model: e.target.value })} />
            </Field>
            <Field label="Rok">
              <Input
                type="number"
                value={editing.year ?? ''}
                onChange={(e) => setEditing({ ...editing, year: e.target.value ? Number(e.target.value) : undefined })}
              />
            </Field>
          </div>
          <Field label="Przebieg (km)">
            <Input
              type="number"
              value={editing.odometerKm ?? ''}
              onChange={(e) =>
                setEditing({ ...editing, odometerKm: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editing.adrEnabled}
              onChange={(e) => setEditing({ ...editing, adrEnabled: e.target.checked })}
              className="h-4 w-4"
            />
            Zezwolenie ADR na pojeździe
          </label>
          <label className={cn('flex items-center gap-2 text-sm')}>
            <input
              type="checkbox"
              checked={editing.active}
              onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
              className="h-4 w-4"
            />
            Aktywny
          </label>
          <DocumentsEditor
            documents={editing.documents}
            onChange={(documents) => setEditing({ ...editing, documents })}
          />
        </EntityFormModal>
      )}
    </div>
  )
}
