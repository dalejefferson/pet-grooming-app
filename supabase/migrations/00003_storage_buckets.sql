-- ============================================================
-- Supabase Storage Buckets & Policies
-- ============================================================
-- Buckets:
--   1. pet-photos     - Pet profile images (public read, staff write)
--   2. vaccination-docs - Vaccination certificates/PDFs (private, staff only)
--   3. avatars        - Staff profile photos (public read, own write)
-- ============================================================

-- ============================================================
-- Create Buckets
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'pet-photos',
    'pet-photos',
    true,
    5242880,  -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'vaccination-docs',
    'vaccination-docs',
    false,
    10485760,  -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  ),
  (
    'avatars',
    'avatars',
    true,
    2097152,  -- 2 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  );

-- ============================================================
-- pet-photos bucket policies
-- ============================================================

-- Public read access
CREATE POLICY "pet_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pet-photos');

-- Authenticated staff can upload pet photos for their org
-- Path convention: {organization_id}/{pet_id}/{filename}
CREATE POLICY "pet_photos_staff_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pet-photos'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
  );

-- Authenticated staff can update/replace pet photos for their org
CREATE POLICY "pet_photos_staff_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'pet-photos'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
  );

-- Admins can delete pet photos
CREATE POLICY "pet_photos_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pet-photos'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
    AND get_user_role() IN ('owner', 'admin')
  );

-- ============================================================
-- vaccination-docs bucket policies
-- ============================================================

-- Only authenticated org staff can read vaccination documents
CREATE POLICY "vax_docs_staff_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'vaccination-docs'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
  );

-- Staff can upload vaccination documents for their org
-- Path convention: {organization_id}/{pet_id}/{vaccination_id}/{filename}
CREATE POLICY "vax_docs_staff_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'vaccination-docs'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
  );

-- Staff can update vaccination documents for their org
CREATE POLICY "vax_docs_staff_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'vaccination-docs'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
  );

-- Admins can delete vaccination documents
CREATE POLICY "vax_docs_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'vaccination-docs'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
    AND get_user_role() IN ('owner', 'admin')
  );

-- ============================================================
-- avatars bucket policies
-- ============================================================

-- Public read access
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Staff can upload their own avatar
-- Path convention: {staff_id}/{filename}
CREATE POLICY "avatars_own_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = get_user_staff_id()::text
  );

-- Staff can update their own avatar
CREATE POLICY "avatars_own_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = get_user_staff_id()::text
  );

-- Staff can delete their own avatar
CREATE POLICY "avatars_own_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = get_user_staff_id()::text
  );

-- Admins can manage any avatar in their org
CREATE POLICY "avatars_admin_manage"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND get_user_role() IN ('owner', 'admin')
  );
