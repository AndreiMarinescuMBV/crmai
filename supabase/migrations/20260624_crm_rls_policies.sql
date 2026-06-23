-- =============================================================================
-- Plan 04 — CRM RLS Policies
-- =============================================================================
-- Uses get_managed_team_ids() SECURITY DEFINER helper to bypass RLS on
-- team_memberships when checking manager visibility.
-- =============================================================================

-- ============================= CLIENTS ======================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clients_select ON clients;
CREATE POLICY clients_select ON clients
  FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      OR owner_id = auth.uid()
      OR (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'manager'
        AND team_id IN (SELECT get_managed_team_ids(auth.uid()))
      )
    )
  );

DROP POLICY IF EXISTS clients_insert ON clients;
CREATE POLICY clients_insert ON clients
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND owner_id = auth.uid()
  );

DROP POLICY IF EXISTS clients_update ON clients;
CREATE POLICY clients_update ON clients
  FOR UPDATE USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      OR owner_id = auth.uid()
      OR (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'manager'
        AND team_id IN (SELECT get_managed_team_ids(auth.uid()))
      )
    )
  );

DROP POLICY IF EXISTS clients_delete ON clients;
CREATE POLICY clients_delete ON clients
  FOR DELETE USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND (
      owner_id = auth.uid()
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    )
  );

-- ============================= CONTACTS =====================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contacts_select ON contacts;
CREATE POLICY contacts_select ON contacts
  FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = contacts.client_id
        AND c.tenant_id = contacts.tenant_id
        AND (
          (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
          OR c.owner_id = auth.uid()
          OR (
            (auth.jwt() -> 'app_metadata' ->> 'role') = 'manager'
            AND c.team_id IN (SELECT get_managed_team_ids(auth.uid()))
          )
        )
    )
  );

DROP POLICY IF EXISTS contacts_insert ON contacts;
CREATE POLICY contacts_insert ON contacts
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = contacts.client_id
        AND c.tenant_id = contacts.tenant_id
        AND (
          (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
          OR c.owner_id = auth.uid()
          OR (
            (auth.jwt() -> 'app_metadata' ->> 'role') = 'manager'
            AND c.team_id IN (SELECT get_managed_team_ids(auth.uid()))
          )
        )
    )
  );

DROP POLICY IF EXISTS contacts_update ON contacts;
CREATE POLICY contacts_update ON contacts
  FOR UPDATE USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = contacts.client_id
        AND c.tenant_id = contacts.tenant_id
        AND (
          (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
          OR c.owner_id = auth.uid()
          OR (
            (auth.jwt() -> 'app_metadata' ->> 'role') = 'manager'
            AND c.team_id IN (SELECT get_managed_team_ids(auth.uid()))
          )
        )
    )
  );

DROP POLICY IF EXISTS contacts_delete ON contacts;
CREATE POLICY contacts_delete ON contacts
  FOR DELETE USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = contacts.client_id
        AND c.tenant_id = contacts.tenant_id
        AND (
          c.owner_id = auth.uid()
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        )
    )
  );

-- ============================= DEALS ========================================

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS deals_select ON deals;
CREATE POLICY deals_select ON deals
  FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      OR owner_id = auth.uid()
      OR (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'manager'
        AND team_id IN (SELECT get_managed_team_ids(auth.uid()))
      )
    )
  );

DROP POLICY IF EXISTS deals_insert ON deals;
CREATE POLICY deals_insert ON deals
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND owner_id = auth.uid()
  );

DROP POLICY IF EXISTS deals_update ON deals;
CREATE POLICY deals_update ON deals
  FOR UPDATE USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      OR owner_id = auth.uid()
      OR (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'manager'
        AND team_id IN (SELECT get_managed_team_ids(auth.uid()))
      )
    )
  );

DROP POLICY IF EXISTS deals_delete ON deals;
CREATE POLICY deals_delete ON deals
  FOR DELETE USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND (
      owner_id = auth.uid()
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    )
  );

-- ============================= ACTIVITIES ===================================

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS activities_select ON activities;
CREATE POLICY activities_select ON activities
  FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      OR owner_id = auth.uid()
      OR (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'manager'
        AND team_id IN (SELECT get_managed_team_ids(auth.uid()))
      )
    )
  );

DROP POLICY IF EXISTS activities_insert ON activities;
CREATE POLICY activities_insert ON activities
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND owner_id = auth.uid()
  );

DROP POLICY IF EXISTS activities_update ON activities;
CREATE POLICY activities_update ON activities
  FOR UPDATE USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      OR owner_id = auth.uid()
      OR (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'manager'
        AND team_id IN (SELECT get_managed_team_ids(auth.uid()))
      )
    )
  );

DROP POLICY IF EXISTS activities_delete ON activities;
CREATE POLICY activities_delete ON activities
  FOR DELETE USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND (
      owner_id = auth.uid()
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    )
  );

-- ============================= DEAL_STAGE_HISTORY ===========================

ALTER TABLE deal_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_stage_history FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS deal_stage_history_select ON deal_stage_history;
CREATE POLICY deal_stage_history_select ON deal_stage_history
  FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND EXISTS (
      SELECT 1 FROM deals d
      WHERE d.id = deal_stage_history.deal_id
        AND d.tenant_id = deal_stage_history.tenant_id
        AND (
          (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
          OR d.owner_id = auth.uid()
          OR (
            (auth.jwt() -> 'app_metadata' ->> 'role') = 'manager'
            AND d.team_id IN (SELECT get_managed_team_ids(auth.uid()))
          )
        )
    )
  );
