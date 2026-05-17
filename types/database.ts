export type UserRole =
  | 'gerente'
  | 'asistente'
  | 'ventas'
  | 'jefe_almacen'
  | 'operativo'
  | 'facturacion'

export type StockStatus = 'disponible' | 'no_hay' | 'parcial'

export type OrderStatus =
  | 'nuevo'
  | 'en_proceso'
  | 'listo_almacen'
  | 'en_ruta'
  | 'entregado'
  | 'facturado'
  | 'cancelado'

export type DocType = 'oc' | 'cotizacion'

export type DeliveryType = 'total' | 'parcial'

export type DeliveryStatus =
  | 'pendiente_programacion'
  | 'programado'
  | 'en_ruta'
  | 'entregado'
  | 'incidencia'

export type DeliveryEvent =
  | 'inicio'
  | 'en_punto'
  | 'esperando'
  | 'finalizado'
  | 'incidencia'

export interface Department {
  id: number
  name: string
  description: string | null
  created_at: string
}

export interface User {
  id: string
  email: string
  full_name: string
  department_id: number | null
  role: UserRole
  phone: string | null
  push_subscription: object | null
  is_active: boolean
  created_at: string
  updated_at: string
  department?: Department
}

export interface SupplierOrder {
  id: number
  internal_number: string
  order_number: string
  supplier_name: string
  client_reference: string | null
  project_reference: string | null
  file_url: string | null
  stock_status: StockStatus
  notes: string | null
  status: OrderStatus
  created_by: string
  created_at: string
  updated_at: string
  creator?: User
}

export interface ClientOrder {
  id: number
  internal_number: string
  order_number: string
  client_name: string
  project_reference: string | null
  doc_type: DocType
  file_url: string | null
  notes: string | null
  status: OrderStatus
  created_by: string
  created_at: string
  updated_at: string
  creator?: User
}

export interface Delivery {
  id: number
  client_order_id: number
  guide_number: string | null
  delivery_type: DeliveryType
  scheduled_date: string | null
  scheduled_time: string | null
  assigned_to: string | null
  scheduled_by: string | null
  vehicle_plate: string | null
  receiver_name: string | null
  receiver_dni: string | null
  sealed_guide_photo_url: string | null
  current_status: DeliveryStatus
  notes: string | null
  created_at: string
  updated_at: string
  client_order?: ClientOrder
  assigned_user?: User
}

export interface DeliveryTimeline {
  id: number
  delivery_id: number
  event_type: DeliveryEvent
  event_time: string
  user_id: string
  notes: string | null
  gps_lat: number | null
  gps_lng: number | null
  user?: User
}

export interface AuditLog {
  id: number
  user_id: string | null
  action: string
  table_name: string
  record_id: string
  old_value: object | null
  new_value: object | null
  created_at: string
  user?: User
}

export interface Notification {
  id: number
  user_id: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  push_sent: boolean
  created_at: string
}

export interface OfflineQueueItem {
  id: number
  user_id: string
  action_type: string
  payload: object
  client_timestamp: string
  processed: boolean
  processed_at: string | null
  created_at: string
}
