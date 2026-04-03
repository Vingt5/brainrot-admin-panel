import { useState } from 'react';
import { TopBar } from '@/components/TopBar';
import { StatusDot } from '@/components/StatusDot';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { mockRuntimeStatus, mockMaintenanceTasks, mockDataHealth } from '@/lib/mock-data';
import { toast } from 'sonner';
import {
  Server,
  Play,
  Square,
  RotateCcw,
  Activity,
  Clock,
  Cpu,
  Database,
  Wrench,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  Terminal,
} from 'lucide-react';

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}j ${h}h ${m}m`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const maintenanceActions = [
  { id: 'db:init', label: 'DB Init', description: 'Créer la DB et appliquer les migrations', icon: Database, destructive: false },
  { id: 'db:seed', label: 'DB Seed', description: 'Synchroniser le catalogue depuis le seed JSON', icon: Database, destructive: false },
  { id: 'assets:sync', label: 'Assets Sync', description: 'Télécharger les images manquantes', icon: FileText, destructive: false },
  { id: 'catalog:generate', label: 'Catalog Generate', description: 'Générer le catalogue statique', icon: FileText, destructive: false },
  { id: 'deploy:commands', label: 'Deploy Commands', description: 'Enregistrer les slash commands Discord', icon: Terminal, destructive: true },
];

function ConfirmActionButton({
  label,
  description,
  icon: Icon,
  destructive,
  onConfirm,
}: {
  label: string;
  description: string;
  icon: typeof Play;
  destructive: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={destructive ? 'destructive' : 'secondary'}
          size="sm"
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
          <AlertDialogAction onClick={onConfirm} className={destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}>
            Exécuter
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function RuntimePage() {
  const runtime = mockRuntimeStatus;
  const tasks = mockMaintenanceTasks;
  const health = mockDataHealth;

  const handleRuntimeAction = (action: string) => {
    toast.info(`Action "${action}" envoyée (mock)`, { description: "En mode mock, aucune action n'est réellement exécutée." });
  };

  const handleMaintenanceAction = (action: string) => {
    toast.info(`Tâche "${action}" lancée (mock)`, { description: "Connectez l'API admin pour exécuter réellement." });
  };

  return (
    <>
      <TopBar title="Runtime & Maintenance" subtitle="Contrôle du bot et opérations d'exploitation" />
      <main className="flex-1 overflow-auto p-6 space-y-6">
        {/* Runtime status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                État du bot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</p>
                  <StatusDot status={runtime.status} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">PID</p>
                  <p className="font-mono text-sm text-foreground">{runtime.pid || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Uptime</p>
                  <p className="text-sm text-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {runtime.uptime ? formatUptime(runtime.uptime) : '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Mémoire</p>
                  <p className="text-sm text-foreground flex items-center gap-1">
                    <Cpu className="h-3 w-3 text-muted-foreground" />
                    {runtime.memoryUsageMb ? `${runtime.memoryUsageMb.toFixed(0)} MB` : '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Démarré le</p>
                  <p className="text-sm text-foreground">{formatDate(runtime.lastStartedAt)}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border">
                <ConfirmActionButton label="Start" description="Démarrer le bot Discord" icon={Play} destructive={false} onConfirm={() => handleRuntimeAction('start')} />
                <ConfirmActionButton label="Stop" description="Arrêter le bot proprement" icon={Square} destructive={true} onConfirm={() => handleRuntimeAction('stop')} />
                <ConfirmActionButton label="Restart" description="Redémarrer le bot" icon={RotateCcw} destructive={true} onConfirm={() => handleRuntimeAction('restart')} />
              </div>

              <div className="p-3 rounded-md bg-warning/5 border border-warning/20">
                <p className="text-[10px] uppercase tracking-wider text-warning font-medium mb-1">⚠️ Contrôle local uniquement</p>
                <p className="text-xs text-muted-foreground">Le runtime control fonctionne uniquement si le panel admin et le bot tournent sur la même machine.</p>
              </div>
            </CardContent>
          </Card>

          {/* Migrations */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                Migrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {health.migrationsApplied.map((m) => (
                <div key={m} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="h-3 w-3 text-status-online shrink-0" />
                  <span className="font-mono text-foreground truncate">{m}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Maintenance actions */}
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
                  onConfirm={() => handleMaintenanceAction(action.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Task history */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Historique des tâches
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {tasks.map((task) => (
                <div key={task.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-center gap-3">
                    {task.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-status-online shrink-0" />}
                    {task.status === 'failed' && <XCircle className="h-3.5 w-3.5 text-status-error shrink-0" />}
                    {task.status === 'running' && <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />}
                    {task.status === 'pending' && <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
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
                    {task.logs.map((log, i) => (
                      <p key={i} className="text-[11px] font-mono text-muted-foreground leading-relaxed">
                        {log}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
