import { Button } from '@/app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { Label, Select } from '@/app/components/ui/Input'
import { driverDisplayName } from '@/lib/domain/driver'
import { loadDrivers, seedDemoDrivers } from '@/lib/domain/drivers-store'
import {
  connectorStatusLabel,
  loadTachographConnectorConfig,
  syncTachographConnectors,
} from '@/lib/domain/tachograph-connectors'
import {
  TACHOGRAPH_IMPORT_SOURCE_LABELS,
  TACHOGRAPH_RECORD_TYPE_LABELS,
} from '@/lib/domain/tachograph-parse'
import {
  deleteTachographDownload,
  importTachographFile,
  loadTachographDownloads,
  seedDemoTachographDownloads,
  updateTachographDownload,
} from '@/lib/domain/tachograph-store'
import type { TachographDownload } from '@/lib/domain/tachograph-types'
import { storePreviewableFile } from '@/lib/files/files-store'
import { fileFromInput } from '@/lib/files/download'
import { useCloudSyncRefreshKeys } from '@/lib/sync/useCloudSyncRefresh'
import { cn } from '@/lib/utils'
import {
  AlertCircle,
  Clock,
  CloudDownload,
  HardDriveDownload,
  RefreshCw,
  Trash2,
  Upload,
  User,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface TachographViewProps {
  tenantId: string
}

function formatMinutes(min?: number): string {
  if (min == null) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}h ${m}m`
}

export function TachographView({ tenantId }: TachographViewProps) {
  const [rows, setRows] = useState<TachographDownload[]>([])
  const [drivers, setDrivers] = useState(loadDrivers(tenantId))
  const [statusLabel, setStatusLabel] = useState(() => connectorStatusLabel(tenantId))
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(() => {
    seedDemoDrivers(tenantId)
    seedDemoTachographDownloads(tenantId)
    setRows(loadTachographDownloads(tenantId))
    setDrivers(loadDrivers(tenantId))
    setStatusLabel(connectorStatusLabel(tenantId))
  }, [tenantId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useCloudSyncRefreshKeys(tenantId, ['tachograph', 'tachograph-connectors'], refresh)

  const cfg = loadTachographConnectorConfig(tenantId)
  const anyConnector =
    cfg.tachoScanEnabled || cfg.vdoOnlineEnabled || cfg.telematicsFmsEnabled
  const connected = anyConnector && !cfg.lastSyncError && !!cfg.lastSyncAt

  async function onSync() {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const r = await syncTachographConnectors(tenantId)
      refresh()
      if (r.error) {
        setSyncMsg(r.error)
      } else {
        setSyncMsg(
          `Sync OK: +${r.added} nowych, ${r.updated} zaktualizowanych (${r.providers.join(', ') || 'brak'})`,
        )
      }
    } finally {
      setSyncing(false)
    }
  }

  async function onUpload(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    const previewable = await fileFromInput(file)
    const stored = await storePreviewableFile(tenantId, previewable, ['tachograph', 'ddd'])
    importTachographFile(tenantId, {
      filename: file.name,
      sizeBytes: file.size,
      fileId: stored.id,
    })
    refresh()
  }

  function assignDriver(id: string, driverId: string) {
    const driver = drivers.find((d) => d.id === driverId)
    updateTachographDownload(tenantId, id, {
      driverId: driverId || undefined,
      driverName: driver ? driverDisplayName(driver) : undefined,
    })
    refresh()
  }

  function removeRow(id: string) {
    if (!confirm('Usunąć wpis importu tachografu?')) return
    deleteTachographDownload(tenantId, id)
    refresh()
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Tachograf i czasy jazdy</h1>
        <p className="text-sm text-muted-foreground">
          Synchronizacja z TachoScan / VDO / telematyką oraz archiwum DDD do kontroli ITD (561/2006)
        </p>
      </div>

      <Card className={cn(connected ? 'border-success/30 bg-success/5' : 'border-border')}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            {connected ? (
              <Wifi className="h-4 w-4 text-success" />
            ) : anyConnector ? (
              <AlertCircle className="h-4 w-4 text-warning" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
            Połączenie z dostawcą
          </CardTitle>
          <CardDescription>{statusLabel}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Button size="sm" disabled={syncing || !anyConnector} onClick={() => void onSync()}>
            {syncing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CloudDownload className="mr-2 h-4 w-4" />
            )}
            Synchronizuj teraz
          </Button>
          {!anyConnector && (
            <p className="text-xs text-muted-foreground">
              Włącz TachoScan, VDO lub telematykę w Ustawieniach firmy.
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

      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
            <HardDriveDownload className="h-8 w-8" />
            <div>
              <p className="font-medium text-foreground">Brak odczytów</p>
              <p className="text-sm">
                Synchronizuj z API lub zaimportuj plik .ddd ręcznie (fallback).
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={row.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{row.filename}</CardTitle>
                    <CardDescription>
                      {TACHOGRAPH_IMPORT_SOURCE_LABELS[row.source]} ·{' '}
                      {TACHOGRAPH_RECORD_TYPE_LABELS[row.recordType]} ·{' '}
                      {new Date(row.importedAt).toLocaleString('pl-PL')}
                      {row.sizeBytes > 0 && ` · ${(row.sizeBytes / 1024).toFixed(0)} KB`}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeRow(row.id)}>
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {row.periodFrom && row.periodTo ? (
                    <span>
                      Okres: {row.periodFrom} — {row.periodTo}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Okres — nie rozpoznano</span>
                  )}
                </div>
                {(row.drivingMinutes != null || row.restMinutes != null) && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Jazda / odpoczynek: </span>
                    {formatMinutes(row.drivingMinutes)} / {formatMinutes(row.restMinutes)}
                  </div>
                )}
                {row.lastSyncAt && row.source !== 'manual_upload' && (
                  <p className="text-xs text-muted-foreground sm:col-span-2">
                    Ostatni sync: {new Date(row.lastSyncAt).toLocaleString('pl-PL')}
                  </p>
                )}
                {row.vehicleRegistration && (
                  <p className="text-sm text-muted-foreground">Pojazd: {row.vehicleRegistration}</p>
                )}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    Przypisz kierowcę
                  </Label>
                  <Select
                    value={row.driverId ?? ''}
                    onChange={(e) => assignDriver(row.id, e.target.value)}
                  >
                    <option value="">— wybierz —</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {driverDisplayName(d)}
                      </option>
                    ))}
                  </Select>
                </div>
                {row.notes && (
                  <p className={cn('text-xs text-muted-foreground sm:col-span-2')}>{row.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Import ręczny (.ddd)</CardTitle>
          <CardDescription>
            Fallback przy kontroli ITD, awarii telematyki lub braku połączenia API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept=".ddd"
            className="hidden"
            onChange={(e) => {
              void onUpload(e.target.files)
              e.target.value = ''
            }}
          />
          <Button type="button" variant="secondary" className="gap-2" onClick={() => inputRef.current?.click()}>
            <Upload className="h-4 w-4" />
            Importuj plik DDD
          </Button>
          <p className="text-xs text-muted-foreground">
            Plik trafia do biblioteki Pliki. Metadane z nazwy pliku — pełne dekodowanie DDD w produkcji
            (SDK / TachoScan).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
