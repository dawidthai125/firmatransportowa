import { Button } from '@/app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { Label, Select } from '@/app/components/ui/Input'
import { driverDisplayName } from '@/lib/domain/driver'
import { loadDrivers, seedDemoDrivers } from '@/lib/domain/drivers-store'
import { TACHOGRAPH_SOURCE_LABELS } from '@/lib/domain/tachograph-parse'
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
import { cn } from '@/lib/utils'
import { Clock, HardDriveDownload, Trash2, Upload, User } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface TachographViewProps {
  tenantId: string
}

export function TachographView({ tenantId }: TachographViewProps) {
  const [rows, setRows] = useState<TachographDownload[]>([])
  const [drivers, setDrivers] = useState(loadDrivers(tenantId))
  const inputRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(() => {
    seedDemoDrivers(tenantId)
    seedDemoTachographDownloads(tenantId)
    setRows(loadTachographDownloads(tenantId))
    setDrivers(loadDrivers(tenantId))
  }, [tenantId])

  useEffect(() => {
    refresh()
  }, [refresh])

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Import tachografu (DDD)</h1>
          <p className="text-sm text-muted-foreground">
            Odczyty karty kierowcy i urządzenia pojazdu — archiwum do kontroli ITD i 561/2006
          </p>
        </div>
        <>
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
          <Button type="button" className="gap-2" onClick={() => inputRef.current?.click()}>
            <Upload className="h-4 w-4" />
            Importuj plik DDD
          </Button>
        </>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Demo:</strong> plik zapisuje się w bibliotece Pliki.
            Metadane (kierowca, okres) są wyciągane z nazwy pliku — pełne dekodowanie DDD w wersji
            produkcyjnej (SDK / TachoScan).
          </p>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
            <HardDriveDownload className="h-8 w-8" />
            <div>
              <p className="font-medium text-foreground">Brak importów</p>
              <p className="text-sm">Pobierz plik .ddd z tachografu i zaimportuj tutaj.</p>
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
                      {TACHOGRAPH_SOURCE_LABELS[row.source]} ·{' '}
                      {new Date(row.importedAt).toLocaleString('pl-PL')} ·{' '}
                      {(row.sizeBytes / 1024).toFixed(0)} KB
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
                    <span className="text-muted-foreground">Okres — nie rozpoznano z nazwy pliku</span>
                  )}
                </div>
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
    </div>
  )
}
