-- TransFlow v0.10 — Auth: tenant_members + RLS
-- Uruchom: supabase db push lub SQL Editor

CREATE TABLE IF NOT EXISTS public.tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'dispatcher', 'driver', 'mechanic')),
  display_name TEXT NOT NULL,
  mechanic_id TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

CREATE UNIQUE INDEX IF NOT EXISTS tenant_members_user_tenant_idx
  ON public.tenant_members (user_id, tenant_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS tenant_members_user_id_idx ON public.tenant_members (user_id);
CREATE INDEX IF NOT EXISTS tenant_members_tenant_id_idx ON public.tenant_members (tenant_id);

ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_members_select_own"
  ON public.tenant_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "tenant_members_service_role"
  ON public.tenant_members
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

INSERT INTO public.tenant_members (tenant_id, email, role, display_name, mechanic_id)
VALUES
  ('tenant-demo-001', 'wlasciciel@tajski-trans.pl', 'owner', 'Jan Tajski', NULL),
  ('tenant-demo-001', 'dyspozytor@tajski-trans.pl', 'dispatcher', 'Anna Dyspozytor', NULL),
  ('tenant-demo-001', 'jan.kowalski@tajski-trans.pl', 'driver', 'Jan Kowalski', NULL),
  ('tenant-demo-001', 'mechanik@tajski-trans.pl', 'mechanic', 'Tomasz Mechanik', 'mechanic-demo-001'),
  ('tenant-demo-001', 'wlasciciel@demo-trans.pl', 'owner', 'Jan Tajski', NULL),
  ('tenant-demo-001', 'dyspozytor@demo-trans.pl', 'dispatcher', 'Anna Dyspozytor', NULL),
  ('tenant-demo-001', 'jan.kowalski@demo-trans.pl', 'driver', 'Jan Kowalski', NULL),
  ('tenant-demo-001', 'mechanik@demo-trans.pl', 'mechanic', 'Tomasz Mechanik', 'mechanic-demo-001')
ON CONFLICT (tenant_id, email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.link_tenant_member_on_auth_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.tenant_members
  SET user_id = NEW.id, updated_at = now()
  WHERE lower(email) = lower(NEW.email) AND user_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_link_member ON auth.users;
CREATE TRIGGER on_auth_user_created_link_member
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_tenant_member_on_auth_insert();

CREATE OR REPLACE FUNCTION public.get_my_memberships()
RETURNS SETOF public.tenant_members
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.tenant_members
  WHERE user_id = auth.uid() AND active = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_memberships() TO authenticated;
