import { Button } from '@/app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { Input, Label, Select } from '@/app/components/ui/Input'
import {
  FREIGHT_BODY_LABELS,
  FREIGHT_SOURCE_LABELS,
  freightPriceDisplay,
  freightRouteLabel,
  type FreightBodyType,
  type FreightOffer,
  type FreightSource,
} from '@/lib/domain/freight-offer'
import { searchFreightOffers } from '@/lib/domain/freight-board-store'
import {
  loadFreightPreferences,
  saveFreightPreferences,
  toggleSavedOffer,
  type FreightSearchPreferences,
} from '@/lib/domain/freight-preferences'
import { cn } from '@/lib/utils'
import { Bookmark, BookmarkCheck, Filter, RefreshCw, Search, Star } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface FreightBoardViewProps {
  tenantId: string
}

const ALL_SOURCES = Object.keys(FREIGHT_SOURCE_LABELS) as FreightSource[]
const ALL_BODIES = Object.keys(FREIGHT_BODY_LABELS) as FreightBodyType[]

export function FreightBoardView({ tenantId }: FreightBoardViewProps) {
  const [query, setQuery] = useState('')
  const [offers, setOffers] = useState<FreightOffer[]>([])
  const [prefs, setPrefs] = useState<FreightSearchPreferences>(() => loadFreightPreferences(tenantId))
  const [showFilters, setShowFilters] = useState(true)
  const [savedOnly, setSavedOnly] = useState(false)

  const refresh = useCallback(() => {
    const { offers: found, prefs: p } = searchFreightOffers(tenantId, query)
    setOffers(found)
    setPrefs(p)
  }, [tenantId, query])

  useEffect(() => {
    refresh()
  }, [refresh])

  function updatePrefs(patch: Partial<FreightSearchPreferences>) {
    const next = { ...prefs, ...patch }
    saveFreightPreferences(tenantId, next)
    setPrefs(next)
    const { offers: found } = searchFreightOffers(tenantId, query)
    setOffers(found)
  }

  function toggleSource(source: FreightSource) {
    const set = new Set(prefs.sources)
    if (set.has(source)) set.delete(source)
    else set.add(source)
    updatePrefs({ sources: [...set] })
  }

  function toggleBody(body: FreightBodyType) {
    const set = new Set(prefs.bodyTypes)
    if (set.has(body)) set.delete(body)
    else set.add(body)
    updatePrefs({ bodyTypes: [...set] })
  }

  const visible = savedOnly
    ? offers.filter((o) => prefs.savedOfferIds.includes(o.id))
    : offers

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Agregacja ofert: Trans.eu, TimoCom, Teleroute, 123cargo, Transporeon, e-mail i sieć partnerska.
        Filtry odzwierciedlają typowe preferencje polskich firm TSL.
      </p>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Szukaj: miasto, trasa, ładunek, kontrahent…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => setShowFilters((s) => !s)}>
          <Filter className="mr-2 h-4 w-4" />
          Preferencje firmy
        </Button>
        <Button variant={savedOnly ? 'default' : 'outline'} onClick={() => setSavedOnly((s) => !s)}>
          <Bookmark className="mr-2 h-4 w-4" />
          Zapisane ({prefs.savedOfferIds.length})
        </Button>
        <Button variant="ghost" size="icon" onClick={refresh} aria-label="Odśwież">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Filtry pod Twoją flotę</CardTitle>
            <CardDescription>
              Nadwozie, stawka/km, płatność, ADR, kabotaż, kraj załadunku, baza operacyjna
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Baza (miasto)</Label>
              <Input
                value={prefs.homeBaseCity}
                onChange={(e) => updatePrefs({ homeBaseCity: e.target.value })}
              />
            </div>
            <div>
              <Label>Promień od bazy (km, 0 = wył.)</Label>
              <Input
                type="number"
                min={0}
                value={prefs.homeBaseRadiusKm}
                onChange={(e) => updatePrefs({ homeBaseRadiusKm: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Min. stawka PLN/km</Label>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={prefs.minRatePerKmPln}
                onChange={(e) => updatePrefs({ minRatePerKmPln: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Max termin płatności (dni)</Label>
              <Input
                type="number"
                min={0}
                value={prefs.maxPaymentDays}
                onChange={(e) => updatePrefs({ maxPaymentDays: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Min. ocena zleceniodawcy</Label>
              <Select
                value={String(prefs.minShipperRating)}
                onChange={(e) => updatePrefs({ minShipperRating: Number(e.target.value) })}
              >
                <option value="0">Bez filtra</option>
                <option value="3">≥ 3.0</option>
                <option value="4">≥ 4.0</option>
                <option value="4.5">≥ 4.5</option>
              </Select>
            </div>
            <div>
              <Label>Max waga (kg)</Label>
              <Input
                type="number"
                value={prefs.maxWeightKg}
                onChange={(e) => updatePrefs({ maxWeightKg: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-wrap items-end gap-3 sm:col-span-2 lg:col-span-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={prefs.excludeAdr}
                  onChange={(e) => updatePrefs({ excludeAdr: e.target.checked })}
                />
                Bez ADR
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={prefs.excludeCabotage}
                  onChange={(e) => updatePrefs({ excludeCabotage: e.target.checked })}
                />
                Wyklucz kabotaż
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={prefs.requireLift}
                  onChange={(e) => updatePrefs({ requireLift: e.target.checked })}
                />
                Tylko z windą/HDS
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={prefs.corridorEnabled}
                  onChange={(e) => updatePrefs({ corridorEnabled: e.target.checked })}
                />
                Koretarz trasy
              </label>
            </div>
            {prefs.corridorEnabled && (
              <>
                <div>
                  <Label>Koretarz — od</Label>
                  <Input
                    value={prefs.corridorFromCity}
                    onChange={(e) => updatePrefs({ corridorFromCity: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Koretarz — do</Label>
                  <Input
                    value={prefs.corridorToCity}
                    onChange={(e) => updatePrefs({ corridorToCity: e.target.value })}
                  />
                </div>
              </>
            )}
            <div className="sm:col-span-2 lg:col-span-3">
              <Label className="mb-2 block">Źródła ofert</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_SOURCES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSource(s)}
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-xs',
                      prefs.sources.includes(s)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground',
                    )}
                  >
                    {FREIGHT_SOURCE_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Label className="mb-2 block">Typ nadwozia</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_BODIES.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBody(b)}
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-xs',
                      prefs.bodyTypes.includes(b)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground',
                    )}
                  >
                    {FREIGHT_BODY_LABELS[b]}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-sm font-medium">
        {visible.length} ofert pasujących do preferencji
        {query ? ` · „${query}"` : ''}
      </p>

      <div className="space-y-3">
        {visible.map((o) => (
          <FreightOfferCard
            key={o.id}
            offer={o}
            saved={prefs.savedOfferIds.includes(o.id)}
            onToggleSave={() => {
              toggleSavedOffer(tenantId, o.id)
              refresh()
            }}
          />
        ))}
        {visible.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Brak ofert — poluzuj filtry lub włącz więcej źródeł.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function FreightOfferCard({
  offer,
  saved,
  onToggleSave,
}: {
  offer: FreightOffer
  saved: boolean
  onToggleSave: () => void
}) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
              {FREIGHT_SOURCE_LABELS[offer.source]}
            </span>
            <span className="text-xs text-muted-foreground">{offer.reference}</span>
            {offer.adr && (
              <span className="rounded-md bg-danger/15 px-2 py-0.5 text-xs text-danger">ADR</span>
            )}
            {offer.isCabotage && (
              <span className="rounded-md bg-warning/15 px-2 py-0.5 text-xs text-warning">
                Kabotaż
              </span>
            )}
          </div>
          <p className="mt-1 font-semibold">{freightRouteLabel(offer)}</p>
          <p className="text-sm text-muted-foreground">{offer.cargoDescription}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {offer.shipperName} · załadunek {offer.loadDate}
            {offer.distanceKm ? ` · ${offer.distanceKm} km` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-primary">{freightPriceDisplay(offer)}</p>
          {offer.ratePerKmPln != null && (
            <p className="text-xs text-muted-foreground">{offer.ratePerKmPln.toFixed(1)} PLN/km</p>
          )}
          {offer.shipperRating != null && (
            <p className="mt-1 flex items-center justify-end gap-1 text-xs">
              <Star className="h-3 w-3 fill-warning text-warning" />
              {offer.shipperRating.toFixed(1)}
            </p>
          )}
          <p className="text-xs text-muted-foreground">Płatność: {offer.paymentDays} dni</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={onToggleSave}>
            {saved ? (
              <>
                <BookmarkCheck className="mr-1 h-4 w-4" />
                Zapisano
              </>
            ) : (
              <>
                <Bookmark className="mr-1 h-4 w-4" />
                Zapisz
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
