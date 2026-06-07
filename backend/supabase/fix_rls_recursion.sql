-- Fix RLS infinite recursion between elders ↔ family_members
-- Root cause: elders policy references family_members, which references elders again.
-- Fix: use SECURITY DEFINER functions that bypass RLS for the cross-table lookups.

-- Helper: returns elder IDs assigned to a worker (bypasses elders RLS)
CREATE OR REPLACE FUNCTION _worker_elder_ids(uid uuid)
RETURNS TABLE(id text) LANGUAGE sql SECURITY DEFINER SET search_path = public AS
$$
  SELECT e.id FROM elders e
  INNER JOIN workers w ON e.assigned_worker_id = w.id
  WHERE w.profile_id = uid
$$;

-- Helper: returns elder IDs linked to a family member (bypasses family_members RLS)
CREATE OR REPLACE FUNCTION _family_elder_ids(uid uuid)
RETURNS TABLE(id text) LANGUAGE sql SECURITY DEFINER SET search_path = public AS
$$
  SELECT elder_id FROM family_members WHERE profile_id = uid
$$;

-- Fix elders: family sees linked elder — use definer fn instead of direct subquery
DROP POLICY IF EXISTS "family sees linked elder" ON elders;
CREATE POLICY "family sees linked elder" ON elders FOR SELECT
  USING (id IN (SELECT id FROM _family_elder_ids(auth.uid())));

-- Fix family_members: worker sees family of their elders — use definer fn
DROP POLICY IF EXISTS "worker sees family of their elders" ON family_members;
CREATE POLICY "worker sees family of their elders" ON family_members FOR SELECT
  USING (elder_id IN (SELECT id FROM _worker_elder_ids(auth.uid())));

-- Fix all other tables that reference elders via subquery (same pattern)
-- activity_records
DROP POLICY IF EXISTS "worker reads activity" ON activity_records;
DROP POLICY IF EXISTS "worker inserts/updates activity" ON activity_records;
DROP POLICY IF EXISTS "family reads activity" ON activity_records;
CREATE POLICY "worker reads activity" ON activity_records FOR SELECT
  USING (elder_id IN (SELECT id FROM _worker_elder_ids(auth.uid())));
CREATE POLICY "worker inserts/updates activity" ON activity_records FOR ALL
  USING (elder_id IN (SELECT id FROM _worker_elder_ids(auth.uid())));
CREATE POLICY "family reads activity" ON activity_records FOR SELECT
  USING (elder_id IN (SELECT id FROM _family_elder_ids(auth.uid())));

-- flags
DROP POLICY IF EXISTS "worker reads flags" ON flags;
DROP POLICY IF EXISTS "worker updates flags" ON flags;
DROP POLICY IF EXISTS "family reads flags" ON flags;
CREATE POLICY "worker reads flags" ON flags FOR SELECT
  USING (elder_id IN (SELECT id FROM _worker_elder_ids(auth.uid())));
CREATE POLICY "worker updates flags" ON flags FOR UPDATE
  USING (elder_id IN (SELECT id FROM _worker_elder_ids(auth.uid())));
CREATE POLICY "family reads flags" ON flags FOR SELECT
  USING (elder_id IN (SELECT id FROM _family_elder_ids(auth.uid())));

-- vitals
DROP POLICY IF EXISTS "worker reads vitals" ON vitals;
DROP POLICY IF EXISTS "family reads vitals" ON vitals;
CREATE POLICY "worker reads vitals" ON vitals FOR SELECT
  USING (elder_id IN (SELECT id FROM _worker_elder_ids(auth.uid())));
CREATE POLICY "family reads vitals" ON vitals FOR SELECT
  USING (elder_id IN (SELECT id FROM _family_elder_ids(auth.uid())));

-- daily_calls
DROP POLICY IF EXISTS "worker reads calls" ON daily_calls;
DROP POLICY IF EXISTS "family reads calls" ON daily_calls;
CREATE POLICY "worker reads calls" ON daily_calls FOR SELECT
  USING (elder_id IN (SELECT id FROM _worker_elder_ids(auth.uid())));
CREATE POLICY "family reads calls" ON daily_calls FOR SELECT
  USING (elder_id IN (SELECT id FROM _family_elder_ids(auth.uid())));

-- care_plan_items
DROP POLICY IF EXISTS "worker reads plan" ON care_plan_items;
DROP POLICY IF EXISTS "worker updates plan" ON care_plan_items;
DROP POLICY IF EXISTS "family reads plan" ON care_plan_items;
CREATE POLICY "worker reads plan" ON care_plan_items FOR SELECT
  USING (elder_id IN (SELECT id FROM _worker_elder_ids(auth.uid())));
CREATE POLICY "worker updates plan" ON care_plan_items FOR UPDATE
  USING (elder_id IN (SELECT id FROM _worker_elder_ids(auth.uid())));
CREATE POLICY "family reads plan" ON care_plan_items FOR SELECT
  USING (elder_id IN (SELECT id FROM _family_elder_ids(auth.uid())));

-- visits
DROP POLICY IF EXISTS "worker reads own visits" ON visits;
DROP POLICY IF EXISTS "worker inserts visits" ON visits;
DROP POLICY IF EXISTS "worker updates visits" ON visits;
CREATE POLICY "worker reads own visits" ON visits FOR SELECT
  USING (worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid()));
CREATE POLICY "worker inserts visits" ON visits FOR INSERT
  WITH CHECK (worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid()));
CREATE POLICY "worker updates visits" ON visits FOR UPDATE
  USING (worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid()));

SELECT 'RLS recursion fixed' as result;
