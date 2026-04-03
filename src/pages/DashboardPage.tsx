import { TopBar } from '@/components/TopBar';
import { KPICard } from '@/components/KPICard';
import { StatusDot } from '@/components/StatusDot';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockDashboardKPIs, mockRuntimeStatus, mockDataHealth, mockRolls } from '@/lib/mock-data';
import {
  Users,
  Server,
  Sparkles,
  Dices,
  Package,
  Heart,
  Star,
  Database,
  Activity,
  CheckCircle2,
} from 'lucide-react';

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}j ${h}h ${m}m`;
}

export default function DashboardPage() {
  const kpis = mockDashboardKPIs;
  const runtime = mockRuntimeStatus;
  const health = mockDataHealth;
  const recentRolls = mockRolls.slice(0, 5);

  return (
    <>
      <TopBar title="Dashboard" subtitle="Vue d'ensemble du bot" />
      <main className="flex-1 overflow-auto p-6 space-y-6">
        {/* Runtime status bar */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Bot Status:</span>
              <StatusDot status={runtime.status} />
            </div>
            {runtime.pid && (
              <div className="text-xs text-muted-foreground">
                PID <span className="font-mono text-foreground">{runtime.pid}</span>
              </div>
            )}
            {runtime.uptime && (
              <div className="text-xs text-muted-foreground">
                Uptime <span className="font-mono text-foreground">{formatUptime(runtime.uptime)}</span>
              </div>
            )}
            {runtime.memoryUsageMb && (
              <div className="text-xs text-muted-foreground">
                RAM <span className="font-mono text-foreground">{runtime.memoryUsageMb.toFixed(0)} MB</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <KPICard title="Players" value={kpis.totalPlayers} icon={Users} />
          <KPICard title="Guilds" value={kpis.totalGuilds} icon={Server} />
          <KPICard title="Brainrots" value={kpis.totalBrainrots} icon={Sparkles} />
          <KPICard title="Rolls totaux" value={kpis.totalRolls} icon={Dices} subtitle={`${kpis.activeRolls} actifs`} />
          <KPICard title="Inventaire" value={kpis.totalInventoryEntries} icon={Package} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent rolls */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <Dices className="h-4 w-4 text-primary" />
                Rolls récents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentRolls.map((roll) => (
                  <div key={roll.id} className="px-4 py-3 flex items-center gap-3 text-sm">
                    <StatusDot status={roll.status} />
                    <span className="text-foreground font-medium truncate flex-1">{roll.brainrotName}</span>
                    <span className="text-muted-foreground text-xs">par {roll.rolledByUsername}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data health */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                Santé des données
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  {health.migrationsApplied.length} migrations appliquées
                </p>
                {health.inconsistencies.length === 0 ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-status-online" />
                    Aucune incohérence détectée
                  </p>
                ) : (
                  health.inconsistencies.map((inc, i) => (
                    <p key={i} className="text-xs text-status-error">{inc}</p>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Wishes" value={kpis.totalWishes} icon={Star} />
          <KPICard title="Favorites" value={kpis.totalFavorites} icon={Heart} />
          <KPICard title="Claimed" value={kpis.claimedRolls} icon={CheckCircle2} />
          <KPICard title="Active rolls" value={kpis.activeRolls} icon={Activity} />
        </div>
      </main>
    </>
  );
}
