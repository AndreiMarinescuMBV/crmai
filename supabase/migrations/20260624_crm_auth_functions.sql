-- =============================================================================
-- Plan 03 — CRM Auth & RBAC RPC Functions
-- =============================================================================
-- This migration implements the missing database functions for user enrollment,
-- invitations, and role management.
-- =============================================================================

-- Enable pgcrypto for sha256 hashing of tokens and gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 0. Ensure enums have all required values
-- ---------------------------------------------------------------------------

-- app_role: admin, manager, agent
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'manager'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role'))
  THEN ALTER TYPE app_role ADD VALUE 'manager'; END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'agent'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role'))
  THEN ALTER TYPE app_role ADD VALUE 'agent'; END IF;
END $$;

-- deal_stage: lead, contacted, offer_sent, won, lost
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'contacted'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'deal_stage'))
  THEN ALTER TYPE deal_stage ADD VALUE 'contacted'; END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'offer_sent'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'deal_stage'))
  THEN ALTER TYPE deal_stage ADD VALUE 'offer_sent'; END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'won'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'deal_stage'))
  THEN ALTER TYPE deal_stage ADD VALUE 'won'; END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'lost'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'deal_stage'))
  THEN ALTER TYPE deal_stage ADD VALUE 'lost'; END IF;
END $$;

-- activity_type: call, meeting, note
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'call'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_type'))
  THEN ALTER TYPE activity_type ADD VALUE 'call'; END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'meeting'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_type'))
  THEN ALTER TYPE activity_type ADD VALUE 'meeting'; END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'note'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_type'))
  THEN ALTER TYPE activity_type ADD VALUE 'note'; END IF;
END $$;

-- team_role: manager, member
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'manager'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'team_role'))
  THEN ALTER TYPE team_role ADD VALUE 'manager'; END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'member'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'team_role'))
  THEN ALTER TYPE team_role ADD VALUE 'member'; END IF;
END $$;

-- invitation_status: pending, accepted, revoked, expired
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'invitation_status'))
  THEN ALTER TYPE invitation_status ADD VALUE 'pending'; END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'accepted'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'invitation_status'))
  THEN ALTER TYPE invitation_status ADD VALUE 'accepted'; END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'revoked'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'invitation_status'))
  THEN ALTER TYPE invitation_status ADD VALUE 'revoked'; END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'expired'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'invitation_status'))
  THEN ALTER TYPE invitation_status ADD VALUE 'expired'; END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 0a. Helper: get team IDs managed by a user (SECURITY DEFINER to bypass RLS)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_managed_team_ids(p_user_id uuid)
RETURNS SETOF uuid AS $$
  SELECT team_id FROM team_memberships
  WHERE user_id = p_user_id AND role_in_team = 'manager';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---------------------------------------------------------------------------
-- 0b. Add DEFAULT values to columns that are missing them
-- ---------------------------------------------------------------------------
ALTER TABLE tenants ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE tenants ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE profiles ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE teams ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE teams ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE team_memberships ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE team_memberships ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE invitations ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE invitations ALTER COLUMN expires_at SET DEFAULT (now() + interval '7 days');
ALTER TABLE invitations ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE invitations ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE clients ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE clients ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE clients ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE contacts ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE contacts ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE deals ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE deals ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE deals ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE activities ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE activities ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE activities ALTER COLUMN occurred_at SET DEFAULT now();
ALTER TABLE deal_stage_history ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE deal_stage_history ALTER COLUMN changed_at SET DEFAULT now();

-- ---------------------------------------------------------------------------
-- 1. bootstrap_tenant(p_tenant_name, p_full_name)
-- ---------------------------------------------------------------------------
-- Atomically creates a tenant, the admin profile for the current user,
-- a default 'General' team, and adds the user as manager of that team.
CREATE OR REPLACE FUNCTION bootstrap_tenant(
  p_tenant_name text,
  p_full_name text
) RETURNS void AS $$
DECLARE
  v_tenant_id uuid;
  v_team_id uuid;
  v_user_email text;
BEGIN
  -- Get current user email from auth.users
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'Utilizatorul nu este autentificat.';
  END IF;

  -- Ensure the user doesn't already have a profile
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Utilizatorul are deja un profil asociat.';
  END IF;

  -- Insert the new tenant
  INSERT INTO public.tenants (name)
  VALUES (p_tenant_name)
  RETURNING id INTO v_tenant_id;

  -- Insert the admin profile (role is 'admin', active by default)
  INSERT INTO public.profiles (id, tenant_id, email, full_name, role, is_active)
  VALUES (auth.uid(), v_tenant_id, v_user_email, p_full_name, 'admin'::app_role, true);

  -- Create a default team
  INSERT INTO public.teams (tenant_id, name)
  VALUES (v_tenant_id, 'General')
  RETURNING id INTO v_team_id;

  -- Add the creator to the team as a manager
  INSERT INTO public.team_memberships (tenant_id, team_id, user_id, role_in_team)
  VALUES (v_tenant_id, v_team_id, auth.uid(), 'manager'::team_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 2. accept_invitation(p_token)
-- ---------------------------------------------------------------------------
-- Accepts an invitation, updates its status, creates/updates the user's profile,
-- and optionally adds the user to the invited team.
CREATE OR REPLACE FUNCTION accept_invitation(p_token text)
RETURNS void AS $$
DECLARE
  v_token_hash text;
  v_invite record;
  v_user_email text;
  v_full_name text;
BEGIN
  -- Hash the provided raw token using sha256 to compare with the stored hash
  v_token_hash := encode(digest(p_token, 'sha256'), 'hex');

  -- Look up the pending, non-expired invitation
  SELECT * INTO v_invite
    FROM public.invitations
    WHERE token_hash = v_token_hash
      AND status = 'pending'
      AND expires_at > now()
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitație invalidă, expirată sau deja acceptată.';
  END IF;

  -- Get current user email from auth.users
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'Utilizatorul nu este autentificat.';
  END IF;

  -- Email case-insensitive matching security check
  IF lower(v_user_email) <> lower(v_invite.email) THEN
    RAISE EXCEPTION 'Această invitație este destinată altei adrese de email (% vs %).', v_invite.email, v_user_email;
  END IF;

  -- Mark the invitation as accepted
  UPDATE public.invitations
    SET status = 'accepted'
    WHERE id = v_invite.id;

  -- Fetch metadata name if provided during signup
  SELECT (raw_user_meta_data->>'full_name') INTO v_full_name
    FROM auth.users
    WHERE id = auth.uid();

  -- Create or update the user's profile
  INSERT INTO public.profiles (id, tenant_id, email, full_name, role, is_active)
  VALUES (auth.uid(), v_invite.tenant_id, v_invite.email, COALESCE(v_full_name, ''), v_invite.role, true)
  ON CONFLICT (id) DO UPDATE
  SET tenant_id = EXCLUDED.tenant_id,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      is_active = true;

  -- Add user to the team if the invitation was team-specific
  IF v_invite.team_id IS NOT NULL THEN
    INSERT INTO public.team_memberships (tenant_id, team_id, user_id, role_in_team)
    VALUES (v_invite.tenant_id, v_invite.team_id, auth.uid(), 'member'::team_role)
    ON CONFLICT (team_id, user_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 3. set_member_role(p_user_id, p_role)
-- ---------------------------------------------------------------------------
-- Changes a user's role in the organization. Restricts self-demotion
-- and protects the last active administrator constraint.
CREATE OR REPLACE FUNCTION set_member_role(
  p_user_id uuid,
  p_role app_role
) RETURNS void AS $$
DECLARE
  v_caller_tenant_id uuid;
  v_target_tenant_id uuid;
  v_target_current_role app_role;
  v_caller_role app_role;
  v_admin_count int;
BEGIN
  -- Get caller role and tenant from JWT claims
  v_caller_role := (auth.jwt() ->> 'role')::app_role;
  v_caller_tenant_id := (auth.jwt() ->> 'tenant_id')::uuid;

  -- Require caller to be admin
  IF v_caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Doar administratorii pot modifica roluri.';
  END IF;

  -- Prevent self-role modification
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Nu vă puteți modifica propriul rol.';
  END IF;

  -- Get target profile info
  SELECT tenant_id, role INTO v_target_tenant_id, v_target_current_role
    FROM public.profiles
    WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilizatorul nu a fost găsit.';
  END IF;

  -- Ensure target is in the same tenant
  IF v_caller_tenant_id <> v_target_tenant_id THEN
    RAISE EXCEPTION 'Nu aveți permisiunea de a modifica utilizatori din alte organizații.';
  END IF;

  -- If target is currently an admin and we are demoting them, check for at least one other admin
  IF v_target_current_role = 'admin' AND p_role <> 'admin' THEN
    SELECT count(*) INTO v_admin_count
      FROM public.profiles
      WHERE tenant_id = v_caller_tenant_id
        AND role = 'admin'
        AND is_active = true;

    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Nu puteți demite singurul administrator activ al organizației.';
    END IF;
  END IF;

  -- Apply update
  UPDATE public.profiles
    SET role = p_role
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
