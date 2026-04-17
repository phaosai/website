-- Seed admin account for daniel@phaosai.com.
-- Uses Supabase auth.users insert with a securely-hashed random password.
-- The user can immediately use "Forgot password" on /admin/login (when added)
-- or sign in with a temp password we'll communicate out-of-band.
-- Email is auto-confirmed so sign-in works without an email roundtrip.

DO $$
DECLARE
  v_user_id uuid;
  v_existing uuid;
BEGIN
  -- If the user already exists, just ensure the admin role row is present.
  SELECT id INTO v_existing FROM auth.users WHERE email = 'daniel@phaosai.com' LIMIT 1;

  IF v_existing IS NOT NULL THEN
    v_user_id := v_existing;
  ELSE
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'daniel@phaosai.com',
      crypt('ChangeMe-' || encode(gen_random_bytes(12), 'hex') || '!Phaos', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- Required identity row for email provider
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'daniel@phaosai.com', 'email_verified', true),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  END IF;

  -- Idempotent admin role assignment
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin'::public.app_role)
  ON CONFLICT DO NOTHING;
END $$;