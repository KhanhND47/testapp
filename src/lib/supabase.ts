import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_DATABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export { supabaseUrl, supabaseAnonKey };

export type ServiceType = 'full_paint' | 'color_change' | 'spot_paint';
export type Period = 'morning' | 'afternoon';
export type WorkType = 'body_work' | 'painting' | 'paint_stripping' | 'priming' | 'disassembly' | 'polishing' | 'assembly';
export type Specialization = 'body_work' | 'painting';

export interface RepairOrder {
  id: string;
  license_plate: string;
  service_type: ServiceType;
  receive_date: string;
  receive_period: Period;
  return_date: string;
  return_period: Period;
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: string;
  name: string;
  specialization: Specialization;
  created_at: string;
}

export interface WorkAssignment {
  id: string;
  repair_order_id: string;
  worker_id: string;
  work_type: WorkType;
  start_date: string;
  start_period: Period;
  end_date: string;
  end_period: Period;
  created_at: string;
}

export type MechanicalRepairStatus = 'scheduled' | 'not_started' | 'in_progress' | 'waiting_parts' | 'completed';

export interface RepairBay {
  id: string;
  name: string;
  order_index: number;
  created_at: string;
}

export type WorkerType = 'repair' | 'paint';

export interface RepairWorker {
  id: string;
  name: string;
  is_active: boolean;
  salary: number;
  worker_type: WorkerType;
  telegram_chat_id?: string | null;
  created_at: string;
}

export interface MechanicalRepairOrder {
  id: string;
  license_plate: string;
  bay_id: string | null;
  no_bay_index: number | null;
  receive_date: string;
  receive_time: string;
  return_date: string;
  return_time: string;
  scheduled_start_date: string | null;
  scheduled_start_time: string | null;
  scheduled_end_date: string | null;
  scheduled_end_time: string | null;
  actual_end_time: string | null;
  status: MechanicalRepairStatus;
  waiting_parts_duration: number | null;
  waiting_parts_start: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MechanicalRepairAssignment {
  id: string;
  repair_order_id: string;
  worker_id: string;
  created_at: string;
}

export type MechanicalRevenueType = 'labor' | 'parts_profit';

export interface MechanicalRepairRevenue {
  id: string;
  repair_order_id: string;
  amount: number;
  revenue_type: MechanicalRevenueType;
  description: string | null;
  created_at: string;
}

export type GeneralRepairStatus = 'pending' | 'in_progress' | 'completed';
export type RepairItemStatus = 'pending' | 'in_progress' | 'completed';
export type RepairType = 'sua_chua' | 'dong_son';

export interface GeneralRepairOrder {
  id: string;
  ro_code: string | null;
  license_plate: string;
  customer_name: string;
  vehicle_name: string;
  receive_date: string;
  return_date: string;
  status: GeneralRepairStatus;
  waiting_for_parts: boolean;
  parts_note: string | null;
  parts_order_start_time: string | null;
  parts_expected_end_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface RepairItem {
  id: string;
  order_id: string;
  name: string;
  status: RepairItemStatus;
  started_at: string | null;
  completed_at: string | null;
  estimated_duration_minutes: number | null;
  worker_id: string | null;
  order_index: number;
  parent_id: string | null;
  repair_type: RepairType | null;
  created_at: string;
}

export type UserRole = 'admin' | 'worker' | 'paint' | 'paint_lead' | 'worker_lead' | 'sales';

export interface AppUser {
  id: string;
  username: string;
  password: string;
  display_name: string;
  role: UserRole;
  worker_id: string | null;
  is_active: boolean;
  created_at: string;
}

export type RepairItemImageType = 'start' | 'complete';

export interface RepairItemImage {
  id: string;
  repair_item_id: string;
  image_data: string;
  image_type: RepairItemImageType;
  captured_at: string;
  created_at: string;
}

export interface RepairItemAssignedWorker {
  id: string;
  repair_item_id: string;
  worker_id: string;
  assigned_at: string;
  priority_marked_at: string | null;
  workload_engaged_at: string | null;
  workload_engaged_by: 'start' | 'priority' | null;
  created_at: string;
}

export interface RepairItemTransfer {
  id: string;
  repair_item_id: string;
  from_worker_id: string;
  to_worker_id: string;
  transferred_at: string;
  notes: string | null;
  created_at: string;
}

export type SupplementarySlipStatus = 'cho_xac_nhan' | 'da_bao_gia' | 'da_duyet';
export type SupplementaryQuoteStatus = 'draft' | 'approved' | 'converted';

export interface SupplementaryRepairSlip {
  id: string;
  order_id: string;
  customer_name: string;
  vehicle_name: string;
  license_plate: string;
  diagnosis_date: string;
  notes: string;
  status: SupplementarySlipStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SupplementaryQuote {
  id: string;
  slip_id: string;
  order_id: string;
  customer_name: string;
  vehicle_name: string;
  license_plate: string;
  quote_date: string;
  total_amount: number;
  notes: string;
  status: SupplementaryQuoteStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SupplementaryQuoteItem {
  id: string;
  quote_id: string;
  order_index: number;
  component_name: string;
  symptom: string;
  diagnosis_result: string;
  repair_method: string;
  part_id: string | null;
  part_name: string;
  quantity: number;
  unit_price: number;
  labor_cost: number;
  total_amount: number;
  created_at: string;
}

export interface SupplementaryRepairItem {
  id: string;
  slip_id: string;
  order_index: number;
  item_name: string;
  symptoms: string;
  diagnosis_result: string;
  repair_solution: string;
  materials: string;
  quantity: string;
  item_notes: string;
  created_at: string;
}

export type AppointmentServiceType = 'kiem_tra' | 'sua_chua' | 'bao_duong_dong_co' | 'bao_duong_3_buoc' | 'bao_duong';
export type AppointmentStatus = 'pending' | 'cancelled' | 'converted';

export interface Appointment {
  id: string;
  license_plate: string;
  customer_name: string;
  vehicle_name: string;
  phone: string | null;
  appointment_date: string;
  appointment_time: string;
  expected_return_date: string;
  service_type: AppointmentServiceType;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
