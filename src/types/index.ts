export type UserRole = 'admin' | 'guard' | 'supervisor'

export interface AppUser {
  id: string
  name: string
  username: string
  role: UserRole
  avatar_url: string | null
  is_active: boolean
  created_at: string
}

export interface UserPermissions {
  id: string
  user_id: string
  setup_management: boolean
  parking_system: boolean
  surveillance_logs: boolean
  cctv_audit: boolean
  guard_attendance: boolean
  incident_reports: boolean
  reports: boolean
}

export interface Guard {
  id: string
  name: string
  phone: string | null
  id_number: string | null
  photo_url: string | null
  status: 'active' | 'inactive'
  created_at: string
}

export interface Attendance {
  id: string
  guard_id: string
  date: string
  status: 'present' | 'absent' | 'day_off' | 'leave'
  shift: 'day' | 'night' | null
  location: string | null
  remarks: string | null
  check_in_time: string | null
  check_out_time: string | null
  guard?: Guard
}

export interface DutyRotation {
  id: string
  guard_id: string
  location: string
  shift: 'day' | 'night'
  start_date: string
  end_date: string
  guard?: Guard
}

export interface ParkingRecord {
  id: string
  plate_number: string
  vehicle_model: string | null
  color: string | null
  parking_slot: string | null
  entry_time: string
  exit_time: string | null
  duration_minutes: number | null
  total_duration_display: string | null
  remarks: string | null
  created_at: string
}

export interface Setup {
  id: string
  company_name: string
  supervisor_name: string
  supervisor_phone: string | null
  location: string
  setup_datetime: string
  status: 'active' | 'dismantled'
  photo_before_1: string | null
  photo_before_2: string | null
  photo_before_3: string | null
  photo_during_1: string | null
  photo_during_2: string | null
  photo_during_3: string | null
  photo_after_1: string | null
  photo_after_2: string | null
  photo_after_3: string | null
  photo_dismantle_1: string | null
  photo_dismantle_2: string | null
  photo_dismantle_3: string | null
  dismantle_date: string | null
  clearance_approved_by: string | null
  created_at: string
}

export interface SetupItem {
  id: string
  setup_id: string
  item_name: string
  quantity: number
  condition: string | null
}

export interface SurveillanceLog {
  id: string
  location: string
  log_time: string
  total_persons: number
  male_count: number
  female_count: number
  kids_count: number
  elderly_count: number
  suspicious_activity: boolean
  notes: string | null
  created_at: string
}

export interface CCTVCamera {
  id: string
  camera_name: string
  location: string
  status: 'working' | 'not_working' | 'under_maintenance'
  last_checked: string | null
  notes: string | null
  screenshot_url: string | null
  technician_name: string | null
}

export interface Incident {
  id: string
  incident_type: string
  location: string
  incident_datetime: string
  description: string
  photo_url: string | null
  photo_url_2: string | null
  action_taken: string | null
  created_at: string
}

export interface AuthUser {
  id: string
  name: string
  username: string
  role: UserRole
  avatar_url: string | null
  permissions: UserPermissions | null
}