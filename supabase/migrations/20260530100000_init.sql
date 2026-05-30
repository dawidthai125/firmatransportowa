-- TransFlow: KV store + rejestr tenantów (SaaS multi-tenant)
-- Uruchom w Supabase SQL Editor lub: supabase db push

CREATE TABLE IF NOT EXISTS kv_store_transflow (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kv_store_transflow_key_prefix
  ON kv_store_transflow (key text_pattern_ops);

COMMENT ON TABLE kv_store_transflow IS 'TransFlow — dane per klucz (ft-{tenantId}-*, ft-tenants-registry)';

-- Opcjonalnie: audit ostatniej modyfikacji
CREATE OR REPLACE FUNCTION kv_store_transflow_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_kv_store_transflow_updated ON kv_store_transflow;
CREATE TRIGGER trg_kv_store_transflow_updated
  BEFORE UPDATE ON kv_store_transflow
  FOR EACH ROW EXECUTE FUNCTION kv_store_transflow_set_updated_at();

-- RLS: Edge Function używa service_role (omija RLS).
-- Gdy dodamy bezpośredni dostęp z klienta — włącz polityki per tenant_id.
ALTER TABLE kv_store_transflow ENABLE ROW LEVEL SECURITY;

-- Tylko service role (Edge Functions) — brak publicznego dostępu do tabeli z anon key
CREATE POLICY "service_role_only" ON kv_store_transflow
  FOR ALL
  USING (false)
  WITH CHECK (false);
