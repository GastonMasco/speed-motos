-- =======================================================
-- FASE 4: LECTURA DE LISTAS PDF CON IA - SPEED RAO MOTOS
-- =======================================================

-- 1. TABLA LISTAS_PROVEEDOR
CREATE TABLE IF NOT EXISTS public.listas_proveedor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE CASCADE NOT NULL,
  nombre_archivo TEXT NOT NULL,
  fecha_lista TEXT NOT NULL DEFAULT to_char(now(), 'TMMonth YYYY'),
  url_pdf_storage TEXT,
  estado TEXT NOT NULL DEFAULT 'procesando' CHECK (estado IN ('procesando', 'pendiente_revision', 'confirmada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLA TEMPORAL DE STAGING: ITEMS_EXTRAIDOS
CREATE TABLE IF NOT EXISTS public.items_extraidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lista_id UUID REFERENCES public.listas_proveedor(id) ON DELETE CASCADE NOT NULL,
  codigo_proveedor TEXT,
  nombre TEXT NOT NULL,
  marca TEXT NOT NULL DEFAULT 'GENERICO',
  categoria_sugerida TEXT NOT NULL DEFAULT 'varios',
  compatibilidad_sugerida TEXT[] DEFAULT '{}'::TEXT[],
  unidad TEXT NOT NULL DEFAULT 'PZA' CHECK (unidad IN ('PZA', 'PAR', 'JGO', 'KIT')),
  precio_costo NUMERIC(12,2),
  estado_producto TEXT NOT NULL DEFAULT 'disponible' CHECK (estado_producto IN ('disponible', 'agotado', 'oferta_especial')),
  confianza_ia TEXT NOT NULL DEFAULT 'alta' CHECK (confianza_ia IN ('alta', 'media', 'baja')),
  incluir BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_listas_proveedor_id ON public.listas_proveedor(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_items_extraidos_lista_id ON public.items_extraidos(lista_id);

-- 4. FUNCIÓN ATÓMICA DE IMPORTACIÓN A PRODUCTOS
CREATE OR REPLACE FUNCTION public.confirmar_e_importar_lista(
  p_lista_id UUID,
  p_items JSONB,
  p_usuario_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_lista RECORD;
  v_item JSONB;
  v_codigo TEXT;
  v_nombre TEXT;
  v_marca TEXT;
  v_categoria TEXT;
  v_compatibilidad TEXT[];
  v_unidad TEXT;
  v_precio_costo NUMERIC;
  v_precio_venta NUMERIC;
  v_stock_sum INT;
  v_existente RECORD;
  v_nuevo_prod_id UUID;
  v_imported_count INT := 0;
BEGIN
  -- Obtener información de la lista
  SELECT * INTO v_lista FROM public.listas_proveedor WHERE id = p_lista_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'La lista de proveedor especificada no existe.';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Procesar sólo los marcados como incluir = true
    IF (v_item->>'incluir')::BOOLEAN IS TRUE THEN
      v_codigo := COALESCE(v_item->>'codigo_proveedor', '');
      v_nombre := v_item->>'nombre';
      v_marca := COALESCE(v_item->>'marca', 'GENERICO');
      v_categoria := COALESCE(v_item->>'categoria', 'varios');
      v_unidad := COALESCE(v_item->>'unidad', 'PZA');
      v_precio_costo := (v_item->>'precio_costo')::NUMERIC;
      v_precio_venta := (v_item->>'precio_venta')::NUMERIC;
      v_stock_sum := COALESCE((v_item->>'stock_inicial')::INT, 5);

      -- Extraer array de compatibilidad
      IF v_item->'compatibilidad' IS NOT NULL AND jsonb_typeof(v_item->'compatibilidad') = 'array' THEN
        SELECT ARRAY(SELECT jsonb_array_elements_text(v_item->'compatibilidad')) INTO v_compatibilidad;
      ELSE
        v_compatibilidad := '{}'::TEXT[];
      END IF;

      -- Verificar si ya existe por codigo_proveedor + proveedor_id
      IF v_codigo <> '' THEN
        SELECT id, stock INTO v_existente 
        FROM public.productos 
        WHERE codigo_proveedor = v_codigo AND proveedor_id = v_lista.proveedor_id
        LIMIT 1;
      ELSE
        v_existente := NULL;
      END IF;

      IF v_existente IS NOT NULL AND v_existente.id IS NOT NULL THEN
        -- Actualizar existente (precio costo, precio venta si es > 0, y sumar stock)
        UPDATE public.productos
        SET 
          precio_costo = COALESCE(v_precio_costo, precio_costo),
          precio_venta = CASE WHEN v_precio_venta > 0 THEN v_precio_venta ELSE precio_venta END,
          stock = stock + v_stock_sum,
          updated_at = timezone('utc'::text, now())
        WHERE id = v_existente.id;

        -- Registrar movimiento de entrada
        INSERT INTO public.movimientos_inventario (
          producto_id, tipo, cantidad, motivo, usuario_id
        ) VALUES (
          v_existente.id, 'entrada', v_stock_sum, 'Carga de Lista de Precios PDF: ' || v_lista.nombre_archivo, p_usuario_id
        );

        v_imported_count := v_imported_count + 1;
      ELSE
        -- Insertar producto nuevo
        INSERT INTO public.productos (
          codigo_proveedor, proveedor_id, marca, nombre, compatibilidad,
          categoria, unidad, precio_costo, precio_venta, stock, stock_minimo, estado
        ) VALUES (
          v_codigo, v_lista.proveedor_id, v_marca, v_nombre, v_compatibilidad,
          v_categoria, v_unidad, COALESCE(v_precio_costo, 0.00), COALESCE(v_precio_venta, 0.00),
          v_stock_sum, 5, 'activo'
        )
        RETURNING id INTO v_nuevo_prod_id;

        -- Registrar movimiento inicial
        IF v_stock_sum > 0 THEN
          INSERT INTO public.movimientos_inventario (
            producto_id, tipo, cantidad, motivo, usuario_id
          ) VALUES (
            v_nuevo_prod_id, 'entrada', v_stock_sum, 'Importación inicial desde Lista PDF: ' || v_lista.nombre_archivo, p_usuario_id
          );
        END IF;

        v_imported_count := v_imported_count + 1;
      END IF;
    END IF;
  END LOOP;

  -- Cambiar estado de la lista a confirmada
  UPDATE public.listas_proveedor
  SET estado = 'confirmada'
  WHERE id = p_lista_id;

  RETURN jsonb_build_object('success', true, 'imported_count', v_imported_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.listas_proveedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_extraidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura listas" ON public.listas_proveedor;
CREATE POLICY "Permitir lectura listas" ON public.listas_proveedor FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir escritura listas admin" ON public.listas_proveedor;
CREATE POLICY "Permitir escritura listas admin" ON public.listas_proveedor FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
);

DROP POLICY IF EXISTS "Permitir lectura items_extraidos" ON public.items_extraidos;
CREATE POLICY "Permitir lectura items_extraidos" ON public.items_extraidos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir escritura items_extraidos admin" ON public.items_extraidos;
CREATE POLICY "Permitir escritura items_extraidos admin" ON public.items_extraidos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
);

-- 6. INSERCIÓN DE PROVEEDORES BASE (Si no existen)
INSERT INTO public.proveedores (nombre, telefono, notas) VALUES
  ('Biker Bolivia', '+591 71234567', 'Proveedor principal de repuestos Brasil y China'),
  ('Rinaldi Importaciones', '+591 72345678', 'Especialista en cubiertas, llantas y neumáticos'),
  ('Technic Moto Parts', '+591 73456789', 'Repuestos de transmisión y frenos alta gama'),
  ('IRA Motopartes', '+591 74567890', 'Fabricante de escapes, coronas y plásticos'),
  ('Canello Brasil', '+591 75678901', 'Cables de comando y sistemas eléctricos'),
  ('Parwin Racing', '+591 76789012', 'Accesorios de alta gama y competición')
ON CONFLICT DO NOTHING;
