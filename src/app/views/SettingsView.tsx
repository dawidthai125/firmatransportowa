import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import type { Tenant } from '@/lib/tenant/types'
import { Settings } from 'lucide-react'

interface SettingsViewProps {
  tenant: Tenant
}

export function SettingsView({ tenant }: SettingsViewProps) {
  const { settings } = tenant

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Ustawienia firmy</h1>
        <p className="text-sm text-muted-foreground">Konfiguracja tenant — pod przyszły abonament SaaS</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            {tenant.name}
          </CardTitle>
          <CardDescription>Kod firmy: {tenant.slug}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <InfoRow label="Plan" value={tenant.plan} />
            <InfoRow label="Status" value={tenant.status} />
            <InfoRow label="Zakres transportu" value={settings.transportScope} />
            <InfoRow label="Waluta" value={settings.currency} />
            <InfoRow label="Strefa czasowa" value={settings.timezone} />
            <InfoRow label="Tenant ID" value={tenant.id} />
          </div>

          <div className="pt-2">
            <p className="mb-2 font-medium text-foreground">Aktywne moduły (abonament)</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(settings.modules).map(([key, enabled]) => (
                <span
                  key={key}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    enabled ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {key}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
