-- =====================================================
-- Row Level Security (RLS) Migration
-- Ensures users can only access their own data
-- =====================================================

-- Enable RLS on tables with user ownership
ALTER TABLE generation_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- generation_pipelines: Users can only see their own pipelines
-- =====================================================

-- SELECT policy: Users can view their own pipelines
CREATE POLICY "Users can view their own pipelines"
ON generation_pipelines
FOR SELECT
USING (user_id = current_setting('app.current_user_id', TRUE)::uuid);

-- INSERT policy: Users can create pipelines for themselves
CREATE POLICY "Users can create their own pipelines"
ON generation_pipelines
FOR INSERT
WITH CHECK (user_id = current_setting('app.current_user_id', TRUE)::uuid);

-- UPDATE policy: Users can update their own pipelines
CREATE POLICY "Users can update their own pipelines"
ON generation_pipelines
FOR UPDATE
USING (user_id = current_setting('app.current_user_id', TRUE)::uuid);

-- DELETE policy: Users can delete their own pipelines
CREATE POLICY "Users can delete their own pipelines"
ON generation_pipelines
FOR DELETE
USING (user_id = current_setting('app.current_user_id', TRUE)::uuid);

-- =====================================================
-- asset_variants: Users can only see their own variants
-- =====================================================

-- SELECT policy: Users can view their own variants
CREATE POLICY "Users can view their own variants"
ON asset_variants
FOR SELECT
USING (owner_id = current_setting('app.current_user_id', TRUE)::uuid);

-- INSERT policy: Users can create variants for themselves
CREATE POLICY "Users can create their own variants"
ON asset_variants
FOR INSERT
WITH CHECK (owner_id = current_setting('app.current_user_id', TRUE)::uuid);

-- UPDATE policy: Users can update their own variants
CREATE POLICY "Users can update their own variants"
ON asset_variants
FOR UPDATE
USING (owner_id = current_setting('app.current_user_id', TRUE)::uuid);

-- DELETE policy: Users can delete their own variants
CREATE POLICY "Users can delete their own variants"
ON asset_variants
FOR DELETE
USING (owner_id = current_setting('app.current_user_id', TRUE)::uuid);

-- =====================================================
-- api_errors: Users can only see their own errors
-- =====================================================

-- SELECT policy: Users can view their own errors
CREATE POLICY "Users can view their own errors"
ON api_errors
FOR SELECT
USING (user_id = current_setting('app.current_user_id', TRUE)::uuid OR user_id IS NULL);

-- INSERT policy: System can create errors for any user
CREATE POLICY "System can create errors"
ON api_errors
FOR INSERT
WITH CHECK (true);

-- =====================================================
-- assets: Users can see their own assets + public assets
-- =====================================================

-- SELECT policy: Users can view their own assets or public assets
CREATE POLICY "Users can view own or public assets"
ON assets
FOR SELECT
USING (
  owner_id = current_setting('app.current_user_id', TRUE)::uuid
  OR is_public = true
);

-- INSERT policy: Users can create assets for themselves
CREATE POLICY "Users can create their own assets"
ON assets
FOR INSERT
WITH CHECK (owner_id = current_setting('app.current_user_id', TRUE)::uuid);

-- UPDATE policy: Users can update their own assets
CREATE POLICY "Users can update their own assets"
ON assets
FOR UPDATE
USING (owner_id = current_setting('app.current_user_id', TRUE)::uuid);

-- DELETE policy: Users can delete their own assets
CREATE POLICY "Users can delete their own assets"
ON assets
FOR DELETE
USING (owner_id = current_setting('app.current_user_id', TRUE)::uuid);

-- =====================================================
-- activity_log: Users can only see their own activity
-- =====================================================

-- SELECT policy: Users can view their own activity
CREATE POLICY "Users can view their own activity"
ON activity_log
FOR SELECT
USING (user_id = current_setting('app.current_user_id', TRUE)::uuid);

-- INSERT policy: System can create activity logs for any user
CREATE POLICY "System can create activity logs"
ON activity_log
FOR INSERT
WITH CHECK (true);

-- =====================================================
-- Helper function to set current user context
-- (Called by application middleware before each request)
-- =====================================================

CREATE OR REPLACE FUNCTION set_current_user(user_uuid uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_uuid::text, false);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Admin bypass policies (for admin dashboard)
-- =====================================================

-- Admins can view all pipelines
CREATE POLICY "Admins can view all pipelines"
ON generation_pipelines
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = current_setting('app.current_user_id', TRUE)::uuid
    AND users.role = 'admin'
  )
);

-- Admins can view all assets
CREATE POLICY "Admins can view all assets"
ON assets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = current_setting('app.current_user_id', TRUE)::uuid
    AND users.role = 'admin'
  )
);

-- Admins can view all errors
CREATE POLICY "Admins can view all errors"
ON api_errors
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = current_setting('app.current_user_id', TRUE)::uuid
    AND users.role = 'admin'
  )
);

-- Admins can view all activity
CREATE POLICY "Admins can view all activity"
ON activity_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = current_setting('app.current_user_id', TRUE)::uuid
    AND users.role = 'admin'
  )
);
