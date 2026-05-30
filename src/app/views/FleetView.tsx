import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { Truck } from 'lucide-react'

export function FleetView() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Flota pojazdów</h1>
        <p className="text-sm text-muted-foreground">Ciągniki, naczepy, przeglądy, serwisy</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Kartoteka floty
          </CardTitle>
          <CardDescription>Pojazdy przypisane do firmy (tenant)</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Dla każdego auta: rejestracja, VIN, typ naczepy, legalizacja tachografu, ubezpieczenie,
          harmonogram serwisów i alerty „za X dni przegląd”.
        </CardContent>
      </Card>
    </div>
  )
}
