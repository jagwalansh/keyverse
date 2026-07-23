-- Run this once in the Supabase SQL editor if your profiles table already exists.
-- It separates the auth email from the editable profile username.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE public.profiles AS p
SET email = u.email
FROM auth.users AS u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.email = '');

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_key
  ON public.profiles (email);

ALTER TABLE public.profiles
  ALTER COLUMN email SET NOT NULL;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    new.id,
    new.email,
    COALESCE(
      NULLIF(new.raw_user_meta_data->>'username', ''),
      split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 8)
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email = new.email,
      updated_at = NOW()
  WHERE id = new.id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (old.email IS DISTINCT FROM new.email)
  EXECUTE FUNCTION public.handle_user_email_update();
