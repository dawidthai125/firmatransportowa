import {
  DocumentBadges,
  EntityActions,
  EntityFormModal,
  Field,
  DocumentsEditor,
} from '@/app/components/EntityForm'
import { Button } from '@/app/components/ui/Button'
import { Card, CardContent } from '@/app/components/ui/Card'
import { Input, Select } from '@/app/components/ui/Input'
import type { Driver } from '@/lib/domain/driver'
import { createEmptyDriver, driverDisplayName } from '@/lib/domain/driver'
import {
  deleteDriver,
  loadDrivers,
  seedDemoDrivers,
  upsertDriver,
} from '@/lib/domain/drivers-store'
import { loadVehicles, seedDemoVehicles } from '@/lib/domain/vehicles-store'
import { EditConflictBanner } from '@/app/components/sync/EditConflictBanner'
import { useCloudSyncRefreshKeys } from '@/lib/sync/useCloudSyncRefresh'
import { useSyncedEditGuard } from '@/lib/sync/useSyncedEditGuard'
import { Plus, Shield, User, Phone } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface DriversViewProps {
  tenantId: string
  readOnly?: boolean
}

export function DriversView({ tenantId, readOnly = false }: DriversViewProps) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<{ id: string; registration: string }[]>([])
  const [editing, setEditing] = useState<Driver | null>(null)
  const [isNew, setIsNew] = useState(false)

  const refresh = useCallback(() => {
    seedDemoDrivers(tenantId)
    seedDemoVehicles(tenantId)
    setDrivers(loadDrivers(tenantId))
    setVehicles(loadVehicles(tenantId).map((v) => ({ id: v.id, registration: v.registration })))
  }, [tenantId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useCloudSyncRefreshKeys(tenantId, ['drivers', 'vehicles'], refresh)

  const { conflict, reloadFromStore, guardSave } = useSyncedEditGuard(
    tenantId,
    'drivers',
    editing,
    setEditing,
    isNew,
    'Ten kierowca',
  )

  function saveDriver(force = false) {
    if (!editing) return
    if (!force && !guardSave()) return
    setDrivers(upsertDriver(tenantId, { ...editing, updatedAt: new Date().toISOString() }))
    setEditing(null)
    setIsNew(false)
  }

  function handleSave() {
    saveDriver(false)
  }

  function openNew() {
    const base = createEmptyDriver(tenantId)
    const now = new Date().toISOString()
    setEditing({ ...base, id: crypto.randomUUID(), createdAt: now, updatedAt: now })
    setIsNew(true)
  }

  function handleDelete(id: string) {
    if (!confirm('Usunąć kierowcę?')) return
    setDrivers(deleteDriver(tenantId, id))
  }

  const activeCount = drivers.filter((d) => d.active).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Kierowcy</h1>
          <p className="text-sm text-muted-foreground">
            {drivers.length} w kartotece · {activeCount} aktywnych
          </p>
        </div>
        {!readOnly && (
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Dodaj kierowcę
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {drivers.map((driver) => {
          const vehicle = vehicles.find((v) => v.id === driver.vehicleId)
          return (
            <Card key={driver.id}>
              <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{driverDisplayName(driver)}</span>
                    <span className="text-xs text-muted-foreground">{driver.licenseCategory}</span>
                    {driver.adrCertified && (
                      <span className="rounded-full bg-danger/15 px-2 py-0.5 text-xs font-medium text-danger">
                        ADR
                      </span>
                    )}
                    {!driver.active && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Nieaktywny
                      </span>
                    )}
                  </div>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {driver.phone}
                  </p>
                  {vehicle && (
                    <p className="text-xs text-muted-foreground">Pojazd: {vehicle.registration}</p>
                  )}
                  <DocumentBadges documents={driver.documents} />
                </div>
                <EntityActions
                  readOnly={readOnly}
                  onEdit={() => {
                    setEditing({ ...driver })
                    setIsNew(false)
                  }}
                  onDelete={() => handleDelete(driver.id)}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {editing && (
        <EntityFormModal
          title={isNew ? 'Nowy kierowca' : 'Edycja kierowcy'}
          onClose={() => {
            setEditing(null)
            setIsNew(false)
          }}
          onSave={handleSave}
          saveDisabled={conflict}
          conflictBanner={
            conflict ? (
              <EditConflictBanner
                onReload={() => reloadFromStore(() => loadDrivers(tenantId))}
                onForceSave={() => saveDriver(true)}
              />
            ) : undefined
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Imię">
              <Input value={editing.firstName} onChange={(e) => setEditing({ ...editing, firstName: e.target.value })} />
            </Field>
            <Field label="Nazwisko">
              <Input value={editing.lastName} onChange={(e) => setEditing({ ...editing, lastName: e.target.value })} />
            </Field>
          </div>
          <Field label="Telefon">
            <Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
          </Field>
          <Field label="Kategoria prawa jazdy">
            <Input
              value={editing.licenseCategory}
              onChange={(e) => setEditing({ ...editing, licenseCategory: e.target.value })}
              placeholder="C+E"
            />
          </Field>
          <Field label="Przypisany pojazd">
            <Select
              value={editing.vehicleId ?? ''}
              onChange={(e) => setEditing({ ...editing, vehicleId: e.target.value || undefined })}
            >
              <option value="">— brak —</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registration}
                </option>
              ))}
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editing.adrCertified}
              onChange={(e) => setEditing({ ...editing, adrCertified: e.target.checked })}
              className="h-4 w-4"
            />
            <Shield className="h-4 w-4 text-danger" />
            Certyfikat ADR
          </label>
          <label className="flex items-center gap-2 text-sm">
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
