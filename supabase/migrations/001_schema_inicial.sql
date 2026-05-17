-- ============================================================================
-- SkyOps · Sky High SAC
-- Migración 001: Schema inicial completo
-- ============================================================================

-- ENUMS
CREATE TYPE user_role AS ENUM (
  'gerente', 'asistente', 'ventas',
  'jefe_almacen', 'operativo', 'facturacion'
);

CREATE TYPE stock_status_enum AS ENUM ('disponible', 'no_hay', 'parcial');

CREATE TYPE order_status_enum AS ENUM (
  'nuevo', 'en_proceso', 'listo_almacen',
  'en_ruta', 'entregado', 'facturado', 'cancelado'
);

CREATE TYPE doc_type_enum AS ENUM ('oc', 'cotizacion');

CREATE TYPE delivery_type_enum AS ENUM ('total', 'parcial');

CREATE TYPE delivery_status_enum AS ENUM (
  'pendiente_programacion', 'programado',
  'en_ruta', 'entregado', 'incidencia'
);

CREATE TYPE delivery_event_enum AS ENUM (
  'inicio', 'en_punto', 'esperando', 'finalizado', 'incidencia'
);

-- ============================================================================
-- TABLAS
-- ============================================================================

-- Departamentos
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usuarios (extiende auth.users de Supabase)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  department_id INT REFERENCES departments(id),
  role user_role NOT NULL,
  phone TEXT,
  push_subscription JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos a proveedores
CREATE TABLE supplier_orders (
  id SERIAL PRIMARY KEY,
  internal_number TEXT UNIQUE NOT NULL,
  order_number TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  client_reference TEXT,
  project_reference TEXT,
  file_url TEXT,
  stock_status stock_status_enum NOT NULL,
  notes TEXT,
  status order_status_enum DEFAULT 'nuevo',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Órdenes de compra de clientes
CREATE TABLE client_orders (
  id SERIAL PRIMARY KEY,
  internal_number TEXT UNIQUE NOT NULL,
  order_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  project_reference TEXT,
  doc_type doc_type_enum NOT NULL,
  file_url TEXT,
  notes TEXT,
  status order_status_enum DEFAULT 'nuevo',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Programación de entregas
CREATE TABLE deliveries (
  id SERIAL PRIMARY KEY,
  client_order_id INT NOT NULL REFERENCES client_orders(id),
  guide_number TEXT,
  delivery_type delivery_type_enum NOT NULL DEFAULT 'total',
  scheduled_date DATE,
  scheduled_time TIME,
  assigned_to UUID REFERENCES users(id),
  scheduled_by UUID REFERENCES users(id),
  vehicle_plate TEXT,
  receiver_name TEXT,
  receiver_dni TEXT,
  sealed_guide_photo_url TEXT,
  current_status delivery_status_enum DEFAULT 'pendiente_programacion',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timeline INMUTABLE de eventos de entrega
CREATE TABLE delivery_timeline (
  id SERIAL PRIMARY KEY,
  delivery_id INT NOT NULL REFERENCES deliveries(id),
  event_type delivery_event_enum NOT NULL,
  event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES users(id),
  notes TEXT,
  gps_lat NUMERIC(10, 7),
  gps_lng NUMERIC(10, 7)
);

-- Trigger inmutabilidad delivery_timeline
CREATE OR REPLACE FUNCTION prevent_timeline_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'delivery_timeline es inmutable. Solo INSERT permitido.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_update_timeline
  BEFORE UPDATE ON delivery_timeline
  FOR EACH ROW EXECUTE FUNCTION prevent_timeline_update();

-- Auditoría general
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notificaciones internas
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  push_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cola offline
CREATE TABLE offline_queue (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  action_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  client_timestamp TIMESTAMPTZ NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- NUMERACIÓN AUTOMÁTICA
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_supplier_order_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT := to_char(NOW(), 'YYYY');
  seq_num  INT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq_num
  FROM supplier_orders
  WHERE internal_number LIKE 'SP-' || year_str || '-%';
  NEW.internal_number := 'SP-' || year_str || '-' || lpad(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_supplier_order_number
  BEFORE INSERT ON supplier_orders
  FOR EACH ROW EXECUTE FUNCTION generate_supplier_order_number();

CREATE OR REPLACE FUNCTION generate_client_order_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT := to_char(NOW(), 'YYYY');
  seq_num  INT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq_num
  FROM client_orders
  WHERE internal_number LIKE 'OC-' || year_str || '-%';
  NEW.internal_number := 'OC-' || year_str || '-' || lpad(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_client_order_number
  BEFORE INSERT ON client_orders
  FOR EACH ROW EXECUTE FUNCTION generate_client_order_number();

-- ============================================================================
-- TRIGGER updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER updated_at_users        BEFORE UPDATE ON users        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER updated_at_supplier     BEFORE UPDATE ON supplier_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER updated_at_client       BEFORE UPDATE ON client_orders   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER updated_at_deliveries   BEFORE UPDATE ON deliveries      FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- AUDITORÍA
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log(user_id, action, table_name, record_id, old_value, new_value)
    VALUES (auth.uid(), 'update', TG_TABLE_NAME, NEW.id::TEXT,
            row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log(user_id, action, table_name, record_id, old_value)
    VALUES (auth.uid(), 'delete', TG_TABLE_NAME, OLD.id::TEXT,
            row_to_json(OLD)::JSONB);
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log(user_id, action, table_name, record_id, new_value)
    VALUES (auth.uid(), 'create', TG_TABLE_NAME, NEW.id::TEXT,
            row_to_json(NEW)::JSONB);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_client_orders   AFTER INSERT OR UPDATE OR DELETE ON client_orders   FOR EACH ROW EXECUTE FUNCTION audit_changes();
CREATE TRIGGER audit_supplier_orders AFTER INSERT OR UPDATE OR DELETE ON supplier_orders FOR EACH ROW EXECUTE FUNCTION audit_changes();
CREATE TRIGGER audit_deliveries      AFTER INSERT OR UPDATE OR DELETE ON deliveries      FOR EACH ROW EXECUTE FUNCTION audit_changes();

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Lectura: todos los autenticados
CREATE POLICY "auth_read_client_orders"   ON client_orders   FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_supplier_orders" ON supplier_orders FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_deliveries"      ON deliveries      FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_timeline"        ON delivery_timeline FOR SELECT USING (auth.uid() IS NOT NULL);

-- Creación de pedidos
CREATE POLICY "create_client_orders"   ON client_orders   FOR INSERT WITH CHECK (get_user_role() IN ('ventas', 'gerente', 'asistente'));
CREATE POLICY "create_supplier_orders" ON supplier_orders FOR INSERT WITH CHECK (get_user_role() IN ('ventas', 'gerente', 'asistente'));

-- Edición
CREATE POLICY "update_client_orders" ON client_orders
  FOR UPDATE USING (
    get_user_role() IN ('gerente', 'asistente')
    OR (get_user_role() = 'ventas' AND created_by = auth.uid())
  );

CREATE POLICY "update_supplier_orders" ON supplier_orders
  FOR UPDATE USING (
    get_user_role() IN ('gerente', 'asistente')
    OR (get_user_role() = 'ventas' AND created_by = auth.uid())
  );

CREATE POLICY "update_deliveries" ON deliveries
  FOR UPDATE USING (get_user_role() IN ('gerente', 'asistente', 'jefe_almacen'));

-- Insertar timeline
CREATE POLICY "insert_timeline" ON delivery_timeline
  FOR INSERT WITH CHECK (get_user_role() IN ('gerente', 'asistente', 'jefe_almacen', 'operativo'));

-- Eliminación: solo gerente
CREATE POLICY "delete_client_orders"   ON client_orders   FOR DELETE USING (get_user_role() = 'gerente');
CREATE POLICY "delete_supplier_orders" ON supplier_orders FOR DELETE USING (get_user_role() = 'gerente');

-- Notificaciones: solo el dueño
CREATE POLICY "own_notifications" ON notifications FOR ALL USING (user_id = auth.uid());

-- Usuarios: lectura a todos autenticados
CREATE POLICY "auth_read_users" ON users FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "update_own_user" ON users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "admin_manage_users" ON users FOR ALL USING (get_user_role() IN ('gerente', 'asistente'));

-- ============================================================================
-- DATOS INICIALES
-- ============================================================================

INSERT INTO departments (name, description) VALUES
  ('Gerencia',    'Dirección y administración'),
  ('Ventas',      'Gestión de órdenes de clientes y pedidos a proveedores'),
  ('Almacén',     'Recepción, almacenaje y entregas'),
  ('Facturación', 'Facturación electrónica y cobranza');
