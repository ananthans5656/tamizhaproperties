import client from './client';

export interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  totalLeads: number;
  annualRevenue: number;       // in lakhs
  landBank: number;            // ground units from DB
  avgDealSize: number;         // in lakhs
  conversionRate: number;
  closedLeads?: number;
  soldProperties?: number;     // properties with status='Sold'
  hotLeads?: number;
  warmLeads?: number;
  thisMonthProps?: number;
  lastMonthProps?: number;
  thisMonthLeads?: number;
  lastMonthLeads?: number;
  thisMonthRevenue?: number;   // lakhs this month
  lastMonthRevenue?: number;   // lakhs last month
  avgDealCycleDays?: number | null;
}

export interface RevenueMonth {
  month: string;
  revenue: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  pct: number;
}

export interface DistrictPerf {
  district: string;
  listed: number;
  sold: number;
}

export interface AgentRow {
  rank: number;
  name: string;
  deals: number;
  volume: string;
  rating: number;
  trend: number;
  tc: string;
}

export interface MonthlyConversion {
  month: string;
  total: number;
  closed: number;
  rate: number;
}

export const reportsApi = {
  getDashboard: () =>
    client.get<DashboardStats>('/reports/dashboard').then(r => r.data),

  getRevenue: () =>
    client.get<RevenueMonth[]>('/reports/revenue').then(r => r.data),

  getFunnel: () =>
    client.get<FunnelStage[]>('/reports/funnel').then(r => r.data),

  getDistricts: () =>
    client.get<DistrictPerf[]>('/reports/districts').then(r => r.data),

  getAgents: () =>
    client.get<AgentRow[]>('/reports/agents').then(r => r.data),

  getMonthlyConversion: () =>
    client.get<MonthlyConversion[]>('/reports/monthly-conversion').then(r => r.data),
};
