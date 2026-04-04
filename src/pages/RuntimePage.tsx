import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  FileText,
  Loader2,
  Play,
  RotateCcw,
  Server,
  Square,
  Terminal,
  TriangleAlert,
  Wrench,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

import { StatusDot } from '@/components/StatusDot';
import { TopBar } from '@/components/TopBar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  fetchDataHealth,
  fetchMaintenanceTasks,
  fetchRuntimeStatus,
  restartBot,
  runMaintenanceAction,
  startBot,
  stopBot
} from '@/lib/api';

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}j ${hours}h ${minutes}m`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '--';

  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

const maintenanceActions = [
  {
    id: 'db:init',
    label: 'DB Init',
    description: 'Creer la DB et appliquer les migrations',
    icon: Database,
    destructive: false
  },
  {
    id: 'db:seed',
    label: 'DB Seed',
    description: 'Synchroniser le catalogue depuis le seed JSON',
    icon: Database,
    destructive: false
  },
  {
    id: 'assets:sync',
    label: 'Assets Sync',
    description: 'Telecharger les images manquantes',
    icon: FileText,
    destructive: false
  },
  {
    id: 'catalog:generate',
    label: 'Catalog Generate',
    description: 'Regenerer le catalogue statique',
    icon: FileText,
    destructive: false
  },
  {
    id: 'deploy:commands',
    label: 'Deploy Commands',
    description: 'Redeployer les slash commands Discord',
    icon: Terminal,
    destructive: true
  }
];

function ConfirmActionButton({
  label,
  description,
  icon: Icon,
  destructive,
  disabled,
  onConfirm
}: {
  label: string;
  description: string;
  icon: typeof Play;
  destructive: boolean;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={destructive ? 'destructive' : 'secondary'}
          size="sm"
          disabled={disabled}
          className="h-auto py-3 px-4 flex flex-col items-start gap-1 w-full text-left"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <Icon className="h-3.5 w-3.5" />
            {label}
          </span>
          <span className="text-[10px] opacity-70 font-normal">{description}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">Confirmer : {label}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border">Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            Executer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function RuntimePage() {
  const queryClient = useQueryClient();

  const runtimeQuery = useQuery({
    queryKey: ['runtime-status'],
    queryFn: fetchRuntimeStatus,
    refetchInterval: 5000
  });
  const tasksQuery = useQuery({
    queryKey: ['maintenance-tasks'],
    queryFn: fetchMaintenanceTasks,
    refetchInterval: 4000
  });
  const healthQuery = useQuery({
    queryKey: ['data-health'],
    queryFn: fetchDataHealth,
    refetchInterval: 15000
  });

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['runtime-status'] }),
      queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['data-health'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] })
    ]);
  };

  const runtimeMutation = useMutation({
    mutationFn: async (action: 'start' | 'stop' | 'restart') => {
      if (action === 'start') return startBot();
      if (action === 'stop') return stopBot();
      return restartBot();
    },
    onSuccess: async (_data, action) => {
      toast.success(`Action ${action} envoyee.`);
      await refreshAll();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Action runtime impossible.');
    }
  });

  const maintenanceMutation = useMutation({
    mutationFn: runMaintenanceAction,
    onSuccess: async (task) => {
      toast.success(`Tache ${task.name} lancee.`);
      await refreshAll();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Tache de maintenance impossible.');
    }
  });

  const runtime = runtimeQuery.data;
  const tasks = tasksQuery.data ?? [];
  const health = healthQuery.data;
  const error = runtimeQuery.error || tasksQuery.error || healthQuery.error;

  return (
    <>
      <TopBar title="Runtime & Maintenance" subtitle="Controle du bot et operations locales" />
      <main className="flex-1 overflow-auto p-6 space-y-6">
        {error && (
          <Alert variant="destructive">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>API admin inaccessible</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Impossible de charger la page runtime.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                Etat du bot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {runtime ? (
                <>
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</p>
                      <StatusDot status={runtime.status} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">PID</p>
                      <p className="font-mono text-sm text-foreground">{runtime.pid || '--'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Uptime</p>
                      <p className="text-sm text-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {runtime.uptime !== null ? formatUptime(runtime.uptime) : '--'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Memoire</p>
                      <p className="text-sm text-foreground flex items-center gap-1">
                        <Cpu className="h-3 w-3 text-muted-foreground" />
                        {runtime.memoryUsageMb !== null ? `${runtime.memoryUsageMb.toFixed(1)} MB` : '--'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Demarre le</p>
                      <p className="text-sm text-foreground">{formatDate(runtime.lastStartedAt)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-border">
                    <ConfirmActionButton
                      label="Start"
                      description="Demarrer le bot Discord"
                      icon={Play}
                      destructive={false}
                      disabled={runtimeMutation.isPending || runtime?.status === 'running'}
                      onConfirm={() => runtimeMutation.mutate('start')}
                    />
                    <ConfirmActionButton
                      label="Stop"
                      description="Arreter le bot proprement"
                      icon={Square}
                      destructive={true}
                      disabled={runtimeMutation.isPending || runtime?.status !== 'running'}
                      onConfirm={() => runtimeMutation.mutate('stop')}
                    />
                    <ConfirmActionButton
                      label="Restart"
                      description="Redemarrer le bot"
                      icon={RotateCcw}
                      destructive={true}
                      disabled={runtimeMutation.isPending || runtime?.status !== 'running'}
                      onConfirm={() => runtimeMutation.mutate('restart')}
                    />
                  </div>
                </>
              ) : (
                <Skeleton className="h-40 w-full" />
              )}

              <div className="p-3 rounded-md bg-warning/5 border border-warning/20">
                <p className="text-[10px] uppercase tracking-wider text-warning font-medium mb-1">
                  Controle local uniquement
                </p>
                <p className="text-xs text-muted-foreground">
                  Le runtime control fonctionne uniquement si le panel admin et le bot tournent sur la meme machine.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                Migrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {health ? (
                health.migrationsApplied.map((migration) => (
                  <div key={migration} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-status-online shrink-0" />
                    <span className="font-mono text-foreground truncate">{migration}</span>
                  </div>
                ))
              ) : (
                <>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              Actions de maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {maintenanceActions.map((action) => (
                <ConfirmActionButton
                  key={action.id}
                  label={action.label}
                  description={action.description}
                  icon={action.icon}
                  destructive={action.destructive}
                  disabled={maintenanceMutation.isPending}
                  onConfirm={() => maintenanceMutation.mutate(action.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Historique des taches
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {tasksQuery.isLoading && tasks.length === 0 ? (
                Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="px-4 py-3">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))
              ) : tasks.length > 0 ? (
                tasks.map((task) => (
                  <div key={task.id} className="px-4 py-3 space-y-2">
                    <div className="flex items-center gap-3">
                      {task.status === 'completed' && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-status-online shrink-0" />
                      )}
                      {task.status === 'failed' && (
                        <XCircle className="h-3.5 w-3.5 text-status-error shrink-0" />
                      )}
                      {task.status === 'running' && (
                        <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                      )}
                      {task.status === 'pending' && (
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-sm font-mono text-foreground">{task.name}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          task.status === 'completed'
                            ? 'text-status-online border-status-online/30'
                            : task.status === 'failed'
                              ? 'text-status-error border-status-error/30'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {task.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground ml-auto">{formatDate(task.startedAt)}</span>
                    </div>
                    <div className="ml-7 space-y-0.5">
                      {task.logs.map((log, index) => (
                        <p key={`${task.id}-${index}`} className="text-[11px] font-mono text-muted-foreground leading-relaxed">
                          {log}
                        </p>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-sm text-muted-foreground">Aucune tache encore executee.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
