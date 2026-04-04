import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  CheckCircle2,
  Database,
  Dices,
  Heart,
  Server,
  Sparkles,
  Users,
  Package,
  TriangleAlert,
  Star
} from 'lucide-react';

import { KPICard } from '@/components/KPICard';
import { StatusDot } from '@/components/StatusDot';
import { TopBar } from '@/components/TopBar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDashboardKPIs, fetchDataHealth, fetchRolls, fetchRuntimeStatus } from '@/lib/api';

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}j ${hours}h ${minutes}m`;
}

export default function DashboardPage() {
  const kpisQuery = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: fetchDashboardKPIs,
    refetchInterval: 10000
  });
  const runtimeQuery = useQuery({
    queryKey: ['runtime-status'],
    queryFn: fetchRuntimeStatus,
    refetchInterval: 5000
  });
  const healthQuery = useQuery({
    queryKey: ['data-health'],
    queryFn: fetchDataHealth,
    refetchInterval: 15000
  });
  const recentRollsQuery = useQuery({
    queryKey: ['recent-rolls'],
    queryFn: () => fetchRolls({ page: 1 }),
    refetchInterval: 10000
  });

  const isLoading =
    kpisQuery.isLoading || runtimeQuery.isLoading || healthQuery.isLoading || recentRollsQuery.isLoading;
  const error =
    kpisQuery.error || runtimeQuery.error || healthQuery.error || recentRollsQuery.error;

  const kpis = kpisQuery.data;
  const runtime = runtimeQuery.data;
  const health = healthQuery.data;
  const recentRolls = recentRollsQuery.data?.data.slice(0, 5) ?? [];

  return (
    <>
      <TopBar title="Dashboard" subtitle="Vue d'ensemble du bot" />
      <main className="flex-1 overflow-auto p-6 space-y-6">
        {error && (
          <Alert variant="destructive">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>API admin inaccessible</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Impossible de charger le dashboard.'}
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-6 flex-wrap">
            {isLoading && !runtime ? (
              <>
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
              </>
            ) : runtime ? (
              <>
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Bot status:</span>
                  <StatusDot status={runtime.status} />
                </div>
                {runtime.pid && (
                  <div className="text-xs text-muted-foreground">
                    PID <span className="font-mono text-foreground">{runtime.pid}</span>
                  </div>
                )}
                {runtime.uptime !== null && (
                  <div className="text-xs text-muted-foreground">
                    Uptime <span className="font-mono text-foreground">{formatUptime(runtime.uptime)}</span>
                  </div>
                )}
                {runtime.memoryUsageMb !== null && (
                  <div className="text-xs text-muted-foreground">
                    RAM <span className="font-mono text-foreground">{runtime.memoryUsageMb.toFixed(1)} MB</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune information runtime disponible.</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {isLoading && !kpis
            ? Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-28 w-full" />)
            : kpis && (
                <>
                  <KPICard title="Players" value={kpis.totalPlayers} icon={Users} />
                  <KPICard title="Guilds" value={kpis.totalGuilds} icon={Server} />
                  <KPICard title="Brainrots" value={kpis.totalBrainrots} icon={Sparkles} />
                  <KPICard
                    title="Rolls totaux"
                    value={kpis.totalRolls}
                    icon={Dices}
                    subtitle={`${kpis.activeRolls} actifs`}
                  />
                  <KPICard title="Inventaire" value={kpis.totalInventoryEntries} icon={Package} />
                </>
              )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <Dices className="h-4 w-4 text-primary" />
                Rolls recents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentRolls.length > 0 ? (
                  recentRolls.map((roll) => (
                    <div key={roll.id} className="px-4 py-3 flex items-center gap-3 text-sm">
                      <StatusDot status={roll.status} />
                      <span className="text-foreground font-medium truncate flex-1">{roll.brainrotName}</span>
                      <span className="text-muted-foreground text-xs">par {roll.rolledByUsername ?? 'unknown'}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-sm text-muted-foreground">Aucun roll recent disponible.</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                Sante des donnees
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {health ? (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(health.tableCounts).map(([table, count]) => (
                      <div key={table} className="text-center p-2 rounded-md bg-muted/50">
                        <p className="text-lg font-semibold text-foreground tabular-nums">{count}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{table}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-status-online" />
                      {health.migrationsApplied.length} migration(s) appliquee(s)
                    </p>
                    {health.inconsistencies.length === 0 ? (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-status-online" />
                        Aucune incoherence detectee
                      </p>
                    ) : (
                      health.inconsistencies.map((item) => (
                        <p key={item} className="text-xs text-status-error">
                          {item}
                        </p>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <Skeleton className="h-40 w-full" />
              )}
            </CardContent>
          </Card>
        </div>

        {kpis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard title="Wishes" value={kpis.totalWishes} icon={Star} />
            <KPICard title="Favorites" value={kpis.totalFavorites} icon={Heart} />
            <KPICard title="Claimed" value={kpis.claimedRolls} icon={CheckCircle2} />
            <KPICard title="Active rolls" value={kpis.activeRolls} icon={Activity} />
          </div>
        )}
      </main>
    </>
  );
}
