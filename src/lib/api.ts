import type {
  BrainrotAdminView,
  DashboardKPIs,
  DataHealthCheck,
  GuildRecord,
  InventoryEntry,
  LeaderboardEntry,
  MaintenanceTask,
  PlayerAdminView,
  PlayerProfileStats,
  ActiveRollRecord,
  RuntimeStatus,
} from './types';

const API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:3100';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = import.meta.env.VITE_ADMIN_API_TOKEN || '';
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

// Dashboard
export const fetchDashboardKPIs = () => apiFetch<DashboardKPIs>('/api/admin/dashboard/kpis');
export const fetchDataHealth = () => apiFetch<DataHealthCheck>('/api/admin/dashboard/health');

// Runtime
export const fetchRuntimeStatus = () => apiFetch<RuntimeStatus>('/api/admin/runtime/status');
export const startBot = () => apiFetch<{ ok: boolean }>('/api/admin/runtime/start', { method: 'POST' });
export const stopBot = () => apiFetch<{ ok: boolean }>('/api/admin/runtime/stop', { method: 'POST' });
export const restartBot = () => apiFetch<{ ok: boolean }>('/api/admin/runtime/restart', { method: 'POST' });

// Players
export const fetchPlayers = (params?: { page?: number; search?: string }) => {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.search) qs.set('search', params.search);
  return apiFetch<{ data: PlayerAdminView[]; total: number; page: number; pageSize: number }>(
    `/api/admin/players?${qs}`
  );
};
export const fetchPlayerDetail = (id: number) => apiFetch<PlayerAdminView>(`/api/admin/players/${id}`);
export const fetchPlayerStats = (id: number) => apiFetch<PlayerProfileStats>(`/api/admin/players/${id}/stats`);
export const fetchPlayerInventory = (id: number) => apiFetch<InventoryEntry[]>(`/api/admin/players/${id}/inventory`);

// Brainrots
export const fetchBrainrots = (params?: { page?: number; search?: string; rarity?: string }) => {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.search) qs.set('search', params.search);
  if (params?.rarity) qs.set('rarity', params.rarity);
  return apiFetch<{ data: BrainrotAdminView[]; total: number; page: number; pageSize: number }>(
    `/api/admin/brainrots?${qs}`
  );
};
export const fetchBrainrotDetail = (id: number) => apiFetch<BrainrotAdminView>(`/api/admin/brainrots/${id}`);

// Guilds
export const fetchGuilds = () => apiFetch<GuildRecord[]>('/api/admin/guilds');

// Rolls
export const fetchRolls = (params?: { page?: number; status?: string }) => {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.status) qs.set('status', params.status);
  return apiFetch<{ data: ActiveRollRecord[]; total: number; page: number; pageSize: number }>(
    `/api/admin/rolls?${qs}`
  );
};

// Leaderboard
export const fetchLeaderboard = (guildId: number) =>
  apiFetch<LeaderboardEntry[]>(`/api/admin/leaderboard/${guildId}`);

// Maintenance
export const fetchMaintenanceTasks = () => apiFetch<MaintenanceTask[]>('/api/admin/maintenance/tasks');
export const runMaintenanceAction = (action: string) =>
  apiFetch<MaintenanceTask>('/api/admin/maintenance/run', { method: 'POST', body: JSON.stringify({ action }) });
