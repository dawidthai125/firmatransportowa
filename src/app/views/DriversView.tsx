import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { Users } from 'lucide-react'

export function DriversView() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Kierowcy</h1>
        <p className="text-sm text-muted-foreground">Kartoteka, uprawnienia, czasy pracy</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Kartoteka kierowców
          </CardTitle>
          <CardDescription>Dane per firma — izolacja multi-tenant</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Prawo jazdy C/CE, kod 95, CPC, ADR, badania, przypisany pojazd, raporty dzienne i limity
          jazdy wg rozporządzenia 561/2006.
        </CardContent>
      </Card>
    </div>
  )
}
