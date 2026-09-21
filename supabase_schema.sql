-- =======================================================
-- FASE 1: BASE DE DATOS EN SUPABASE - SPEED RAO MOTOS
-- =======================================================

-- 1. TABLA PROFILES (Vinculada a auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  nombre_completo TEXT NOT NULL,
  telefono TEXT,
  rol TEXT NOT NULL DEFAULT 'vendedor' CHECK (rol IN ('admin', 'vendedor')),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'activo', 'suspendido')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CONSTRAINT DE BASE DE DATOS: Solo puede existir UN usuario con rol='admin'
CREATE UNIQUE INDEX IF NOT EXISTS unique_single_admin ON public.profiles (rol) WHERE (rol = 'admin');

-- 2. TRIGGER PARA CREAR PERFIL AL REGISTRAR EN AUTH.USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre_completo, telefono, rol, estado)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nombre_completo', new.email),
    COALESCE(new.raw_user_meta_data->>'telefono', ''),
    COALESCE(new.raw_user_meta_data->>'rol', 'vendedor'),
    COALESCE(new.raw_user_meta_data->>'estado', 'pendiente')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE SEGURIDAD
DROP POLICY IF EXISTS "Lectura de perfiles" ON public.profiles;
CREATE POLICY "Lectura de perfiles" 
  ON public.profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Permitir actualizar perfiles" ON public.profiles;
CREATE POLICY "Permitir actualizar perfiles" 
  ON public.profiles FOR UPDATE 
  USING (true);

DROP POLICY IF EXISTS "Permitir insertar perfiles" ON public.profiles;
CREATE POLICY "Permitir insertar perfiles" 
  ON public.profiles FOR INSERT 
  WITH CHECK (true);

-- =======================================================
-- UTILIDAD: CONFIRMAR EMAILS Y ASIGNAR ADMIN
-- Ejecuta esto en el SQL Editor si no puedes ingresar:
-- =======================================================

-- 1. Confirmar el correo del usuario en Supabase Auth
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'mascogaston@gmail.com'; -- Cambia por tu email

-- 2. Activar la cuenta y asignarle el rol 'admin' en la tabla profiles
UPDATE public.profiles 
SET estado = 'activo', rol = 'admin' 
WHERE email = 'mascogaston@gmail.com'; -- Cambia por tu email

