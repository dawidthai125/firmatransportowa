import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { ShieldCheck } from 'lucide-react'

export function ComplianceView() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Zgodność i dokumenty</h1>
        <p className="text-sm text-muted-foreground">Uprawnienia, ADR, tachograf, terminy</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-success" />
            Compliance hub
          </CardTitle>
          <CardDescription>Centralne alerty dla właściciela firmy</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Wygasające dokumenty kierowców i pojazdów, ADR, legalizacja tachografu, polisy OC/AC.
          Docelowo import plików DDD z tachografu cyfrowego.
        </CardContent>
      </Card>
    </div>
  )
}
