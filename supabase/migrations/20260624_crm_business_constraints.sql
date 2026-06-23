-- =============================================================================
-- Plan 04 — CRM Business Constraints Migration
-- =============================================================================
-- Enforces business rules at the DB level so they cannot be bypassed by
-- application code, direct SQL, or future integrations.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1.1  Pipeline valid transitions trigger
-- ---------------------------------------------------------------------------
-- Allowed: lead→contacted|lost, contacted→offer_sent|lost, offer_sent→won|lost
-- Terminal: won and lost — no transitions out.
-- Same-stage update is a no-op (allowed).

CREATE OR REPLACE FUNCTION enforce_deal_stage_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Same stage is always OK (no-op update on other columns).
  IF OLD.stage = NEW.stage THEN
    RETURN NEW;
  END IF;

  IF NOT (
    (OLD.stage = 'lead'       AND NEW.stage IN ('contacted', 'lost')) OR
    (OLD.stage = 'contacted'  AND NEW.stage IN ('offer_sent', 'lost')) OR
    (OLD.stage = 'offer_sent' AND NEW.stage IN ('won', 'lost'))
  ) THEN
    RAISE EXCEPTION 'Tranziție invalidă: % → %', OLD.stage, NEW.stage;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_deal_stage_transition ON deals;
CREATE TRIGGER trg_deal_stage_transition
  BEFORE UPDATE OF stage ON deals
  FOR EACH ROW
  EXECUTE FUNCTION enforce_deal_stage_transition();

-- ---------------------------------------------------------------------------
-- 1.2  Mandatory lost_reason when stage = 'lost'
-- ---------------------------------------------------------------------------

ALTER TABLE deals
  DROP CONSTRAINT IF EXISTS chk_lost_reason;

ALTER TABLE deals
  ADD CONSTRAINT chk_lost_reason
  CHECK (stage <> 'lost' OR (lost_reason IS NOT NULL AND lost_reason <> ''));

-- ---------------------------------------------------------------------------
-- 1.3  Auto-update deals.last_activity_at when an activity is created
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER: the inserting user may not own the deal, but the trigger
-- only touches last_activity_at (a non-security-sensitive timestamp).

CREATE OR REPLACE FUNCTION update_deal_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deal_id IS NOT NULL THEN
    UPDATE deals
      SET last_activity_at = GREATEST(last_activity_at, NEW.occurred_at)
      WHERE id = NEW.deal_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_activity_updates_deal ON activities;
CREATE TRIGGER trg_activity_updates_deal
  AFTER INSERT ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_deal_last_activity();

-- ---------------------------------------------------------------------------
-- 1.4  Auto-insert deal_stage_history on stage change
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER: needs to INSERT into deal_stage_history regardless of
-- the caller's RLS permissions on that table.

CREATE OR REPLACE FUNCTION log_deal_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO deal_stage_history (tenant_id, deal_id, from_stage, to_stage, changed_by, changed_at)
    VALUES (NEW.tenant_id, NEW.id, OLD.stage, NEW.stage, auth.uid(), now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_deal_stage_history ON deals;
CREATE TRIGGER trg_deal_stage_history
  AFTER UPDATE OF stage ON deals
  FOR EACH ROW
  EXECUTE FUNCTION log_deal_stage_change();

-- ---------------------------------------------------------------------------
-- 1.5  Auto-touch updated_at on clients and deals
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clients_updated_at ON clients;
CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_deals_updated_at ON deals;
CREATE TRIGGER trg_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- 1.6  Contact tenant_id auto-population from parent client
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_contact_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  SELECT tenant_id INTO NEW.tenant_id
    FROM clients
    WHERE id = NEW.client_id;

  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'Client % not found — cannot resolve tenant_id', NEW.client_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contact_tenant_id ON contacts;
CREATE TRIGGER trg_contact_tenant_id
  BEFORE INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION set_contact_tenant_id();

-- ---------------------------------------------------------------------------
-- 1.7  FK cascade / restrict rules
-- ---------------------------------------------------------------------------
-- Deal deletion → CASCADE to activities and deal_stage_history
-- Client deletion → RESTRICT if child records exist

-- activities.deal_id → CASCADE
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_deal_id_fkey;
ALTER TABLE activities
  ADD CONSTRAINT activities_deal_id_fkey
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE;

-- deal_stage_history.deal_id → CASCADE
ALTER TABLE deal_stage_history DROP CONSTRAINT IF EXISTS deal_stage_history_deal_id_fkey;
ALTER TABLE deal_stage_history
  ADD CONSTRAINT deal_stage_history_deal_id_fkey
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE;

-- deals.client_id → RESTRICT
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_client_id_fkey;
ALTER TABLE deals
  ADD CONSTRAINT deals_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

-- contacts.client_id → RESTRICT
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_client_id_fkey;
ALTER TABLE contacts
  ADD CONSTRAINT contacts_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

-- activities.client_id → RESTRICT
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_client_id_fkey;
ALTER TABLE activities
  ADD CONSTRAINT activities_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

-- ---------------------------------------------------------------------------
-- 1.8  Safe default values
-- ---------------------------------------------------------------------------

ALTER TABLE deals ALTER COLUMN last_activity_at SET DEFAULT now();
ALTER TABLE deals ALTER COLUMN value_ron SET DEFAULT 0;
ALTER TABLE deals ALTER COLUMN stage SET DEFAULT 'lead';
