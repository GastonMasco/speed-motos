-- =======================================================
-- FASE 3: MÓDULO DE VENTAS COMPLETO - SPEED RAO MOTOS
-- =======================================================

-- 1. SECUENCIA DE NÚMERO DE VENTA
CREATE SEQUENCE IF NOT EXISTS public.venta_numero_seq START WITH 1001;

-- 2. TABLA VENTAS
CREATE TABLE IF NOT EXISTS public.ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_venta TEXT UNIQUE NOT NULL,
  vendedor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  cliente_nombre TEXT NOT NULL DEFAULT 'Cliente Ocasional',
  cliente_telefono TEXT,
  cliente_nit TEXT,
  metodo_pago TEXT NOT NULL DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta')),
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  descuento NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  estado TEXT NOT NULL DEFAULT 'completada' CHECK (estado IN ('completada', 'anulada')),
  motivo_anulacion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TRIGGER PARA AUTO-GENERAR NUMERO_VENTA (Ej. VEN-001001)
CREATE OR REPLACE FUNCTION public.set_numero_venta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_venta IS NULL OR TRIM(NEW.numero_venta) = '' THEN
    NEW.numero_venta := 'VEN-' || LPAD(nextval('public.venta_numero_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_numero_venta ON public.ventas;
CREATE TRIGGER trigger_set_numero_venta
  BEFORE INSERT ON public.ventas
  FOR EACH ROW EXECUTE FUNCTION public.set_numero_venta();

-- 3. TABLA VENTA_ITEMS
CREATE TABLE IF NOT EXISTS public.venta_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id UUID REFERENCES public.ventas(id) ON DELETE CASCADE NOT NULL,
  producto_id UUID REFERENCES public.productos(id) ON DELETE RESTRICT NOT NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(12,2) NOT NULL,
  subtotal_linea NUMERIC(12,2) NOT NULL
);

-- 4. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_ventas_vendedor_id ON public.ventas(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_ventas_created_at ON public.ventas(created_at);
CREATE INDEX IF NOT EXISTS idx_ventas_numero_venta ON public.ventas(numero_venta);
CREATE INDEX IF NOT EXISTS idx_venta_items_venta_id ON public.venta_items(venta_id);

-- 5. FUNCIÓN ATÓMICA PARA PROCESAR VENTA Y DESCONTAR STOCK
CREATE OR REPLACE FUNCTION public.procesar_venta_atomic(
  p_vendedor_id UUID,
  p_cliente_nombre TEXT,
  p_cliente_telefono TEXT,
  p_cliente_nit TEXT,
  p_metodo_pago TEXT,
  p_subtotal NUMERIC,
  p_descuento NUMERIC,
  p_total NUMERIC,
  p_items JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_item JSONB;
  v_producto_id UUID;
  v_cantidad INT;
  v_precio_unitario NUMERIC;
  v_subtotal_linea NUMERIC;
  v_prod_record RECORD;
  v_venta_id UUID;
  v_numero_venta TEXT;
  v_result JSONB;
BEGIN
  -- 1. Validar Stock de todos los productos antes de procesar
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_producto_id := (v_item->>'producto_id')::UUID;
    v_cantidad := (v_item->>'cantidad')::INT;

    SELECT id, nombre, stock INTO v_prod_record
    FROM public.productos
    WHERE id = v_producto_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'El repuesto solicitado no fue encontrado en el inventario.';
    END IF;

    IF v_prod_record.stock < v_cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente para el repuesto: "%" (Stock disponible: %, Solicitado: %). Transacción cancelada.', 
        v_prod_record.nombre, v_prod_record.stock, v_cantidad;
    END IF;
  END LOOP;

  -- 2. Registrar Venta Principal
  INSERT INTO public.ventas (
    vendedor_id, cliente_nombre, cliente_telefono, cliente_nit,
    metodo_pago, subtotal, descuento, total, estado
  ) VALUES (
    p_vendedor_id, COALESCE(NULLIF(TRIM(p_cliente_nombre), ''), 'Cliente Ocasional'), p_cliente_telefono, p_cliente_nit,
    p_metodo_pago, p_subtotal, p_descuento, p_total, 'completada'
  )
  RETURNING id, numero_venta INTO v_venta_id, v_numero_venta;

  -- 3. Registrar ítems, descontar stock y registrar salida de inventario
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_producto_id := (v_item->>'producto_id')::UUID;
    v_cantidad := (v_item->>'cantidad')::INT;
    v_precio_unitario := (v_item->>'precio_unitario')::NUMERIC;
    v_subtotal_linea := (v_item->>'subtotal_linea')::NUMERIC;

    INSERT INTO public.venta_items (
      venta_id, producto_id, cantidad, precio_unitario, subtotal_linea
    ) VALUES (
      v_venta_id, v_producto_id, v_cantidad, v_precio_unitario, v_subtotal_linea
    );

    -- Descontar stock
    UPDATE public.productos
    SET stock = stock - v_cantidad
    WHERE id = v_producto_id;

    -- Movimiento de Inventario salida
    INSERT INTO public.movimientos_inventario (
      producto_id, tipo, cantidad, motivo, usuario_id
    ) VALUES (
      v_producto_id, 'salida', -v_cantidad, 'Venta N° ' || v_numero_venta, p_vendedor_id
    );
  END LOOP;

  SELECT jsonb_build_object(
    'id', v_venta_id,
    'numero_venta', v_numero_venta,
    'total', p_total,
    'estado', 'completada'
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNCIÓN ATÓMICA PARA ANULAR VENTA Y RESTITUIR STOCK
CREATE OR REPLACE FUNCTION public.anular_venta_atomic(
  p_venta_id UUID,
  p_motivo TEXT,
  p_usuario_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_venta RECORD;
  v_item RECORD;
BEGIN
  SELECT * INTO v_venta FROM public.ventas WHERE id = p_venta_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venta no encontrada.';
  END IF;

  IF v_venta.estado = 'anulada' THEN
    RAISE EXCEPTION 'Esta venta ya fue anulada previamente.';
  END IF;

  IF p_motivo IS NULL OR TRIM(p_motivo) = '' THEN
    RAISE EXCEPTION 'Es obligatorio proporcionar un motivo de anulación.';
  END IF;

  -- 1. Actualizar estado
  UPDATE public.ventas
  SET estado = 'anulada', motivo_anulacion = p_motivo
  WHERE id = p_venta_id;

  -- 2. Restituir stock y generar movimiento de entrada
  FOR v_item IN SELECT * FROM public.venta_items WHERE venta_id = p_venta_id
  LOOP
    UPDATE public.productos
    SET stock = stock + v_item.cantidad
    WHERE id = v_item.producto_id;

    INSERT INTO public.movimientos_inventario (
      producto_id, tipo, cantidad, motivo, usuario_id
    ) VALUES (
      v_item.producto_id, 'entrada', v_item.cantidad, 'Anulación de Venta N° ' || v_venta.numero_venta || ': ' || p_motivo, p_usuario_id
    );
  END LOOP;

  RETURN jsonb_build_object('success', true, 'id', p_venta_id, 'estado', 'anulada');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venta_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura ventas" ON public.ventas;
CREATE POLICY "Permitir lectura ventas" ON public.ventas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion ventas autenticados" ON public.ventas;
CREATE POLICY "Permitir insercion ventas autenticados" ON public.ventas FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Permitir actualizacion ventas admin" ON public.ventas;
CREATE POLICY "Permitir actualizacion ventas admin" ON public.ventas FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
);

DROP POLICY IF EXISTS "Permitir lectura venta_items" ON public.venta_items;
CREATE POLICY "Permitir lectura venta_items" ON public.venta_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion venta_items autenticados" ON public.venta_items;
CREATE POLICY "Permitir insercion venta_items autenticados" ON public.venta_items FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);
