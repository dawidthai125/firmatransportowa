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
import type { Vehicle, VehicleType } from '@/lib/domain/vehicle'
import { createEmptyVehicle, VEHICLE_TYPE_LABELS } from '@/lib/domain/vehicle'
import {
  deleteVehicle,
  loadVehicles,
  seedDemoVehicles,
  upsertVehicle,
} from '@/lib/domain/vehicles-store'
import { AlertTriangle, Gauge, Plus, Truck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface FleetViewProps {
  tenantId: string
  readOnly?: boolean
}

export function FleetView({ tenantId, readOnly = false }: FleetViewProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [isNew, setIsNew] = useState(false)

  const refresh = useCallback(() => {
    seedDemoVehicles(tenantId)
    setVehicles(loadVehicles(tenantId))
  }, [tenantId])

  useEffect(() => {
    refresh()
  }, [refresh])

  function openNew() {
    const base = createEmptyVehicle(tenantId)
    const now = new Date().toISOString()
    setEditing({ ...base, id: crypto.randomUUID(), createdAt: now, updatedAt: now })
    setIsNew(true)
  }

  function handleSave() {
    if (!editing) return
    setVehicles(upsertVehicle(tenantId, { ...editing, updatedAt: new Date().toISOString() }))
    setEditing(null)
    setIsNew(false)
  }

  function handleDelete(id: string) {
    if (!confirm('Usunąć pojazd?')) return
    setVehicles(deleteVehicle(tenantId, id))
  }

  const activeCount = vehicles.filter((v) => v.active).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Flota pojazdów</h1>
          <p className="text-sm text-muted-foreground">
            {vehicles.length} pojazdów · {activeCount} aktywnych
          </p>
        </div>
        {!readOnly && (
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Dodaj pojazd
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id}>
            <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{vehicle.registration}</span>
                  <span className="text-xs text-muted-foreground">{VEHICLE_TYPE_LABELS[vehicle.type]}</span>
                  {vehicle.adrEnabled && (
                    <span className="flex items-center gap-1 rounded-full bg-danger/15 px-2 py-0.5 text-xs font-medium text-danger">
                      <AlertTriangle className="h-3 w-3" />
                      ADR
                    </span>
                  )}
                </div>
                {(vehicle.brand || vehicle.model) && (
                  <p className="text-sm text-muted-foreground">
                    {[vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(' ')}
                  </p>
                )}
                {vehicle.odometerKm != null && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Gauge className="h-3.5 w-3.5" />
                    {vehicle.odometerKm.toLocaleString('pl-PL')} km
                  </p>
                )}
                <DocumentBadges documents={vehicle.documents} />
              </div>
              <EntityActions
                readOnly={readOnly}
                onEdit={() => {
                  setEditing({ ...vehicle })
                  setIsNew(false)
                }}
                onDelete={() => handleDelete(vehicle.id)}
              />
            </CardContent>
          </Card>
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
