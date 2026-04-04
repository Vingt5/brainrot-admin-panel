import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Dices, Hash, MessageSquare, TriangleAlert, User } from 'lucide-react';

import { RarityBadge } from '@/components/RarityBadge';
import { ResultsPagination } from '@/components/ResultsPagination';
import { StatusDot } from '@/components/StatusDot';
import { TopBar } from '@/components/TopBar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchRolls } from '@/lib/api';
import type { ActiveRollRecord } from '@/lib/types';

function formatDate(iso: string | null): string {
  if (!iso) {
    return '--';
  }

  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatExpiresAt(iso: string): string {
  const date = new Date(iso);

  if (date.getUTCFullYear() >= 9000) {
    return 'Non expirant';
  }

  return formatDate(iso);
}

function RollDetailSheet({
  roll,
  open,
  onOpenChange
}: {
  roll: ActiveRollRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[520px] sm:max-w-[520px] bg-card border-border overflow-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground flex items-center gap-2">
            <Dices className="h-4 w-4 text-primary" />
            Roll #{roll?.id ?? '--'}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Details complets du roll selectionne, avec son contexte Discord et ses identifiants lies.
          </SheetDescription>
        </SheetHeader>

        {roll && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusDot status={roll.status} />
              {roll.brainrotRarity && <RarityBadge rarity={roll.brainrotRarity} />}
              {roll.status === 'expired' && (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  Legacy expired
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-md bg-muted/50 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Brainrot</p>
                <p className="text-sm text-foreground">{roll.brainrotName ?? '--'}</p>
                <p className="text-[11px] font-mono text-muted-foreground">{roll.brainrotSlug ?? '--'}</p>
              </div>
              <div className="p-3 rounded-md bg-muted/50 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Guild ID</p>
                <p className="text-sm font-mono text-foreground">{roll.guildId}</p>
              </div>
              <div className="p-3 rounded-md bg-muted/50 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Channel ID</p>
                <p className="text-sm font-mono text-foreground">{roll.channelId}</p>
              </div>
              <div className="p-3 rounded-md bg-muted/50 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Message ID</p>
                <p className="text-sm font-mono text-foreground">{roll.messageId ?? '--'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-md bg-muted/50 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Rolled by</p>
                <p className="text-sm text-foreground">{roll.rolledByUsername ?? '--'}</p>
                <p className="text-[11px] text-muted-foreground">Player #{roll.rolledByPlayerId}</p>
              </div>
              <div className="p-3 rounded-md bg-muted/50 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Claimed by</p>
                <p className="text-sm text-foreground">{roll.claimedByUsername ?? '--'}</p>
                <p className="text-[11px] text-muted-foreground">
                  {roll.claimedByPlayerId ? `Player #${roll.claimedByPlayerId}` : '--'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-md bg-muted/50 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Created at</p>
                <p className="text-sm text-foreground">{formatDate(roll.createdAt)}</p>
              </div>
              <div className="p-3 rounded-md bg-muted/50 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Claimed at</p>
                <p className="text-sm text-foreground">{formatDate(roll.claimedAt)}</p>
              </div>
              <div className="p-3 rounded-md bg-muted/50 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Expires at</p>
                <p className="text-sm text-foreground">{formatExpiresAt(roll.expiresAt)}</p>
              </div>
              <div className="p-3 rounded-md bg-muted/50 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Updated at</p>
                <p className="text-sm text-foreground">{formatDate(roll.updatedAt)}</p>
              </div>
            </div>

            <div className="p-3 rounded-md bg-muted/40 border border-border">
              <p className="text-xs text-muted-foreground">
                Les rolls en statut <span className="font-medium text-foreground">expired</span> sont traites
                comme des enregistrements legacy : le gameplay actuel utilise des rolls non expirants.
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function RollsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRoll, setSelectedRoll] = useState<ActiveRollRecord | null>(null);

  const rollsQuery = useQuery({
    queryKey: ['rolls', page, statusFilter],
    queryFn: () =>
      fetchRolls({
        page,
        status: statusFilter === 'all' ? undefined : statusFilter
      }),
    refetchInterval: 10000
  });

  const rolls = rollsQuery.data?.data ?? [];
  const error = rollsQuery.error;

  return (
    <>
      <TopBar title="Rolls" subtitle={`${rollsQuery.data?.total ?? 0} rolls traces`}>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-40 bg-muted border-border text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="claimed">Claimed</SelectItem>
            <SelectItem value="expired">Expired legacy</SelectItem>
          </SelectContent>
        </Select>
      </TopBar>

      <main className="flex-1 overflow-auto p-6 space-y-4">
        {error && (
          <Alert variant="destructive">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>Rolls indisponibles</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Impossible de charger les rolls.'}
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Brainrot</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Rolled by</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Claimed by</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Guild / Channel</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rollsQuery.isLoading
                  ? Array.from({ length: 8 }, (_, index) => (
                      <TableRow key={index} className="border-border">
                        <TableCell colSpan={6}>
                          <Skeleton className="h-10 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  : rolls.map((roll) => (
                      <TableRow
                        key={roll.id}
                        className="border-border cursor-pointer hover:bg-accent/50"
                        onClick={() => setSelectedRoll(roll)}
                      >
                        <TableCell>
                          <StatusDot status={roll.status} />
                        </TableCell>
                        <TableCell className="min-w-[220px]">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">{roll.brainrotName ?? '--'}</p>
                            <div className="flex items-center gap-2">
                              {roll.brainrotRarity && <RarityBadge rarity={roll.brainrotRarity} />}
                              <span className="text-[11px] font-mono text-muted-foreground">{roll.brainrotSlug ?? '--'}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-foreground">
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {roll.rolledByUsername ?? '--'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-foreground">{roll.claimedByUsername ?? '--'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {roll.guildId}
                            </div>
                            <div className="inline-flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {roll.channelId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(roll.createdAt)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>

            {!rollsQuery.isLoading && rolls.length === 0 && (
              <div className="p-8 text-sm text-muted-foreground">Aucun roll pour ce filtre.</div>
            )}

            {rollsQuery.data && rollsQuery.data.total > 0 && (
              <ResultsPagination
                page={rollsQuery.data.page}
                pageSize={rollsQuery.data.pageSize}
                total={rollsQuery.data.total}
                onPageChange={setPage}
              />
            )}
          </CardContent>
        </Card>

        <RollDetailSheet
          roll={selectedRoll}
          open={selectedRoll !== null}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedRoll(null);
            }
          }}
        />
      </main>
    </>
  );
}
