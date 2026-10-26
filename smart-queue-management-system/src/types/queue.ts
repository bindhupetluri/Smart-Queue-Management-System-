export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'staff' | 'admin';
  created_at?: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  is_active: number;
  waiting_count?: number;
  serving_count?: number;
}

export interface ServiceItem {
  id: number;
  department_id: number;
  name: string;
  description?: string;
  avg_duration_mins: number;
  base_priority: number;
  is_active: number;
}

export interface ServiceCounter {
  id: number;
  counter_number: number;
  name: string;
  department_id?: number;
  current_staff_id?: number;
  staff_name?: string;
  department_name?: string;
  status: 'open' | 'busy' | 'closed';
}

export interface QueueToken {
  id: number;
  token_number: string;
  user_id?: number;
  customer_name: string;
  customer_phone?: string;
  department_id: number;
  service_id: number;
  counter_id?: number;
  status: 'waiting' | 'serving' | 'completed' | 'cancelled' | 'skipped';
  priority_level: number; // 0: Normal, 1: Senior/Disability, 2: Emergency
  priority_reason?: string;
  estimated_wait_mins: number;
  actual_wait_mins?: number;
  service_duration_mins?: number;
  issue_time: string;
  call_time?: string;
  start_service_time?: string;
  completion_time?: string;
  notes?: string;
  department_name?: string;
  department_code?: string;
  service_name?: string;
  counter_number?: number;
  counter_name?: string;
  customers_ahead?: number;
}

export interface DisplayFeedData {
  timestamp: string;
  serving: Array<{
    id: number;
    token_number: string;
    customer_name: string;
    priority_level: number;
    call_time: string;
    department_name: string;
    department_code: string;
    service_name: string;
    counter_number: number;
    counter_name: string;
  }>;
  upcoming: Array<{
    id: number;
    token_number: string;
    customer_name: string;
    priority_level: number;
    priority_reason?: string;
    estimated_wait_mins: number;
    issue_time: string;
    department_name: string;
    department_code: string;
    service_name: string;
  }>;
  recentlyCompleted: Array<{
    id: number;
    token_number: string;
    completion_time: string;
    service_duration_mins?: number;
    department_name: string;
    counter_number?: number;
  }>;
  departmentsSummary?: Array<{
    id: number;
    name: string;
    code: string;
    waiting_count: number;
    serving_count: number;
    avg_wait_mins: number;
  }>;
}

export interface AnalyticsData {
  totals: {
    total_tokens: number;
    waiting_tokens: number;
    serving_tokens: number;
    completed_tokens: number;
    skipped_tokens: number;
    cancelled_tokens: number;
    avg_actual_wait_mins: number;
    avg_service_duration_mins: number;
  };
  hourly: Array<{ hour: string; count: number; avg_wait?: number }>;
  mlValidation: Array<{
    token_number: string;
    estimated_wait_mins: number;
    actual_wait_mins: number;
    service_duration_mins: number;
    absolute_error: number;
  }>;
  deptPerformance: Array<{
    name: string;
    code: string;
    total_tokens: number;
    completed: number;
    avg_wait_mins: number;
  }>;
  mlModelMetadata: {
    algorithm: string;
    features: Array<{ name: string; weight: string }>;
    meanAbsoluteErrorMins: number;
    accuracyPercentage: number;
    recommendation: string;
  };
}

export interface NotificationItem {
  id: number;
  user_id?: number;
  token_id?: number;
  title: string;
  message: string;
  is_read: number;
  type: 'info' | 'success' | 'warning' | 'alert';
  created_at: string;
}
