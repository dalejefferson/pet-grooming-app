-- ============================================
-- Auto-create user profile on OAuth signup
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_org_id UUID;
  user_name TEXT;
  user_email TEXT;
BEGIN
  SELECT id INTO default_org_id FROM public.organizations LIMIT 1;

  IF default_org_id IS NULL THEN
    RAISE LOG 'No organization found for new user %', NEW.id;
    RETURN NEW;
  END IF;

  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  user_email := COALESCE(NEW.email, '');

  INSERT INTO public.users (id, organization_id, email, name, role)
  VALUES (NEW.id, default_org_id, user_email, user_name, 'admin')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT USING (id = auth.uid());
