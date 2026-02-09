import { Appointment, AppointmentServiceType } from '../../lib/supabase';

export type { Appointment };

export const SERVICE_TYPE_LABELS: Record<AppointmentServiceType, string> = {
  kiem_tra: 'Kiem Tra',
  sua_chua: 'Sua Chua',
  bao_duong_dong_co: 'BD Dong Co',
  bao_duong_3_buoc: 'BD 3 Buoc',
  bao_duong: 'Bao Duong',
};

export interface RepairLift {
  id: string;
  name: string;
  position: number;
  is_active: boolean;
}

export interface LiftAssignment {
  id: string;
  repair_order_id: string;
  lift_id: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  queue_position: number;
  status: 'queued' | 'on_lift' | 'completed';
  waiting_for_parts: boolean;
  parts_wait_start: string | null;
  parts_wait_end: string | null;
}

export interface RepairOrder {
  id: string;
  license_plate: string;
  customer_name: string;
  vehicle_name: string;
  receive_date: string;
  return_date: string;
}

export interface ActiveWorker {
  id: string;
  name: string;
  worker_type: string;
}

export interface UnassignedOrder extends RepairOrder {
  activeWorkers?: ActiveWorker[];
}

export interface ScheduleItem extends LiftAssignment {
  order: RepairOrder;
  activeWorkers?: ActiveWorker[];
}

export type ViewMode = 'day' | 'week';

export interface PositionRow {
  id: string;
  name: string;
  type: 'lift' | 'position';
}

export const HOURS = Array.from({ length: 30 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const minute = i % 2 === 0 ? '30' : '00';
  if (hour === 7 && minute === '00') return null;
  if (hour > 22) return null;
  return `${hour.toString().padStart(2, '0')}:${minute}`;
}).filter(Boolean) as string[];

export const WEEK_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
