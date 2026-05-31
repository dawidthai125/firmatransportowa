/** REST API fakturowania — Fakturownia.pl / wFirma */

export interface InvoicingLine {
  reference: string
  buyerName: string
  description: string
  netPln: number
  vatRate: number
  issueDate: string
  dueDate: string
}

export interface InvoicingSyncRequest {
  tenantId: string
  provider: 'fakturownia' | 'wfirma'
  testOnly?: boolean
  config: {
    fakturowniaSubdomain?: string
    fakturowniaApiToken?: string
    wfirmaApiToken?: string
    wfirmaCompanyId?: string
    sellerName?: string
    sellerNip?: string
  }
  lines: InvoicingLine[]
}

async function testFakturownia(subdomain: string, token: string): Promise<{ ok: boolean; message: string }> {
  const url = `https://${subdomain}.fakturownia.pl/invoices.json?period=this_month&page=1&api_token=${encodeURIComponent(token)}`
  const res = await fetch(url)
  if (res.ok) return { ok: true, message: 'Połączenie z Fakturownia OK' }
  return { ok: false, message: `Fakturownia HTTP ${res.status}` }
}

async function createFakturowniaInvoice(
  subdomain: string,
  token: string,
  line: InvoicingLine,
  sellerNip?: string,
): Promise<string> {
  const gross = line.netPln * (1 + line.vatRate / 100)
  const body = {
    api_token: token,
    invoice: {
      kind: 'vat',
      number: null,
      sell_date: line.issueDate,
      issue_date: line.issueDate,
      payment_to: line.dueDate,
      buyer_name: line.buyerName,
      seller_tax_no: sellerNip,
      positions: [
        {
          name: line.description,
          quantity: 1,
          total_price_gross: gross,
          tax: line.vatRate,
        },
      ],
      description: `Zlecenie ${line.reference}`,
    },
  }

  const res = await fetch(`https://${subdomain}.fakturownia.pl/invoices.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Fakturownia ${res.status}: ${errText.slice(0, 200)}`)
  }

  const json = await res.json()
  return String(json.id ?? json.number ?? line.reference)
}

async function createWfirmaInvoice(token: string, companyId: string, line: InvoicingLine): Promise<string> {
  const res = await fetch(`https://api2.wfirma.pl/invoices/add?company_id=${companyId}&inputFormat=json&outputFormat=json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      invoice: {
        type: 'normal',
        date: line.issueDate,
        paymentdate: line.dueDate,
        contractor: { name: line.buyerName },
        invoicecontents: [
          {
            name: line.description,
            count: 1,
            price: line.netPln,
            vat: line.vatRate,
          },
        ],
      },
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`wFirma ${res.status}: ${errText.slice(0, 200)}`)
  }

  const json = await res.json()
  return String(json?.invoice?.id ?? line.reference)
}

export async function runInvoicingSync(body: InvoicingSyncRequest) {
  const { provider, config, lines, testOnly } = body

  if (provider === 'fakturownia') {
    const subdomain = config.fakturowniaSubdomain ?? Deno.env.get('FAKTUROWNIA_SUBDOMAIN')
    const token = config.fakturowniaApiToken ?? Deno.env.get('FAKTUROWNIA_API_TOKEN')
    if (!subdomain || !token) {
      return { ok: false, created: 0, invoiceIds: [], mode: 'rest', errors: ['Brak subdomeny lub tokenu Fakturownia'] }
    }
    if (testOnly) {
      const t = await testFakturownia(subdomain, token)
      return { ok: t.ok, created: 0, invoiceIds: [], mode: 'rest', message: t.message }
    }

    const invoiceIds: string[] = []
    const errors: string[] = []
    for (const line of lines) {
      try {
        const id = await createFakturowniaInvoice(subdomain, token, line, config.sellerNip)
        invoiceIds.push(id)
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e))
      }
    }
    return {
      ok: invoiceIds.length > 0,
      created: invoiceIds.length,
      invoiceIds,
      mode: 'rest',
      errors: errors.length ? errors : undefined,
    }
  }

  if (provider === 'wfirma') {
    const token = config.wfirmaApiToken ?? Deno.env.get('WFIRMA_API_TOKEN')
    const companyId = config.wfirmaCompanyId ?? Deno.env.get('WFIRMA_COMPANY_ID')
    if (!token || !companyId) {
      return { ok: false, created: 0, invoiceIds: [], mode: 'rest', errors: ['Brak tokenu lub company_id wFirma'] }
    }
    if (testOnly) {
      return { ok: true, created: 0, invoiceIds: [], mode: 'rest', message: 'Konfiguracja wFirma — test połączenia (prod wymaga konta)' }
    }

    const invoiceIds: string[] = []
    const errors: string[] = []
    for (const line of lines) {
      try {
        const id = await createWfirmaInvoice(token, companyId, line)
        invoiceIds.push(id)
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e))
      }
    }
    return {
      ok: invoiceIds.length > 0,
      created: invoiceIds.length,
      invoiceIds,
      mode: 'rest',
      errors: errors.length ? errors : undefined,
    }
  }

  return { ok: false, created: 0, invoiceIds: [], mode: 'rest', errors: ['Nieznany provider'] }
}
