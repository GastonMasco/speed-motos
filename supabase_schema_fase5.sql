-- =======================================================
-- FASE 5: CONFIGURACIÓN DE NEGOCIO Y REGLAS DE PRECIO
-- =======================================================

-- 1. TABLA CONFIGURACION_NEGOCIO
CREATE TABLE IF NOT EXISTS public.configuracion_negocio (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nombre_negocio TEXT NOT NULL DEFAULT 'Motos Service Oraqueni',
  eslogan TEXT DEFAULT 'Venta de Repuestos, Accesorios y Taller Especializado',
  direccion TEXT DEFAULT 'La Paz, Bolivia',
  telefono TEXT DEFAULT '+591 71234567',
  nit TEXT DEFAULT '1028374029',
  markup_global_defecto NUMERIC(5,2) NOT NULL DEFAULT 40.00,
  markup_por_categoria JSONB NOT NULL DEFAULT '{"frenos": 35, "llantas": 25, "plasticos": 45, "transmision": 30, "filtros": 35, "lubricantes": 25, "electricidad": 40, "motor": 30, "varios": 40}'::JSONB,
  descuento_maximo_vendedor NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. FILA DE CONFIGURACIÓN POR DEFECTO
INSERT INTO public.configuracion_negocio (
  id, nombre_negocio, eslogan, direccion, telefono, nit, markup_global_defecto, descuento_maximo_vendedor
)
VALUES (
  1, 'Motos Service Oraqueni', 'Venta de Repuestos, Accesorios y Taller Especializado',
  'La Paz, Bolivia', '+591 71234567', '1028374029', 40.00, 15.00
)
ON CONFLICT (id) DO NOTHING;

-- 3. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.configuracion_negocio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura configuracion" ON public.configuracion_negocio;
CREATE POLICY "Permitir lectura configuracion" ON public.configuracion_negocio FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir actualizacion configuracion admin" ON public.configuracion_negocio;
CREATE POLICY "Permitir actualizacion configuracion admin" ON public.configuracion_negocio FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
);

DROP POLICY IF EXISTS "Permitir insercion configuracion admin" ON public.configuracion_negocio;
CREATE POLICY "Permitir insercion configuracion admin" ON public.configuracion_negocio FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
);
