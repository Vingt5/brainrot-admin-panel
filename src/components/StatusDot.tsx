import { cn } from '@/lib/utils';
import type { ActiveRollStatus, BotStatus } from '@/lib/types';

const statusConfig: Record<string, { label: string; dotClass: string; textClass: string }> = {
  running: { label: 'Running', dotClass: 'bg-status-online', textClass: 'text-status-online' },
  stopped: { label: 'Stopped', dotClass: 'bg-status-offline', textClass: 'text-status-offline' },
  error: { label: 'Error', dotClass: 'bg-status-error', textClass: 'text-status-error' },
  unknown: { label: 'Unknown', dotClass: 'bg-status-warning', textClass: 'text-status-warning' },
  active: { label: 'Active', dotClass: 'bg-status-online', textClass: 'text-status-online' },
  claimed: { label: 'Claimed', dotClass: 'bg-rarity-rare', textClass: 'text-rarity-rare' },
  expired: { label: 'Expired', dotClass: 'bg-status-offline', textClass: 'text-status-offline' },
};

export function StatusDot({ status, className }: { status: BotStatus | ActiveRollStatus; className?: string }) {
  const config = statusConfig[status] || statusConfig.unknown;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs', className)}>
      <span className={cn('h-2 w-2 rounded-full', config.dotClass, status === 'running' && 'animate-pulse-glow')} />
      <span className={cn('font-medium', config.textClass)}>{config.label}</span>
    </span>
  );
}
