-- ============================================
-- Storage Buckets & Policies
-- ============================================

-- Create buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('pet-images', 'pet-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('client-images', 'client-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('vaccination-documents', 'vaccination-documents', false);

-- Avatars: public read, authenticated write
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update avatars"
  ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete avatars"
  ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Pet images: public read, authenticated write
CREATE POLICY "Pet images are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'pet-images');

CREATE POLICY "Authenticated users can upload pet images"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pet-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update pet images"
  ON storage.objects FOR UPDATE USING (bucket_id = 'pet-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete pet images"
  ON storage.objects FOR DELETE USING (bucket_id = 'pet-images' AND auth.role() = 'authenticated');

-- Client images: public read, authenticated write
CREATE POLICY "Client images are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'client-images');

CREATE POLICY "Authenticated users can upload client images"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'client-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update client images"
  ON storage.objects FOR UPDATE USING (bucket_id = 'client-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete client images"
  ON storage.objects FOR DELETE USING (bucket_id = 'client-images' AND auth.role() = 'authenticated');

-- Vaccination documents: private, authenticated access only
CREATE POLICY "Authenticated users can view vaccination documents"
  ON storage.objects FOR SELECT USING (bucket_id = 'vaccination-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload vaccination documents"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vaccination-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update vaccination documents"
  ON storage.objects FOR UPDATE USING (bucket_id = 'vaccination-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete vaccination documents"
  ON storage.objects FOR DELETE USING (bucket_id = 'vaccination-documents' AND auth.role() = 'authenticated');
