-- =======================================================
-- SCRIPT DE CORRECCIÓN DE POLÍTICAS DE SEGURIDAD (RLS)
-- Speed Rao Motos - Solución a error de permisos en Supabase
-- =======================================================

-- 1. POLÍTICAS EN LISTAS_PROVEEDOR
ALTER TABLE public.listas_proveedor ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir lectura listas" ON public.listas_proveedor;
DROP POLICY IF EXISTS "Permitir escritura listas admin" ON public.listas_proveedor;
DROP POLICY IF EXISTS "Permitir escritura listas" ON public.listas_proveedor;

CREATE POLICY "Permitir lectura listas" ON public.listas_proveedor FOR SELECT USING (true);
CREATE POLICY "Permitir escritura listas" ON public.listas_proveedor FOR ALL USING (true) WITH CHECK (true);

-- 2. POLÍTICAS EN ITEMS_EXTRAIDOS
ALTER TABLE public.items_extraidos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir lectura items_extraidos" ON public.items_extraidos;
DROP POLICY IF EXISTS "Permitir escritura items_extraidos admin" ON public.items_extraidos;
DROP POLICY IF EXISTS "Permitir escritura items_extraidos" ON public.items_extraidos;

CREATE POLICY "Permitir lectura items_extraidos" ON public.items_extraidos FOR SELECT USING (true);
CREATE POLICY "Permitir escritura items_extraidos" ON public.items_extraidos FOR ALL USING (true) WITH CHECK (true);

-- 3. POLÍTICAS EN PROVEEDORES
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir lectura proveedores" ON public.proveedores;
DROP POLICY IF EXISTS "Permitir escritura proveedores admin" ON public.proveedores;
DROP POLICY IF EXISTS "Permitir escritura proveedores" ON public.proveedores;

CREATE POLICY "Permitir lectura proveedores" ON public.proveedores FOR SELECT USING (true);
CREATE POLICY "Permitir escritura proveedores" ON public.proveedores FOR ALL USING (true) WITH CHECK (true);

-- 4. POLÍTICAS EN PRODUCTOS
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir lectura productos" ON public.productos;
DROP POLICY IF EXISTS "Permitir insercion productos admin" ON public.productos;
DROP POLICY IF EXISTS "Permitir actualizacion productos admin" ON public.productos;
DROP POLICY IF EXISTS "Permitir eliminacion productos admin" ON public.productos;
DROP POLICY IF EXISTS "Permitir escritura productos" ON public.productos;

CREATE POLICY "Permitir lectura productos" ON public.productos FOR SELECT USING (true);
CREATE POLICY "Permitir escritura productos" ON public.productos FOR ALL USING (true) WITH CHECK (true);

-- 5. POLÍTICAS EN CONFIGURACIÓN NEGOCIO
ALTER TABLE public.configuracion_negocio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir lectura configuracion" ON public.configuracion_negocio;
DROP POLICY IF EXISTS "Permitir actualizacion configuracion admin" ON public.configuracion_negocio;
DROP POLICY IF EXISTS "Permitir insercion configuracion admin" ON public.configuracion_negocio;
DROP POLICY IF EXISTS "Permitir escritura configuracion" ON public.configuracion_negocio;

CREATE POLICY "Permitir lectura configuracion" ON public.configuracion_negocio FOR SELECT USING (true);
CREATE POLICY "Permitir escritura configuracion" ON public.configuracion_negocio FOR ALL USING (true) WITH CHECK (true);
