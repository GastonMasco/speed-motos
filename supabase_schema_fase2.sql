-- =======================================================
-- FASE 2: MÓDULO DE INVENTARIO COMPLETO - SPEED RAO MOTOS
-- =======================================================

-- 1. TABLA PROVEEDORES
CREATE TABLE IF NOT EXISTS public.proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  telefono TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLA PRODUCTOS
CREATE TABLE IF NOT EXISTS public.productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_interno TEXT UNIQUE NOT NULL,
  codigo_proveedor TEXT,
  proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL,
  marca TEXT NOT NULL DEFAULT 'GENERICO',
  nombre TEXT NOT NULL,
  compatibilidad TEXT[] DEFAULT '{}'::TEXT[],
  categoria TEXT NOT NULL,
  unidad TEXT NOT NULL DEFAULT 'PZA' CHECK (unidad IN ('PZA', 'PAR', 'JGO', 'KIT')),
  precio_costo NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  precio_venta NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  stock INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER NOT NULL DEFAULT 5,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'descontinuado')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SECUENCIA Y TRIGGER PARA AUTO-GENERAR SKU_INTERNO SI SE OMITE
CREATE SEQUENCE IF NOT EXISTS public.producto_sku_seq START WITH 1001;

CREATE OR REPLACE FUNCTION public.set_sku_interno_and_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sku_interno IS NULL OR TRIM(NEW.sku_interno) = '' THEN
    NEW.sku_interno := 'SKU-' || LPAD(nextval('public.producto_sku_seq')::text, 6, '0');
  END IF;
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_sku_interno ON public.productos;
CREATE TRIGGER trigger_set_sku_interno
  BEFORE INSERT OR UPDATE ON public.productos
  FOR EACH ROW EXECUTE FUNCTION public.set_sku_interno_and_updated_at();

-- 3. TABLA MOVIMIENTOS_INVENTARIO
CREATE TABLE IF NOT EXISTS public.movimientos_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID REFERENCES public.productos(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
  cantidad INTEGER NOT NULL,
  motivo TEXT,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON public.productos (nombre);
CREATE INDEX IF NOT EXISTS idx_productos_codigo_proveedor ON public.productos (codigo_proveedor);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON public.productos (categoria);
CREATE INDEX IF NOT EXISTS idx_productos_marca ON public.productos (marca);
CREATE INDEX IF NOT EXISTS idx_productos_sku_interno ON public.productos (sku_interno);
CREATE INDEX IF NOT EXISTS idx_productos_compatibilidad_gin ON public.productos USING GIN (compatibilidad);

-- 5. VISTA DE SEGURIDAD PARA VENDEDORES (Oculta precio_costo)
CREATE OR REPLACE VIEW public.productos_vendedor AS
SELECT 
  id,
  sku_interno,
  codigo_proveedor,
  proveedor_id,
  marca,
  nombre,
  compatibilidad,
  categoria,
  unidad,
  precio_venta,
  stock,
  stock_minimo,
  estado,
  image_url,
  created_at,
  updated_at
FROM public.productos;

-- 6. CONFIGURACIÓN DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;

-- Políticas para Proveedores
DROP POLICY IF EXISTS "Permitir lectura proveedores" ON public.proveedores;
CREATE POLICY "Permitir lectura proveedores" ON public.proveedores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir escritura proveedores admin" ON public.proveedores;
CREATE POLICY "Permitir escritura proveedores admin" ON public.proveedores FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
);

-- Políticas para Productos
DROP POLICY IF EXISTS "Permitir lectura productos" ON public.productos;
CREATE POLICY "Permitir lectura productos" ON public.productos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion productos admin" ON public.productos;
CREATE POLICY "Permitir insercion productos admin" ON public.productos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
);

DROP POLICY IF EXISTS "Permitir actualizacion productos admin" ON public.productos;
CREATE POLICY "Permitir actualizacion productos admin" ON public.productos FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
);

DROP POLICY IF EXISTS "Permitir eliminacion productos admin" ON public.productos;
CREATE POLICY "Permitir eliminacion productos admin" ON public.productos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
);

-- Políticas para Movimientos Inventario
DROP POLICY IF EXISTS "Permitir lectura movimientos" ON public.movimientos_inventario;
CREATE POLICY "Permitir lectura movimientos" ON public.movimientos_inventario FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insertar movimientos autenticados" ON public.movimientos_inventario;
CREATE POLICY "Permitir insertar movimientos autenticados" ON public.movimientos_inventario FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- =======================================================
-- DATOS DE PRUEBA (SEED DATA)
-- =======================================================

-- Inserción de Proveedores
INSERT INTO public.proveedores (id, nombre, telefono, notas) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Biker Bolivia', '+591 71234567', 'Proveedor principal de repuestos Brasil y China'),
  ('22222222-2222-2222-2222-222222222222', 'Rinaldi Importaciones', '+591 72345678', 'Especialista en cubiertas, llantas y neumáticos'),
  ('33333333-3333-3333-3333-333333333333', 'Technic Moto Parts', '+591 73456789', 'Repuestos de transmisión y frenos alta gama')
ON CONFLICT (id) DO NOTHING;

-- Inserción de Productos de Prueba
INSERT INTO public.productos (
  sku_interno, codigo_proveedor, proveedor_id, marca, nombre, compatibilidad, categoria, unidad, precio_costo, precio_venta, stock, stock_minimo, estado
) VALUES
  ('SKU-001001', 'BK-F01', '11111111-1111-1111-1111-111111111111', 'RAOPKS', 'Pastilla de Freno Delantera Cerámica', ARRAY['CRF230', 'XR200', 'Tornado 250'], 'frenos', 'JGO', 25.00, 45.00, 15, 5, 'activo'),
  ('SKU-001002', 'RN-L90', '22222222-2222-2222-2222-222222222222', 'Rinaldi', 'Llanta Pista 110/90-17 R34', ARRAY['CB190R', 'FZ16', 'Pulsar 200'], 'llantas', 'PZA', 180.00, 260.00, 8, 3, 'activo'),
  ('SKU-001003', 'TC-K04', '33333333-3333-3333-3333-333333333333', 'VEDAMOTORS', 'Kit de Arrastre Reforzado 428H x 132L', ARRAY['XR150', 'XR190', 'CG150'], 'transmision', 'KIT', 110.00, 175.00, 4, 5, 'activo'),
  ('SKU-001004', 'BK-P12', '11111111-1111-1111-1111-111111111111', 'GPR', 'Guardabarro Delantero Enduro', ARRAY['CRF230', 'XR200'], 'plasticos', 'PZA', 40.00, 75.00, 12, 4, 'activo'),
  ('SKU-001005', 'TC-FL01', '33333333-3333-3333-3333-333333333333', 'RAOPKS', 'Filtro de Aire Deportivo Espuma', ARRAY['CRF230', 'CRF250F'], 'filtros', 'PZA', 20.00, 38.00, 2, 5, 'activo'),
  ('SKU-001006', 'RN-C90', '22222222-2222-2222-2222-222222222222', 'Rinaldi', 'Cámara de Aire 2.75/3.00-18', ARRAY['CG125', 'GN125', 'YBR125'], 'llantas', 'PZA', 15.00, 28.00, 30, 10, 'activo'),
  ('SKU-001007', 'BK-A02', '11111111-1111-1111-1111-111111111111', 'GPR', 'Aceite Sintético 4T 10W40 (1 Litro)', ARRAY['Universal', 'Honda', 'Yamaha'], 'lubricantes', 'PZA', 45.00, 70.00, 24, 8, 'activo'),
  ('SKU-001008', 'TC-B08', '33333333-3333-3333-3333-333333333333', 'VEDAMOTORS', 'Batería de Gel 12V 7Ah', ARRAY['CB190R', 'Duke 200', 'Pulsar NS200'], 'electricidad', 'PZA', 95.00, 150.00, 6, 4, 'activo')
ON CONFLICT (sku_interno) DO NOTHING;
